import json
import os
from datetime import datetime

import anthropic

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


def _build_history_block(messages: list[dict]) -> str:
    lines = []
    for msg in messages:
        if isinstance(msg["sent_at"], datetime):
            ts = msg["sent_at"].strftime("%d/%m/%Y %H:%M")
        else:
            ts = str(msg["sent_at"])
        lines.append(f"[{msg['sender_name']}] [{ts}]: {msg['content']}")
    return "\n".join(lines)


def analyze_messages(project_name: str, messages: list[dict]) -> dict:
    """
    Envia o histórico de mensagens para o Claude e retorna o JSON estruturado de análise.
    """
    if not messages:
        return {
            "projeto_nome": project_name,
            "resumo_semanal": "Nenhuma mensagem encontrada neste período.",
            "ultima_interacao": "Sem interações",
            "score_saude": 0,
            "status_cor": "#6b7280",
            "alerta_critico": True,
            "proximos_passos": ["Verificar se o grupo está ativo", "Entrar em contato com o cliente"],
        }

    history = _build_history_block(messages)

    prompt = f"""Você é um Analista de Operações Sênior. Analise o histórico de mensagens de um grupo de projeto e retorne APENAS um JSON válido, sem texto adicional.

Projeto: {project_name}

Histórico de mensagens (última semana):
{history}

Retorne exatamente neste formato JSON:
{{
  "projeto_nome": "{project_name}",
  "resumo_semanal": "Síntese do progresso em até 3 frases claras",
  "ultima_interacao": "DD/MM/AAAA - HH:MM (Nome do Usuário)",
  "score_saude": <número de 0 a 5>,
  "status_cor": "<hex>",
  "alerta_critico": <true ou false>,
  "proximos_passos": ["Ação 1", "Ação 2"]
}}

Regras:
- score_saude 4-5: progresso rápido, clima positivo → status_cor "#02bbb6"
- score_saude 2-3: estagnação ou problemas moderados → status_cor "#f59e0b"
- score_saude 0-1: crise, conflitos ou projeto parado → status_cor "#ef4444"
- alerta_critico = true se score <= 2 ou palavras como erro, atraso, bloqueado, urgente aparecerem"""

    response = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Você responde APENAS com JSON válido, sem markdown, sem explicações.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Remove blocos markdown se o modelo os incluir por engano
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
