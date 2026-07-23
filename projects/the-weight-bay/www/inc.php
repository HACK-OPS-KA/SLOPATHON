<?php
// The Weight Bay - shared kitchen sink. One include, zero frameworks, no regrets.
error_reporting(E_ALL & ~E_DEPRECATED);

function db(): PDO {
    static $db = null;
    if ($db === null) {
        foreach (['/var/www/data/weightbay.sqlite', __DIR__ . '/../data/weightbay.sqlite'] as $p) {
            if (file_exists($p)) { $db = new PDO('sqlite:' . $p); break; }
        }
        if ($db === null) die('<h1>NO DATABASE!!</h1><p>run: python3 scraper/fetch_models.py</p>');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    return $db;
}

const CATS = [
    100 => 'Text Gen (LLMs)',
    200 => 'Image Gen',
    300 => 'Audio',
    400 => 'Video',
    500 => 'Embeddings',
    600 => 'Vision',
    700 => 'Other',
];

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES); }

// Deterministic-but-"live" swarm numbers. The entire economy of this site.
function swarm(string $hfId, int $downloads): array {
    $hash = crc32($hfId);
    $base = (int)round(pow(log10(max($downloads, 10)), 3.1) * (0.6 + ($hash % 100) / 120));
    $wobble = sin(time() / 47 + $hash % 360) * 0.18 + 1;   // "live" fluctuation
    $se = max(1, (int)round($base * $wobble));
    $le = max(0, (int)round($se * (0.25 + (($hash >> 8) % 100) / 160)));
    return [$se, $le];
}

function fmt_size(?int $bytes): string {
    if (!$bytes) return '???';
    $u = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    $i = (int)floor(log($bytes, 1024));
    return sprintf('%.2f&nbsp;%s', $bytes / pow(1024, $i), $u[$i]);
}

function fmt_n(int $n): string { return number_format($n, 0, '.', ','); }

function fake_infohash(string $hfId): string { return sha1('weightbay:' . $hfId); }

function magnet(array $m): string {
    return 'magnet:?xt=urn:btih:' . fake_infohash($m['hf_id'])
        . '&dn=' . rawurlencode($m['name'] . '.safetensors')
        . '&tr=' . rawurlencode('udp://tracker.openweights.org:1337/announce')
        . '&tr=' . rawurlencode('udp://vram.exhausted.net:6969/announce')
        . '&tr=' . rawurlencode('http://definitely-not-huggingface.co:80/announce');
}

$ADS = [
    ['🔥 HOT GPUs IN YOUR AREA 🔥', 'H100s are waiting to meet YOU. No credit card needed*<br><small>*credit card needed</small>', '#ff00ff'],
    ['⚠ YOUR VRAM IS ALMOST FULL ⚠', 'Download more VRAM now! 100% safe, 200% legit, 4GB free!!', '#ff0000'],
    ['1 WEIRD TRICK to quantize', 'ML engineers HATE him! Local man compresses 70B model onto a floppy disk', '#00ff00'],
    ['💾 SINGLES SAFETENSORS 💾', 'Lonely tensors in your region want to be multiplied. Register FREE', '#ffcc00'],
    ['🧙 FREE ALIGNMENT CHECK 🧙', 'Is YOUR model secretly plotting? Our psychic finds out in 30 seconds', '#00ffff'],
    ['🚨 CONGRATULATION!! 🚨', 'You are the 1,000,000th visitor!* Click to claim your free epoch<br><small>*so is everyone</small>', '#ff6600'],
];

function render_ad(): void {
    global $ADS;
    $a = $ADS[array_rand($ADS)];
    echo '<table width="100%" cellpadding="6" style="border:3px ridge ' . $a[2] . ';background:#000;margin:8px 0"><tr><td align="center">'
       . '<span class="blink" style="color:' . $a[2] . ';font-family:\'Comic Sans MS\',cursive;font-size:15px;font-weight:bold">' . $a[0] . '</span><br>'
       . '<font color="#ffffff" size="2" face="Verdana">' . $a[1] . '</font></td></tr></table>';
}

function counter_bump(string $page): int {
    $db = db();
    try {
        $db->prepare("INSERT INTO counter (page,hits) VALUES (?,1)
                      ON CONFLICT(page) DO UPDATE SET hits = hits + 1")->execute([$page]);
    } catch (Exception $e) { /* db read-only? the counter was fake anyway */ }
    $row = $db->prepare("SELECT hits FROM counter WHERE page=?");
    $row->execute([$page]);
    return (int)($row->fetchColumn() ?: 133742);
}

function odometer(int $n): string {
    $out = '';
    foreach (str_split(str_pad((string)$n, 8, '0', STR_PAD_LEFT)) as $d) {
        $out .= '<span style="background:#000;color:#0f0;font-family:\'Courier New\',monospace;'
              . 'font-weight:bold;border:1px solid #0f0;padding:0 3px;margin:0 1px">' . $d . '</span>';
    }
    return $out;
}

function page_header(string $title, bool $small = false): void {
    header('Content-Type: text/html; charset=utf-8');
    ?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title><?= h($title) ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
body { background:#000016 url('assets/stars.png'); color:#fff; font-family:Verdana,Arial,sans-serif; font-size:11px; margin:0; }
a { color:#9f9fff; } a:visited { color:#b982ff; }
.blink { animation: blink 0.9s steps(2,start) infinite; }
@keyframes blink { to { visibility:hidden; } }
.rainbow { background:linear-gradient(90deg,#f00,#ff8000,#ff0,#0f0,#0ff,#00f,#8000ff,#f00);
  background-size:400% 100%; animation:rb 3s linear infinite;
  -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:bold; }
@keyframes rb { to { background-position:400% 0; } }
.fire { color:#ff6600; text-shadow:0 0 6px #ff0, 0 -2px 12px #f00; }
.construction { background:repeating-linear-gradient(45deg,#ff0 0 12px,#000 12px 24px); height:12px; animation:crawl 1.2s linear infinite; }
@keyframes crawl { to { background-position:34px 0; } }
#main { width:900px; margin:0 auto; background:#fff; color:#000; border-left:4px ridge #888; border-right:4px ridge #888; }
/* quirks mode makes tables inherit color from <body> instead of #main. we chose this life (DOCTYPE 4.01) */
#main table { color:#000; font-family:Verdana,Arial,sans-serif; font-size:11px; }
#main a { color:#0000cc; } #main a:visited { color:#551a8b; }
table.list { border-collapse:collapse; width:100%; font-size:11px; }
table.list th { background:#b5b5b5; text-align:left; padding:3px 6px; font-size:10px; }
table.list td { padding:3px 6px; }
tr.alt { background:#ececec; }
.detName a { font-size:13px; font-weight:bold; }
.vip { color:#00aa00; font-weight:bold; }
.detDesc { color:#4f4f4f; font-size:10px; }
.comment { border:1px solid #ccc; background:#f4fff4; margin:6px 0; padding:5px 8px; font-family:'Comic Sans MS',cursive; font-size:11px; }
.chead { color:#666; font-size:9px; font-family:Verdana; }
marquee { display:block; }
</style>
</head>
<body>
<marquee scrollamount="7" style="background:#000;color:#0f0;font-family:'Courier New';font-weight:bold;padding:2px">
*** WELCOME TO THE WEIGHT BAY *** THE GALAXY'S MOST RESILIENT AI MODEL TRACKER *** 100% LEGAL AND THAT'S THE MOST CURSED PART *** NO ADS EXCEPT FAKE ONES *** SEED YOUR WEIGHTS *** FREE MATRIX MULTIPLICATION FOR ALL ***
</marquee>
<div class="construction"></div>
<div id="main">
<table width="100%" cellpadding="8"><tr>
<td align="center">
<a href="index.php" style="text-decoration:none">
<?php if ($small): ?>
  <font size="5" face="Impact,Arial Black" color="#000">⛵ The Weight Bay</font>
<?php else: ?>
  <font size="7" face="Impact,Arial Black" color="#000">⛵ The Weight Bay</font><br>
  <span class="rainbow" style="font-size:14px">Download the world's most freely available files.</span><br>
  <font size="1" color="#666">Feeling illegal since 2026 · est. in a basement near Karlsruhe</font>
<?php endif; ?>
</a>
</td></tr></table>
<?php
}

function search_box(string $q = ''): void {
    ?>
<form method="get" action="search.php">
<table width="100%" cellpadding="4"><tr><td align="center">
<input type="text" name="q" value="<?= h($q) ?>" size="50" style="font-size:14px;border:2px inset #888">
<input type="submit" value="Pirate Search" style="font-size:14px;font-weight:bold">
<br><font size="1">
<?php $links = []; foreach (CATS as $c => $l) { $links[] = '<a href="browse.php?cat=' . $c . '">' . h($l) . '</a>'; }
echo implode(' &nbsp;•&nbsp; ', $links); ?>
&nbsp;•&nbsp; <a href="browse.php?cat=0"><b>Top&nbsp;100</b></a>
</font>
</td></tr></table>
</form>
<?php
}

function page_footer(): void {
    ?>
<table width="100%" cellpadding="8"><tr><td align="center">
<div class="construction"></div>
<font size="1" color="#444">
<span class="blink">🚧</span> This site is permanently UNDER CONSTRUCTION <span class="blink">🚧</span><br>
Best viewed in <b>Netscape Navigator 4.0</b> at 800x600 &nbsp;|&nbsp; <a href="http://www.cameronsworld.net">This site's spirit animal</a><br>
<b>AI WEBRING:</b> [ <a href="https://huggingface.co">&lt;&lt; prev</a> | <a href="https://arxiv.org/list/cs.LG/recent">random</a> | <a href="https://thepiratebay.org">next &gt;&gt;</a> ]<br><br>
<i>Legal notice: every single file linked here is free, open and legal.<br>
We just missed when downloading felt like an adventure. No models were harmed. Some were quantized.</i>
</font>
</td></tr></table>
</div>
<marquee direction="right" scrollamount="4" style="background:#000;color:#f0f;font-family:'Courier New';padding:2px">
&lt;/marquee&gt; is deprecated and so are we ··· powered by PHP, SQLite and spite ··· HACK//OPS SLOPATHON OP001 ···
</marquee>
</body></html>
<?php
}
