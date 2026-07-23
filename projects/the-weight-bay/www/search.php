<?php
require __DIR__ . '/inc.php';
$db = db();
$q = trim($_GET['q'] ?? '');

page_header("Search: $q - The Weight Bay", true);
search_box($q);
render_ad();

$rows = [];
if ($q !== '') {
    $st = $db->prepare("SELECT * FROM models WHERE hf_id LIKE ? OR pipeline_tag LIKE ? ORDER BY downloads DESC LIMIT 60");
    $st->execute(['%' . $q . '%', '%' . $q . '%']);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
}
?>
<table width="100%" cellpadding="4"><tr><td>
<font size="3"><b>Search results: &quot;<?= h($q) ?>&quot;</b></font>
<font size="1" color="#666">(<?= count($rows) ?> hits<?= count($rows) === 60 ? ', capped at 60 because pagination is effort' : '' ?>)</font>
</td></tr></table>
<?php if ($q !== '' && !$rows): ?>
<table width="100%" cellpadding="20"><tr><td align="center">
<font size="4" face="'Comic Sans MS'">No hits :(</font><br>
<font size="2">Try &quot;llama&quot;, &quot;whisper&quot;, &quot;stable&quot; — or blame the tracker.<br>
<span class="blink">The model you want is probably legal and free somewhere. Disgusting.</span></font>
</td></tr></table>
<?php else: ?>
<table class="list">
<tr><th width="90">Type</th><th>Name</th><th width="70" align="right">Size</th>
<th width="40" align="right"><font color="#00aa00">SE</font></th>
<th width="40" align="right"><font color="#aa0000">LE</font></th></tr>
<?php foreach ($rows as $i => $m) { [$se, $le] = swarm($m['hf_id'], (int)$m['downloads']); ?>
<tr<?= $i % 2 ? ' class="alt"' : '' ?>>
<td><font size="1"><a href="browse.php?cat=<?= $m['cat'] ?>"><?= h(CATS[$m['cat']] ?? '?') ?></a></font></td>
<td class="detName">
<a href="torrent.php?id=<?= $m['id'] ?>"><?= h($m['name']) ?></a>
<?php if ($m['vip']): ?><span class="vip" title="VIP / Trusted uploader">💀</span><?php endif; ?>
<a href="<?= h(magnet($m)) ?>">🧲</a>
<br><span class="detDesc">Uploaded <?= h(substr($m['last_modified'], 0, 10)) ?>, ULed by <b><?= h($m['author']) ?></b></span>
</td>
<td align="right"><?= fmt_size($m['size_bytes'] ? (int)$m['size_bytes'] : null) ?></td>
<td align="right"><font color="#00aa00"><b><?= fmt_n($se) ?></b></font></td>
<td align="right"><font color="#aa0000"><?= fmt_n($le) ?></font></td>
</tr>
<?php } ?>
</table>
<?php endif; ?>
<?php page_footer(); ?>
