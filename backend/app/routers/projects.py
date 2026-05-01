from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
import json

from app.database import get_db
from app import models, auth
from app.services import telegram as tg_service
from app.services import claude as claude_service

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    telegram_group_id: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    telegram_group_id: str
    telegram_group_name: Optional[str]
    latest_summary: Optional[dict] = None

    class Config:
        from_attributes = True


@router.get("/")
def list_projects(db: Session = Depends(get_db), _=Depends(auth.get_current_user)):
    projects = db.query(models.Project).order_by(models.Project.name).all()
    result = []
    for p in projects:
        latest = (
            db.query(models.WeeklySummary)
            .filter(models.WeeklySummary.project_id == p.id)
            .order_by(models.WeeklySummary.created_at.desc())
            .first()
        )
        summary_dict = None
        if latest:
            summary_dict = {
                "id": latest.id,
                "summary_text": latest.summary_text,
                "score_health": latest.score_health,
                "last_interaction": latest.last_interaction,
                "alert_critical": latest.alert_critical,
                "next_steps": json.loads(latest.next_steps_json or "[]"),
                "status_color": latest.status_color,
                "week_start": latest.week_start.isoformat(),
                "week_end": latest.week_end.isoformat(),
                "created_at": latest.created_at.isoformat(),
            }
        result.append({
            "id": p.id,
            "name": p.name,
            "telegram_group_id": p.telegram_group_id,
            "telegram_group_name": p.telegram_group_name,
            "created_at": p.created_at.isoformat(),
            "latest_summary": summary_dict,
        })
    return result


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    _=Depends(auth.get_current_user),
):
    existing = db.query(models.Project).filter(models.Project.telegram_group_id == data.telegram_group_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Grupo já cadastrado em outro projeto")

    project = models.Project(name=data.name, telegram_group_id=data.telegram_group_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "telegram_group_id": project.telegram_group_id}


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), _=Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    db.delete(project)
    db.commit()


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db), _=Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    summaries = (
        db.query(models.WeeklySummary)
        .filter(models.WeeklySummary.project_id == project_id)
        .order_by(models.WeeklySummary.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "id": project.id,
        "name": project.name,
        "telegram_group_id": project.telegram_group_id,
        "telegram_group_name": project.telegram_group_name,
        "created_at": project.created_at.isoformat(),
        "summaries": [
            {
                "id": s.id,
                "summary_text": s.summary_text,
                "score_health": s.score_health,
                "last_interaction": s.last_interaction,
                "alert_critical": s.alert_critical,
                "next_steps": json.loads(s.next_steps_json or "[]"),
                "status_color": s.status_color,
                "week_start": s.week_start.isoformat(),
                "week_end": s.week_end.isoformat(),
                "created_at": s.created_at.isoformat(),
            }
            for s in summaries
        ],
    }
