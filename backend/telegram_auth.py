"""
Execute este script UMA VEZ para autenticar o Telethon com sua conta Telegram.
Isso gera o arquivo `telegram_session.session` que o sistema usa automaticamente.

Uso:
    cd backend
    python telegram_auth.py
"""
import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.services.telegram import authenticate

if __name__ == "__main__":
    asyncio.run(authenticate())
