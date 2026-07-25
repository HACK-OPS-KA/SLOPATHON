#!/usr/bin/env node
/**
 * build-projects.mjs
 * -------------------
 * Walks projects/<team>/ and emits a single projects.json that the
 * hackops.tech "slop museum" gallery consumes at runtime.
 *
 * Submissions are messy on purpose (it's a slopathon): mixed README.md /
 * Readme.txt, images scattered across assets/ , docs/screenshots/ or the
 * folder root, template placeholders left in, favicon noise, etc. So the
 * parser is deliberately tolerant and never throws on a single project.
 *
 * Zero dependencies -> runs on a bare `node` in GitHub Actions.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

// --- config -----------------------------------------------------------------
const REPO = 'HACK-OPS-KA/SLOPATHON';
const BRANCH = process.env.GITHUB_REF_NAME || 'main';
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const TREE = `https://github.com/${REPO}/tree/${BRANCH}`;
const BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;
const ROOT = process.cwd();
const PROJECTS_DIR = join(ROOT, 'projects');
const EVENT = 'SLOPATHON OP001';

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'target', '.venv', '__pycache__']);
// icon / boilerplate noise that should never be picked as a thumbnail
const NOISE = /(favicon|apple-touch|android-chrome|mstile|maskable|manifest|\bicon-|\bicon\.|og-?image|\bogimage|opengraph|\.ico$|stars\.png$)/i;
// filenames that clearly ARE a good hero shot, ranked first
const HERO = /(screenshot|screen-shot|preview|demo|hero|onboarding|app-info|banner|cover|landing|thumb)/i;

// --- fs helpers --------------------------------------------------------------
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') && name !== '.') continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const rawUrl = (absPath) => `${RAW}/${relative(ROOT, absPath).split('\\').join('/')}`;

// --- markdown-ish field extraction ------------------------------------------
function stripInline(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')          // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')        // links -> text
    .replace(/^\s*#{1,6}\s+/, '')                    // leading heading hashes
    .replace(/^\s*>\s?/, '')                         // leading blockquote
    .replace(/^\s*[-*]\s+/, '')                      // leading list marker
    .replace(/[*_`]+/g, '')                          // remaining md emphasis
    .replace(/\s+/g, ' ')
    .trim();
}

function findReadme(files) {
  const md = files.filter((f) => /readme/i.test(basename(f)) && !/README-product|DEVELOPMENT_PLAN|SUBMIT/i.test(basename(f)));
  // prefer .md, then .txt, then anything; prefer shallowest path
  const rank = (f) => (/\.md$/i.test(f) ? 0 : /\.txt$/i.test(f) ? 1 : 2) * 100 + f.split(/[\\/]/).length;
  md.sort((a, b) => rank(a) - rank(b));
  return md[0] || null;
}

function getTitle(lines, slug) {
  for (const raw of lines) {
    const m = raw.match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) {
      let t = stripInline(m[1]);
      // teams that left the template placeholder in: "Project name Chladni Clock"
      t = t.replace(/^project name\s*[:\-]?\s*/i, '').trim();
      if (t && !/^project name$/i.test(t)) return t;
    }
  }
  // fallback: prettify the folder name
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTagline(lines) {
  // first contiguous blockquote after the first heading
  let seenH1 = false;
  const quote = [];
  for (const raw of lines) {
    if (/^#\s+/.test(raw)) { seenH1 = true; continue; }
    if (!seenH1) continue;
    if (/^>\s?/.test(raw)) { quote.push(stripInline(raw)); continue; }
    if (quote.length) break;
    if (raw.trim() && !/^[#\-*\s]/.test(raw)) return truncate(stripInline(raw), 220);
  }
  if (quote.length) return truncate(quote.join(' '), 220);
  return '';
}

function sectionBody(text, headingRe) {
  const lines = text.split('\n');
  let i = lines.findIndex((l) => /^#{1,6}\s/.test(l) && headingRe.test(stripInline(l)));
  if (i < 0) return '';
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^#{1,6}\s/.test(lines[j])) break;
    out.push(lines[j]);
  }
  return out.join('\n').trim();
}

function getTeam(text) {
  const body = sectionBody(text, /^(team|the crew|crew|builders|made by|who)\b/i);
  if (!body) return [];
  return body
    .split('\n')
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) => stripInline(l.replace(/^\s*[-*]\s+/, '')))
    .filter(Boolean)
    .slice(0, 8);
}

function getCursed(text) {
  const body = sectionBody(text, /(why should this not exist|why.*not exist|the bad idea|cursed)/i);
  if (!body) return '';
  for (const raw of body.split('\n')) {
    const l = stripInline(raw);
    if (!l) continue;
    if (/^pick\b/i.test(l)) continue;            // template instruction
    if (/^what makes this cursed/i.test(l)) continue;
    return truncate(l, 180);
  }
  return '';
}

function truncate(s, n) {
  s = (s || '').trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// --- thumbnail / gallery selection ------------------------------------------
function pickImages(files) {
  const imgs = files.filter((f) => IMG_EXT.has(extname(f).toLowerCase()) && !NOISE.test(f));
  const score = (f) => {
    const p = f.toLowerCase().split('\\').join('/');
    let s = 0;
    const base = basename(p);
    if (HERO.test(base)) s -= 40;
    if (/\/assets\//.test(p)) s -= 15;
    if (/\/docs\/screenshots?\//.test(p) || /\/screenshots?\//.test(p)) s -= 20;
    if (/\/(public|static|www)\//.test(p)) s += 10;   // deprioritize build output
    if (/\/ads?\//.test(p)) s += 25;                  // fake-ad assets are not a hero shot
    if (/^[0-9a-f]{8,}[-.]/.test(base)) s += 20;       // uuid / hash filenames read as junk
    s += p.split('/').length;                         // prefer shallow
    return s;
  };
  return imgs.sort((a, b) => score(a) - score(b));
}

// --- per-project -------------------------------------------------------------
function buildProject(slug) {
  const dir = join(PROJECTS_DIR, slug);
  const files = walk(dir);
  const readme = findReadme(files);
  const text = readme ? readFileSync(readme, 'utf8') : '';
  const lines = text.split('\n');

  const images = pickImages(files);
  const thumb = images[0] || null;

  return {
    slug,
    title: getTitle(lines, slug),
    tagline: getTagline(lines),
    team: getTeam(text),
    cursed: getCursed(text),
    thumbnail: thumb ? rawUrl(thumb) : null,
    screenshots: images.slice(0, 8).map(rawUrl),
    github: `${TREE}/projects/${slug}`,
    readme_url: readme
      ? `${BLOB}/${relative(ROOT, readme).split('\\').join('/')}`
      : `${TREE}/projects/${slug}`,
  };
}

// --- main --------------------------------------------------------------------
function main() {
  const slugs = readdirSync(PROJECTS_DIR)
    .filter((n) => !n.startsWith('.') && !n.startsWith('_'))
    .filter((n) => {
      try { return statSync(join(PROJECTS_DIR, n)).isDirectory(); } catch { return false; }
    })
    .sort((a, b) => a.localeCompare(b));

  const projects = [];
  for (const slug of slugs) {
    try {
      projects.push(buildProject(slug));
    } catch (err) {
      console.error(`! failed on ${slug}: ${err.message}`);
      projects.push({ slug, title: slug, tagline: '', team: [], cursed: '', thumbnail: null, screenshots: [], github: `${TREE}/projects/${slug}`, readme_url: `${TREE}/projects/${slug}` });
    }
  }

  const out = {
    event: EVENT,
    repo: REPO,
    generated_at: new Date().toISOString(),
    count: projects.length,
    projects,
  };

  writeFileSync(join(ROOT, 'projects.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`built projects.json — ${projects.length} projects`);
  for (const p of projects) {
    const flags = [p.thumbnail ? 'img' : 'NO-IMG', p.team.length ? 'team' : 'no-team', p.tagline ? 'tag' : 'NO-TAG'].join(' ');
    console.log(`  · ${p.slug.padEnd(28)} ${flags}`);
  }
}

main();
