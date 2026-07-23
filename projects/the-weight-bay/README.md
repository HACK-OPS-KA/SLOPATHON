# The Weight Bay ⛵

> A Pirate Bay clone where every "illegal download" is a 100% legal, free, open-weights AI model from Hugging Face.

## Team

- paisc

## What is this?

A fully working torrent-site experience — search, categories, seeders/leechers, VIP
uploaders, magnet links, unhinged comment sections — except the entire catalog is
**1,140 real open-weights models** pulled live from the Hugging Face API. Runs as
plain PHP 8 + SQLite in a Docker container, styled after The Pirate Bay with a heavy
dose of [cameronsworld.net](https://www.cameronsworld.net/) GeoCities energy
(marquees, starfield, blink tags, visitor counter, fake banner ads).

The demo: search "llama", admire the fake swarm, click DOWNLOAD .TORRENT, get scolded
by a popup for downloading something legal, receive a `.torrent` file that is actually
a text file containing `hf download`.

## Why should this not exist?

- **totally unnecessary**: it "tracks" files that a Fortune 500 company hosts publicly, for free, on a CDN faster than any swarm could ever be
- **solves a problem nobody has**: downloading open models was never illegal. We just missed when it *felt* illegal.
- **morally questionable UX (but harmless)**: fake seeders fluctuate live "for ambience", the visitor counter is stored in a real database (which makes it more fake somehow), a popup warns you before every legal download
- **takes the long way on purpose**: hand-written PHP with `<font>` tags and table layout, served in quirks mode (DOCTYPE HTML 4.01 Transitional), in 2026

## What it does

**Actually does:**

- scrapes real model metadata (downloads, likes, size, license) from the Hugging Face API into SQLite across 7 TPB-style categories (LLMs / Image Gen / Audio / Video / Embeddings / Vision / Other)
- full TPB UI: browse per category, search, Top 100, detail pages with NFO-style release notes and info hashes (sha1 of the model id, purely decorative)
- deterministic fake seeder/leecher counts derived from real download numbers, with a live sine-wave wobble
- ~8,850 pre-generated comments (≈300 hand-written, category-aware: LLM models get strawberry-r-counting discourse, image models get hand-finger discourse), deterministically assigned per model
- 💀 VIP skulls for "trusted uploaders" (i.e. actual multi-billion dollar companies)
- fake `.torrent` download that delivers the legal `hf download` command with full honors
- real working visitor counter, fake blinking banner ads, webring

**Should do (but doesn't yet):**

- guestbook (button blinks, does nothing — historically accurate)
- posting a comment (goes to `/dev/null` with full honors)
- an actual swarm (there are no peers, there will never be peers)

## How it works

```text
Hugging Face API -> python scraper -> SQLite -> PHP 8 in quirks mode -> your eyes (sorry)
```

## Run it

### Requirements

#### Software

- OS: anything with Docker
- Language/runtime: Python 3 (scraper), PHP 8.3 via `php:8.3-apache` Docker image (site)
- Package manager: none. stdlib only. It's 2004.
- Accounts / API keys: none (HF API is public)

### Setup

```bash
python3 scraper/fetch_models.py   # optional: refresh data; a seeded DB ships in data/
```

### Start

```bash
./run.sh
# -> http://localhost:1337
```

## Demo

- `assets/screenshot-home.png` — landing page with hot uploads and visitor counter
- `assets/screenshot-browse.png` — Browse: Text Gen (LLMs)
- `assets/screenshot-torrent.png` — Llama-3.2-1B detail page with NFO block and comments
