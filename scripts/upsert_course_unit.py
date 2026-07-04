#!/usr/bin/env python3
"""Add or replace a course unit in data/courses.json from a JSON payload."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES_PATH = ROOT / "data" / "courses.json"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\u0590-\u05ff]+", "-", value)
    return value.strip("-")


def validate_questions(questions: object, label: str) -> list[dict]:
    if questions is None:
        return []
    if not isinstance(questions, list):
        raise SystemExit(f"{label} must be a JSON array.")
    for question in questions:
        if not isinstance(question, dict):
            raise SystemExit(f"{label} contains a non-object question.")
        for key in ("id", "type", "prompt", "correctAnswer"):
            if key not in question:
                raise SystemExit(f"{label} question is missing '{key}'.")
    return questions


def normalize_unit(payload: dict) -> dict:
    raw = payload.get("unit", payload)
    title = raw.get("title", "").strip()
    if not title:
        raise SystemExit("Unit JSON must include a title.")

    unit_id = raw.get("id") or slugify(title)
    return {
        "id": unit_id,
        "title": title,
        "description": raw.get("description", ""),
        "lessonFile": raw.get("lessonFile", ""),
        "lessonMarkdown": raw.get("lessonMarkdown") or raw.get("markdown", ""),
        "exercisesFile": raw.get("exercisesFile", ""),
        "exercises": validate_questions(raw.get("exercises", []), "exercises"),
        "testsFile": raw.get("testsFile", ""),
        "tests": validate_questions(raw.get("tests", []), "tests"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Upsert a generated unit into a course.")
    parser.add_argument("--course-id", required=True, help="Target course id in data/courses.json")
    parser.add_argument("--unit-json", required=True, help="Path to a unit JSON payload")
    args = parser.parse_args()

    courses = json.loads(COURSES_PATH.read_text(encoding="utf-8"))
    unit_payload = json.loads(Path(args.unit_json).read_text(encoding="utf-8-sig"))
    unit = normalize_unit(unit_payload)

    for course in courses:
      if course.get("id") == args.course_id:
        course.setdefault("units", [])
        for index, existing in enumerate(course["units"]):
          if existing.get("id") == unit["id"]:
            course["units"][index] = unit
            action = "Updated"
            break
        else:
          course["units"].append(unit)
          action = "Added"
        COURSES_PATH.write_text(json.dumps(courses, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{action} unit '{unit['title']}' in course '{args.course_id}'.")
        return 0

    raise SystemExit(f"Course '{args.course_id}' was not found.")


if __name__ == "__main__":
    raise SystemExit(main())
