#!/bin/sh
# The Weight Bay - one command to sail.
# Requires: docker. Optionally run scraper first for fresh data:
#   python3 scraper/fetch_models.py
cd "$(dirname "$0")"
[ -f data/weightbay.sqlite ] || { echo "no db yet -> running scraper"; python3 scraper/fetch_models.py; }
chmod -R a+rw data 2>/dev/null || true
echo ""
echo "  ⛵ The Weight Bay sails at http://localhost:1337"
echo ""
exec docker run --rm -p 1337:80 \
  -v "$PWD/www:/var/www/html:ro" \
  -v "$PWD/data:/var/www/data" \
  --name weightbay php:8.3-apache
