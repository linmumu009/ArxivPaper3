from __future__ import annotations

from typing import Any, Dict


def handle_start_recognition(payload: Dict[str, Any]) -> Dict[str, Any]:
    arxiv_class = payload.get("arxiv_class") or {}
    instruction_prompt = payload.get("instruction_prompt") or {}
    summary_prompt = payload.get("summary_prompt") or {}
    model = payload.get("model")
    summary_model = payload.get("summary_model")
    mineru_index = payload.get("mineru_index")

    normalized: Dict[str, Any] = {
        "arxiv_class": {
            "name": arxiv_class.get("name"),
            "description": arxiv_class.get("description"),
        },
        "instruction_prompt": {
            "name": instruction_prompt.get("name"),
            "content": instruction_prompt.get("content"),
        },
        "summary_prompt": {
            "name": summary_prompt.get("name"),
            "content": summary_prompt.get("content"),
        },
        "folder_path": payload.get("folder_path") or "",
        "window_hours": payload.get("window_hours") or "",
        "model": model or {},
        "summary_model": summary_model or {},
        "mineru_index": mineru_index or {},
    }

    return {"status": "ok", "data": normalized}
