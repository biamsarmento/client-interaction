import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models, auth
from app.routers import auth as auth_router, projects as projects_router, summaries as summaries_router
from app.scheduler import create_scheduler

# Cria as tabelas no banco na primeira execução
Base.metadata.create_all(bind=engine)


def _seed_admin():
    """Cria o usuário admin inicial se não existir."""
    from app.database import SessionLocal

    email = os.getenv("ADMIN_EMAIL", "admin@simplify.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        exists = db.query(models.User).filter(models.User.email == email).first()
        if not exists:
            user = models.User(email=email, hashed_password=auth.hash_password(password))
            db.add(user)
            db.commit()
            print(f"✓ Usuário admin criado: {email}")
    finally:
        db.close()


scheduler = create_scheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_admin()
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Client Interaction Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(projects_router.router)
app.include_router(summaries_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
