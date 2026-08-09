"""Persistent caller history and conversation memory."""

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from loguru import logger

EXCLUDED_ROLES = {"system"}


class CallerMemory:
    def __init__(self, path: Path, ttl_seconds: float):
        self._path = path
        self._ttl_seconds = ttl_seconds
        self._store: Dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                self._store = json.load(f)
            self._purge_expired()
        except Exception as e:
            logger.warning(f"Could not load caller memory from {self._path}: {e}")
            self._store = {}

    def _save(self) -> None:
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save caller memory to {self._path}: {e}")

    def _purge_expired(self) -> None:
        now = time.time()
        expired = [
            cid
            for cid, data in self._store.items()
            if now - data.get("timestamp", 0) > self._ttl_seconds
        ]
        for cid in expired:
            del self._store[cid]

    def recall(self, caller_id: str) -> Optional[List[Dict[str, str]]]:
        if not caller_id:
            return None
        self._purge_expired()
        entry = self._store.get(caller_id)
        if not entry:
            return None
        return entry.get("messages", [])

    def remember(self, caller_id: str, raw_messages: List[Dict[str, Any]]) -> None:
        if not caller_id:
            return

        cleaned = []
        for msg in raw_messages:
            role = str(msg.get("role", "")).lower()
            content = str(msg.get("content", "")).strip()

            if role in EXCLUDED_ROLES or not content:
                continue

            cleaned.append({"role": role, "content": content})

        if not cleaned:
            return

        self._purge_expired()
        self._store[caller_id] = {"timestamp": time.time(), "messages": cleaned}
        self._save()

    def forget(self, caller_id: str) -> None:
        if caller_id in self._store:
            del self._store[caller_id]
            self._save()
