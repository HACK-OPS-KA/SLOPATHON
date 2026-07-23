#!/usr/bin/env python3
"""The Weight Bay - scraper.

Pulls the top open-weights models per category from the Hugging Face API
into data/weightbay.sqlite and seeds every model with pre-generated
TPB-style comments. Deterministic per model id, so re-runs are stable.

Usage: python3 scraper/fetch_models.py
"""

import hashlib
import json
import random
import re
import sqlite3
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "weightbay.sqlite"
SEED_PATH = Path(__file__).resolve().parent / "comments_seed.json"

API = "https://huggingface.co/api/models"
PER_TAG = 60

# TPB-style numeric categories -> (label, pipeline tags)
CATEGORIES = {
    100: ("Text Gen (LLMs)", ["text-generation", "text2text-generation"]),
    200: ("Image Gen", ["text-to-image", "image-to-image"]),
    300: ("Audio", ["automatic-speech-recognition", "text-to-speech",
                    "audio-classification", "text-to-audio"]),
    400: ("Video", ["text-to-video", "image-to-video"]),
    500: ("Embeddings", ["feature-extraction", "sentence-similarity"]),
    600: ("Vision", ["image-classification", "object-detection",
                     "image-segmentation", "image-text-to-text",
                     "depth-estimation"]),
    700: ("Other", ["reinforcement-learning", "time-series-forecasting",
                    "robotics"]),
}

# bytes per parameter by safetensors dtype key
DTYPE_BYTES = {
    "F64": 8, "F32": 4, "F16": 2, "BF16": 2,
    "I64": 8, "I32": 4, "I16": 2, "I8": 1, "U8": 1, "BOOL": 1,
    "F8_E4M3": 1, "F8_E5M2": 1,
}

VIP_UPLOADERS = {
    "meta-llama", "mistralai", "Qwen", "google", "openai", "microsoft",
    "deepseek-ai", "stabilityai", "black-forest-labs", "facebook",
    "nvidia", "apple", "sentence-transformers", "BAAI", "CompVis",
    "runwayml", "ibm-granite", "allenai", "HuggingFaceTB", "tiiuae",
}


def fetch(tag):
    params = urllib.parse.urlencode(
        [
            ("pipeline_tag", tag),
            ("sort", "downloads"),
            ("direction", "-1"),
            ("limit", str(PER_TAG)),
            ("expand[]", "safetensors"),
            ("expand[]", "downloads"),
            ("expand[]", "likes"),
            ("expand[]", "lastModified"),
            ("expand[]", "tags"),
            ("expand[]", "pipeline_tag"),
        ]
    )
    req = urllib.request.Request(
        f"{API}?{params}", headers={"User-Agent": "the-weight-bay/0.1 (slopathon)"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def size_bytes(model):
    st = model.get("safetensors") or {}
    params = st.get("parameters") or {}
    total = sum(DTYPE_BYTES.get(k, 2) * v for k, v in params.items())
    if total:
        return total
    # fallback: guess from "7b"/"70B" in the name, 2 bytes/param
    m = re.search(r"(\d+(?:\.\d+)?)\s*[bB](?![a-zA-Z0-9])", model["id"])
    if m:
        return int(float(m.group(1)) * 2e9)
    return None


def license_of(tags):
    for t in tags:
        if t.startswith("license:"):
            return t.split(":", 1)[1]
    return "unknown"


def main():
    seed_pools = json.loads(SEED_PATH.read_text())
    usernames = seed_pools["usernames"]

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
    db = sqlite3.connect(DB_PATH)
    db.executescript(
        """
        CREATE TABLE models (
            id INTEGER PRIMARY KEY,
            hf_id TEXT UNIQUE, author TEXT, name TEXT,
            cat INTEGER, pipeline_tag TEXT,
            downloads INTEGER, likes INTEGER,
            last_modified TEXT, license TEXT,
            size_bytes INTEGER, vip INTEGER
        );
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY,
            model_id INTEGER REFERENCES models(id),
            username TEXT, body TEXT, posted_at TEXT
        );
        CREATE TABLE counter (page TEXT PRIMARY KEY, hits INTEGER);
        """
    )

    seen = set()
    now = time.time()
    for cat, (label, tags) in CATEGORIES.items():
        for tag in tags:
            print(f"[*] fetching {tag} (cat {cat} {label}) ...")
            try:
                models = fetch(tag)
            except Exception as e:
                print(f"    !! {e}, skipping")
                continue
            for m in models:
                hf_id = m["id"]
                if hf_id in seen or "/" not in hf_id:
                    continue
                seen.add(hf_id)
                author, name = hf_id.split("/", 1)
                cur = db.execute(
                    "INSERT INTO models (hf_id, author, name, cat, pipeline_tag,"
                    " downloads, likes, last_modified, license, size_bytes, vip)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (
                        hf_id, author, name, cat,
                        m.get("pipeline_tag") or tag,
                        m.get("downloads") or 0,
                        m.get("likes") or 0,
                        m.get("lastModified") or "",
                        license_of(m.get("tags") or []),
                        size_bytes(m),
                        1 if author in VIP_UPLOADERS else 0,
                    ),
                )
                model_row_id = cur.lastrowid

                # deterministic comment seeding per model
                rng = random.Random(
                    int(hashlib.sha1(hf_id.encode()).hexdigest()[:8], 16)
                )
                pool = list(seed_pools["generic"]) + list(
                    seed_pools.get(f"cat{cat}", [])
                ) * 2  # category comments twice as likely
                downloads = m.get("downloads") or 0
                n = min(3 + int(downloads ** 0.14), 24)
                picks = rng.sample(pool, min(n, len(pool)))
                for body in picks:
                    ts = now - rng.uniform(3600 * 24, 3600 * 24 * 900)
                    db.execute(
                        "INSERT INTO comments (model_id, username, body, posted_at)"
                        " VALUES (?,?,?,?)",
                        (
                            model_row_id,
                            rng.choice(usernames),
                            body,
                            time.strftime("%Y-%m-%d %H:%M", time.localtime(ts)),
                        ),
                    )
            time.sleep(0.4)  # be polite-ish

    db.execute("INSERT INTO counter (page, hits) VALUES ('index', 133742)")
    db.commit()
    n_models = db.execute("SELECT COUNT(*) FROM models").fetchone()[0]
    n_comments = db.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
    print(f"[+] done: {n_models} models, {n_comments} comments -> {DB_PATH}")


if __name__ == "__main__":
    main()
