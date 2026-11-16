// POST /api/process   body: { assetId, filename, channel, overrides? }
// Downloads the original from Assets 10 and submits it to a Pixometry channel.
// Returns { jobId }. The panel then polls /api/status until the job is done.

const { guard, readBody, assetsApi, pixApi, pixChannels } = require('../lib/shared');

module.exports = async (req, res) => {
  if (!guard(req, res, 'POST')) return;

  const body = readBody(req);
  const assetId = String(body.assetId || '').trim();
  const channel = String(body.channel || '').trim();
  const filename = String(body.filename || '').trim() || (assetId + '.jpg');
  if (!assetId || !channel) return res.status(400).json({ error: 'assetId and channel are required' });

  try {
    // Only channels that exist in the account (and are allowed) can be used.
    const channels = await pixChannels();
    if (!channels.some(c => c.name === channel)) {
      return res.status(400).json({ error: 'Channel "' + channel + '" is not available' });
    }

    // 1. Download the original from Assets 10.
    const dl = await assetsApi('/api/asset/' + encodeURIComponent(assetId) + '/original');
    if (!dl.ok) throw new Error('Download from Assets failed (HTTP ' + dl.status + ')');
    const bytes = await dl.arrayBuffer();
    const type = dl.headers.get('content-type') || 'application/octet-stream';

    // 2. Submit to Pixometry.
    const form = new FormData();
    form.append('file', new Blob([bytes], { type }), filename);
    form.append('channel', channel);
    // Optional per-job settings (Pixometry "overrides"), e.g. another output file type.
    if (body.overrides && typeof body.overrides === 'object' && Object.keys(body.overrides).length) {
      form.append('overrides', JSON.stringify(body.overrides));
    }
    const up = await pixApi('/api/v1/process', { method: 'POST', body: form });
    const text = await up.text();
    if (!up.ok) throw new Error('Pixometry refused the image (HTTP ' + up.status + '): ' + text.slice(0, 300));
    let j = {};
    try { j = JSON.parse(text); } catch (_) { throw new Error('Pixometry response is not JSON: ' + text.slice(0, 200)); }

    const jobId = j.id ?? j.jobId ?? j.job_id ?? (j.job && j.job.id);
    if (jobId === undefined || jobId === null) {
      throw new Error('Pixometry gave no job id. Response: ' + text.slice(0, 300));
    }
    return res.status(200).json({ jobId: String(jobId), sizeBytes: bytes.byteLength });
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
};
