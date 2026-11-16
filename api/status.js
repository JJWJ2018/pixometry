// POST /api/status   body: { jobId, assetId, filename }
// Checks the Pixometry job. When it is finished, downloads the result and saves it
// in Assets 10 as a NEW VERSION of the same asset (the previous version is kept).
//
// Returns { state: 'processing' | 'done' | 'failed', ... }

const { guard, readBody, assetsApi, pixApi, extOf, sameType, MIME_EXT } = require('../lib/shared');

// The job response shape is not documented on the API page, so read it defensively.
function jobState(j) {
  const raw = String(j.status ?? j.state ?? j.jobStatus ?? (j.job && (j.job.status ?? j.job.state)) ?? '').toLowerCase();
  if (/fail|error|cancel|reject|bad/.test(raw)) return { state: 'failed', raw };
  if (/complete|done|finish|success|ready|processed/.test(raw) || j.completed === true || j.done === true) return { state: 'done', raw };
  return { state: 'processing', raw };
}

function filenameFromDisposition(h) {
  if (!h) return '';
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(h);
  if (star) { try { return decodeURIComponent(star[1].replace(/"/g, '')); } catch (_) { /* fall through */ } }
  const plain = /filename="?([^";]+)"?/i.exec(h);
  return plain ? plain[1] : '';
}

module.exports = async (req, res) => {
  if (!guard(req, res, 'POST')) return;

  const body = readBody(req);
  const jobId = String(body.jobId || '').trim();
  const assetId = String(body.assetId || '').trim();
  const filename = String(body.filename || '').trim();
  if (!jobId || !assetId) return res.status(400).json({ error: 'jobId and assetId are required' });

  try {
    // 1. Ask Pixometry how the job is doing.
    const st = await pixApi('/api/v1/jobs/' + encodeURIComponent(jobId));
    const text = await st.text();
    if (!st.ok) throw new Error('Pixometry status failed (HTTP ' + st.status + '): ' + text.slice(0, 200));
    let j = {};
    try { j = JSON.parse(text); } catch (_) { throw new Error('Pixometry status is not JSON: ' + text.slice(0, 200)); }

    const { state, raw } = jobState(j);
    if (state === 'processing') return res.status(200).json({ state, pixometryStatus: raw });
    if (state === 'failed') {
      const why = j.error || j.message || j.errorMessage || raw;
      return res.status(200).json({ state, error: 'Pixometry could not process the image: ' + why });
    }

    // 2. Download the result.
    const dl = await pixApi('/api/v1/jobs/' + encodeURIComponent(jobId) + '/download');
    if (!dl.ok) throw new Error('Download from Pixometry failed (HTTP ' + dl.status + ')');
    const bytes = await dl.arrayBuffer();
    const type = (dl.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const resultName = filenameFromDisposition(dl.headers.get('content-disposition'));
    const resultExt = extOf(resultName) || MIME_EXT[type] || '';
    const origExt = extOf(filename);

    // A new version must be the same file type as the original. A channel that
    // changes the type (e.g. JPEG -> PNG cut-out or WebP) is not saved as a version.
    if (origExt && resultExt && !sameType(origExt, resultExt)) {
      return res.status(200).json({
        state: 'failed',
        error: 'The result is a .' + resultExt + ' file and the original is a .' + origExt +
          ' file. It was not saved, because a new version must keep the same file type.',
      });
    }

    // 3. Save as a new version of the same asset.
    //    Assets 10 API: POST /api/asset/{id}/original (multipart: file, createVersion).
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: type || 'application/octet-stream' }), filename || resultName || (assetId + '.' + (resultExt || 'jpg')));
    form.append('createVersion', 'true');
    const up = await assetsApi('/api/asset/' + encodeURIComponent(assetId) + '/original', { method: 'POST', body: form });
    if (!up.ok) {
      const t = await up.text().catch(() => '');
      throw new Error('Saving the new version in Assets failed (HTTP ' + up.status + '): ' + t.slice(0, 300));
    }
    return res.status(200).json({ state: 'done', savedAs: 'version', sizeBytes: bytes.byteLength });
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
};
