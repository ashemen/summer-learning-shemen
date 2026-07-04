#!/usr/bin/env python3
"""Reset the local admin password seed for the Hebrew summer app.

This updates data/admin-settings.json. On the next app load, the browser copy is
replaced if this file's recoveryUpdatedAt value is newer.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SETTINGS_PATH = ROOT / "data" / "admin-settings.json"


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def read_password(password_arg: str | None) -> str:
    if password_arg is not None:
        return password_arg

    password = getpass.getpass("New administrator password: ")
    confirm = getpass.getpass("Confirm new administrator password: ")
    if password != confirm:
        raise SystemExit("Password confirmation does not match.")
    return password


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset admin password for the local Hebrew learning app.")
    parser.add_argument("password", nargs="?", help="New administrator password")
    args = parser.parse_args()

    password = read_password(args.password)
    if len(password) < 6:
        raise SystemExit("Password must contain at least 6 characters.")

    settings = {}
    if SETTINGS_PATH.exists():
        settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))

    salt = secrets.token_hex(16)
    settings.update(
        {
            "passwordSalt": salt,
            "passwordHash": hash_password(password, salt),
            "recoveryUpdatedAt": datetime.now(timezone.utc).isoformat(),
            "recoveryNote": "Admin password was reset by scripts/reset_admin_password.py.",
        }
    )

    SETTINGS_PATH.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Admin password was reset. Refresh the browser and log in with the new password.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
