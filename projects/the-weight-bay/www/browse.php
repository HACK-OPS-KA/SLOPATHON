<?php
require __DIR__ . '/inc.php';
$db = db();
$cat = (int)($_GET['cat'] ?? 0);
$page = max(0, (int)($_GET['page'] ?? 0));
$per = 30;

$label = $cat === 0 ? 'Top 100 (all categories)' : (CATS[$cat] ?? 'Unknown');
if ($cat === 0) {
    $st = $db->prepare("SELECT * FROM models ORDER BY downloads DESC LIMIT 100");
    $st->execute();
    $total = 100;
} else {
    $c = $db->prepare("SELECT COUNT(*) FROM models WHERE cat=?");
    $c->execute([$cat]);
    $total = (int)$c->fetchColumn();
    $st = $db->prepare("SELECT * FROM models WHERE cat=? ORDER BY downloads DESC LIMIT ? OFFSET ?");
    $st->execute([$cat, $per, $page * $per]);
}
$rows = $st->fetchAll(PDO::FETCH_ASSOC);

page_header("Browse $label - The Weight Bay", true);
search_box();
render_ad();
?>
<table width="100%" cellpadding="4"><tr><td>
<font size="3"><b>Browse: <?= h($label) ?></b></font> <font size="1" color="#666">(<?= $total ?> models)</font>
</td></tr></table>
<table class="list">
<tr><th width="90">Type</th><th>Name (Order by: <a href="?cat=<?= $cat ?>">DL</a>)</th>
<th width="70" align="right">Size</th><th width="40" align="right"><font color="#00aa00">SE</font></th>
<th width="40" align="right"><font color="#aa0000">LE</font></th></tr>
<?php foreach ($rows as $i => $m) { [$se, $le] = swarm($m['hf_id'], (int)$m['downloads']); ?>
<tr<?= $i % 2 ? ' class="alt"' : '' ?>>
<td><font size="1"><a href="browse.php?cat=<?= $m['cat'] ?>"><?= h(CATS[$m['cat']] ?? '?') ?></a><br><?= h($m['pipeline_tag']) ?></font></td>
<td class="detName">
<a href="torrent.php?id=<?= $m['id'] ?>"><?= h($m['name']) ?></a>
<?php if ($m['vip']): ?><span class="vip" title="VIP / Trusted uploader">💀</span><?php endif; ?>
<a href="<?= h(magnet($m)) ?>" title="Download this magnet link">🧲</a>
<br><span class="detDesc">Uploaded <?= h(substr($m['last_modified'], 0, 10)) ?>, ULed by
<b><?= h($m['author']) ?></b> · license: <?= h($m['license']) ?> · <?= fmt_n((int)$m['downloads']) ?> downloads</span>
</td>
<td align="right"><?= fmt_size($m['size_bytes'] ? (int)$m['size_bytes'] : null) ?></td>
<td align="right"><font color="#00aa00"><b><?= fmt_n($se) ?></b></font></td>
<td align="right"><font color="#aa0000"><?= fmt_n($le) ?></font></td>
</tr>
<?php } ?>
</table>
<?php if ($cat !== 0 && $total > $per): ?>
<table width="100%" cellpadding="6"><tr><td align="center"><font size="2">
<?php for ($p = 0; $p * $per < $total; $p++) {
    echo $p === $page ? '<b>[' . ($p + 1) . ']</b> ' : '<a href="?cat=' . $cat . '&page=' . $p . '">' . ($p + 1) . '</a> ';
} ?>
</font></td></tr></table>
<?php endif; ?>
<?php render_ad(); page_footer(); ?>
