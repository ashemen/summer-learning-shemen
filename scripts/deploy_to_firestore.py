#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload local data (courses.json and students.json) to Firestore via REST API.
"""

import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]

def to_firestore_value(val):
    if isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    elif val is None:
        return {"nullValue": None}
    else:
        return {"stringValue": str(val)}

def upload_document(doc_id, filepath):
    print(f"Uploading {doc_id} from {filepath.name}...")
    data = json.loads(filepath.read_text(encoding="utf-8-sig"))
    
    doc_data = {
        "fields": {
            "value": to_firestore_value(data),
            "updatedAt": {
                "stringValue": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
        }
    }
    
    url = f"https://firestore.googleapis.com/v1/projects/summer-learning-shemen/databases/(default)/documents/hebrewSummer/{doc_id}?updateMask.fieldPaths=value&updateMask.fieldPaths=updatedAt"
    req_body = json.dumps(doc_data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=req_body,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            response.read()
            print(f"Successfully uploaded {doc_id}.")
    except urllib.error.HTTPError as e:
        print(f"Error uploading {doc_id}: {e.code} {e.reason}")
        print(e.read().decode("utf-8"))
        raise e

def main():
    upload_document("courses", ROOT / "data" / "courses.json")
    upload_document("students", ROOT / "data" / "students.json")
    print("Database sync complete.")

if __name__ == "__main__":
    main()
