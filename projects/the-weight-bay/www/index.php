<?php
require __DIR__ . '/inc.php';
$db = db();
$hits = counter_bump('index');
$stats = $db->query("SELECT COUNT(*) AS n, SUM(size_bytes) AS sz, SUM(downloads) AS dl FROM models")->fetch(PDO::FETCH_ASSOC);
$ncomments = (int)$db->query("SELECT COUNT(*) FROM comments")->fetchColumn();

page_header("The Weight Bay - Download AI models, LLMs, diffusion, embeddings!");
search_box();
render_ad();
?>
<table width="100%" cellpadding="10"><tr><td align="center">
<font size="2">
<b><?= fmt_n((int)$stats['n']) ?></b> models tracked ·
<b><?= fmt_size((int)$stats['sz']) ?></b> of pure weights ·
<b><?= fmt_n((int)$stats['dl']) ?></b> combined downloads ·
<b><?= fmt_n($ncomments) ?></b> comments of questionable value
</font>
<br><br>
<font size="1" color="#666">How it works: we "track" files that a multi-billion dollar company hosts publicly, for free,<br>
on a CDN faster than any swarm — but with <b>0% pirate energy</b>. We fixed that part.</font>
</td></tr></table>

<table width="100%" cellpadding="6"><tr>
<td width="50%" valign="top">
<font size="3" face="Impact"><span class="fire">🔥 HOT UPLOADS</span></font>
<table class="list">
<?php
$rows = $db->query("SELECT * FROM models ORDER BY last_modified DESC LIMIT 8")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $i => $m) { [$se, $le] = swarm($m['hf_id'], (int)$m['downloads']); ?>
<tr<?= $i % 2 ? ' class="alt"' : '' ?>>
<td><a href="torrent.php?id=<?= $m['id'] ?>"><?= h($m['name']) ?></a>
<?php if ($m['vip']): ?><span class="vip" title="Trusted uploader">💀</span><?php endif; ?>
<br><span class="detDesc">by <?= h($m['author']) ?> · <?= fmt_size($m['size_bytes'] ? (int)$m['size_bytes'] : null) ?></span></td>
<td align="right"><font color="#00aa00"><b><?= fmt_n($se) ?></b></font></td>
</tr>
<?php } ?>
</table>
</td>
<td width="50%" valign="top">
<font size="3" face="Impact"><font color="#0000cc">💾 MOST SEEDED OF ALL TIME</font></font>
<table class="list">
<?php
$rows = $db->query("SELECT * FROM models ORDER BY downloads DESC LIMIT 8")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $i => $m) { [$se, $le] = swarm($m['hf_id'], (int)$m['downloads']); ?>
<tr<?= $i % 2 ? ' class="alt"' : '' ?>>
<td><a href="torrent.php?id=<?= $m['id'] ?>"><?= h($m['name']) ?></a>
<?php if ($m['vip']): ?><span class="vip" title="Trusted uploader">💀</span><?php endif; ?>
<br><span class="detDesc">by <?= h($m['author']) ?> · <?= h(CATS[$m['cat']] ?? '?') ?></span></td>
<td align="right"><font color="#00aa00"><b><?= fmt_n($se) ?></b></font></td>
</tr>
<?php } ?>
</table>
</td>
</tr></table>

<?php render_ad(); ?>

<table width="100%" cellpadding="10"><tr><td align="center">
<font size="2" face="'Comic Sans MS'">You are visitor number</font><br>
<?= odometer($hits) ?><br>
<font size="1" color="#888">(number is stored in a real database, which makes it MORE fake somehow)</font><br><br>
<img src="assets/badge_php.gif" alt="powered by PHP" onerror="this.replaceWith('[PHP POWERED]')" height="31">
<font size="1">
<span style="border:2px outset #aaa;background:#ccc;color:#000;padding:2px 4px">✅ Y2K COMPLIANT</span>
<span style="border:2px outset #aaa;background:#ccc;color:#000;padding:2px 4px">🖱 GET MOUSE</span>
<span style="border:2px outset #aaa;background:#ccc;color:#000;padding:2px 4px">🔞 NO FRAMES</span>
<span style="border:2px outset #aaa;background:#ccc;color:#000;padding:2px 4px" class="blink">📧 SIGN THE GUESTBOOK</span>
</font>
</td></tr></table>
<?php page_footer(); ?>
