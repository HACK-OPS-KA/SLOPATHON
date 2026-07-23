<?php
require __DIR__ . '/inc.php';
$db = db();
$id = (int)($_GET['id'] ?? 0);
$st = $db->prepare("SELECT * FROM models WHERE id=?");
$st->execute([$id]);
$m = $st->fetch(PDO::FETCH_ASSOC);
if (!$m) { http_response_code(404); die('no such model'); }

$fname = str_replace('/', '_', $m['hf_id']) . '.torrent';
header('Content-Type: text/plain; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $fname . '"');
?>
⛵⛵⛵ THE WEIGHT BAY ⛵⛵⛵

Congratulations on downloading: <?= $m['hf_id'] . "\n" ?>

This is not a torrent file.
It never was. There is no swarm. There are no peers.
There is only a very fast, very legal CDN.

To "pirate" this model, run ONE of these:

    # the modern way
    hf download <?= $m['hf_id'] . "\n" ?>

    # the classic way
    git lfs install
    git clone https://huggingface.co/<?= $m['hf_id'] . "\n" ?>

    # the "I have a GPU and no fear" way
    python -c "from transformers import AutoModel; AutoModel.from_pretrained('<?= $m['hf_id'] ?>')"

Info hash (decorative): <?= fake_infohash($m['hf_id']) . "\n" ?>
License (real):         <?= $m['license'] . "\n" ?>
Size (approx):          <?= strip_tags(str_replace('&nbsp;', ' ', fmt_size($m['size_bytes'] ? (int)$m['size_bytes'] : null))) . "\n" ?>

Remember to seed. (There is nothing to seed. Seed anyway. Spiritually.)

-- The Weight Bay · 100% legal · 0% necessary · HACK//OPS SLOPATHON OP001
