import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models
from app.routers.summaries import _sync_and_analyze

logger = logging.getLogger(__name__)


async def weekly_sync_all():
    """Sincroniza e analisa todos os projetos. Roda toda segunda-feira às 08:00."""
    db: Session = SessionLocal()
    try:
        projects = db.query(models.Project).all()
        logger.info(f"Job semanal iniciado: {len(projects)} projetos para sincronizar")
        for project in projects:
            try:
                await _sync_and_analyze(project.id, db)
                logger.info(f"Projeto '{project.name}' sincronizado com sucesso")
            except Exception as e:
                logger.error(f"Erro ao sincronizar projeto '{project.name}': {e}")
    finally:
        db.close()


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        weekly_sync_all,
        trigger=CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_sync",
        name="Sincronização semanal de todos os projetos",
        replace_existing=True,
    )
    return scheduler
