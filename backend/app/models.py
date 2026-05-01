from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    telegram_group_id = Column(String, nullable=False)
    telegram_group_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    summaries = relationship("WeeklySummary", back_populates="project", cascade="all, delete-orphan", order_by="WeeklySummary.created_at.desc()")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, nullable=False)
    tg_message_id = Column(Integer, nullable=True)

    project = relationship("Project", back_populates="messages")


class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)
    summary_text = Column(Text, nullable=False)
    score_health = Column(Float, default=0)
    last_interaction = Column(String, nullable=True)
    alert_critical = Column(Boolean, default=False)
    next_steps_json = Column(Text, default="[]")
    status_color = Column(String, default="#02bbb6")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="summaries")
