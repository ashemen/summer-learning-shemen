#!/usr/bin/env python3
"""Reset the local admin password seed for the Hebrew summer app.

This updates data/admin-settings.json. On the next app load, the browser copy is
replaced if this file's recoveryUpdatedAt value is newer.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SETTINGS_PATH = ROOT / "data" / "admin-settings.json"


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset admin password for the local Hebrew learning app.")
    parser.add_argument("password", help="New administrator password")
    args = parser.parse_args()

    if len(args.password) < 6:
        raise SystemExit("הסיסמה חייבת להכיל לפחות 6 תווים.")

    settings = {}
    if SETTINGS_PATH.exists():
        settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))

    salt = secrets.token_hex(16)
    settings.update(
        {
            "passwordSalt": salt,
            "passwordHash": hash_password(args.password, salt),
            "recoveryUpdatedAt": datetime.now(timezone.utc).isoformat(),
            "recoveryNote": "Admin password was reset by scripts/reset_admin_password.py.",
        }
    )

    SETTINGS_PATH.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("סיסמת המנהלת אופסה. רענני את הדפדפן והתחברי עם הסיסמה החדשה.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
