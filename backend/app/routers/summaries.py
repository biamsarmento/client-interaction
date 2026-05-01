import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app import models, auth
from app.services import telegram as tg_service
from app.services import claude as claude_service

router = APIRouter(prefix="/projects", tags=["sync"])
logger = logging.getLogger(__name__)

VALID_DAYS = {7, 14, 30}


async def _sync_and_analyze(project_id: int, days: int = 7):
    db: Session = SessionLocal()
    try:
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            return

        logger.info(f"Sincronizando projeto '{project.name}' — últimos {days} dias")

        raw_messages = await tg_service.fetch_messages(project.telegram_group_id, days=days)
        logger.info(f"  {len(raw_messages)} mensagens encontradas")

        if not project.telegram_group_name:
            project.telegram_group_name = await tg_service.get_group_name(project.telegram_group_id)
            db.commit()

        existing_ids = {
            row[0]
            for row in db.query(models.Message.tg_message_id)
            .filter(models.Message.project_id == project_id)
            .all()
        }
        for m in raw_messages:
            if m["tg_message_id"] not in existing_ids:
                db.add(models.Message(
                    project_id=project_id,
                    sender_name=m["sender_name"],
                    content=m["content"],
                    sent_at=m["sent_at"],
                    tg_message_id=m["tg_message_id"],
                ))
        db.commit()

        period_messages = (
            db.query(models.Message)
            .filter(
                models.Message.project_id == project_id,
                models.Message.sent_at >= datetime.now(timezone.utc) - timedelta(days=days),
            )
            .order_by(models.Message.sent_at)
            .all()
        )
        messages_for_claude = [
            {"sender_name": m.sender_name, "content": m.content, "sent_at": m.sent_at}
            for m in period_messages
        ]

        logger.info(f"  Enviando {len(messages_for_claude)} mensagens para o Claude...")
        analysis = claude_service.analyze_messages(project.name, messages_for_claude, days=days)

        period_end = datetime.now(timezone.utc)
        period_start = period_end - timedelta(days=days)

        db.add(models.WeeklySummary(
            project_id=project_id,
            week_start=period_start,
            week_end=period_end,
            summary_text=analysis.get("resumo_semanal", ""),
            score_health=analysis.get("score_saude", 0),
            last_interaction=analysis.get("ultima_interacao", ""),
            alert_critical=analysis.get("alerta_critico", False),
            next_steps_json=json.dumps(analysis.get("proximos_passos", []), ensure_ascii=False),
            status_color=analysis.get("status_cor", "#6b7280"),
        ))
        db.commit()
        logger.info(f"  Análise salva com sucesso!")

    except Exception as e:
        logger.error(f"Erro ao sincronizar projeto {project_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()


@router.post("/{project_id}/sync")
async def sync_project(
    project_id: int,
    days: int = Query(default=7, description="Período em dias: 7, 14 ou 30"),
    db: Session = Depends(get_db),
    _=Depends(auth.get_current_user),
):
    if days not in VALID_DAYS:
        raise HTTPException(status_code=400, detail="Período inválido. Use 7, 14 ou 30 dias.")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    await _sync_and_analyze(project_id, days=days)
    return {"message": f"Sincronização dos últimos {days} dias concluída"}
