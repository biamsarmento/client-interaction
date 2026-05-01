import os
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient
from telethon.tl.types import User, Channel, Chat, PeerChat, PeerChannel

API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "")
PHONE = os.getenv("TELEGRAM_PHONE", "")

SESSION_FILE = "telegram_session"


def _get_client() -> TelegramClient:
    return TelegramClient(SESSION_FILE, API_ID, API_HASH)


def _sender_name(sender) -> str:
    if sender is None:
        return "Desconhecido"
    if isinstance(sender, User):
        parts = [sender.first_name or "", sender.last_name or ""]
        return " ".join(p for p in parts if p).strip() or sender.username or "Desconhecido"
    if isinstance(sender, (Channel, Chat)):
        return sender.title or "Grupo"
    return "Desconhecido"


def _parse_group_id(group_id: str):
    """
    Converte o ID do grupo para o formato correto do Telethon.
    - IDs numéricos negativos são convertidos para PeerChat ou PeerChannel
    - Usernames (@grupo) são passados como string
    """
    try:
        numeric_id = int(group_id)
        if numeric_id < 0:
            id_str = str(numeric_id)
            # Supergrupos/canais têm o formato -100XXXXXXXXXX
            if id_str.startswith("-100"):
                return PeerChannel(int(id_str[4:]))
            else:
                # Grupos comuns
                return PeerChat(abs(numeric_id))
        return numeric_id
    except ValueError:
        # É um username como "@meugrupo"
        return group_id


async def _get_entity_with_fallback(client: TelegramClient, group_id: str):
    """
    Tenta obter a entidade diretamente; se falhar, busca nos diálogos.
    """
    peer = _parse_group_id(group_id)
    try:
        return await client.get_entity(peer)
    except (ValueError, Exception):
        # Popula o cache buscando todos os diálogos
        await client.get_dialogs()
        return await client.get_entity(peer)


async def fetch_messages(group_id: str, days: int = 7) -> list[dict]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    messages = []

    async with _get_client() as client:
        entity = await _get_entity_with_fallback(client, group_id)
        async for msg in client.iter_messages(entity, offset_date=since, reverse=True):
            if not msg.text:
                continue
            sender = await msg.get_sender()
            messages.append({
                "sender_name": _sender_name(sender),
                "content": msg.text,
                "sent_at": msg.date,
                "tg_message_id": msg.id,
            })

    return messages


async def get_group_name(group_id: str) -> str:
    async with _get_client() as client:
        entity = await _get_entity_with_fallback(client, group_id)
        return getattr(entity, "title", getattr(entity, "username", group_id))


async def authenticate(phone: str = None):
    phone = phone or PHONE
    async with _get_client() as client:
        await client.start(phone=phone)
        print("Autenticação concluída. Sessão salva.")
