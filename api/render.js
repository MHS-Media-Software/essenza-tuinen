// Vercel serverless function: genereert een fotorealistische AI-impressie van het
// tuinontwerp. Image-to-image via OpenRouter (Gemini image-model), met de
// plattegrond-PNG als conditioning. Sleutel staat in env OPENROUTER_API_KEY.
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { res.status(500).json({ ok: false, error: 'geen sleutel geconfigureerd' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { imageDataUrl, prompt } = body || {};
    if (!prompt) { res.status(400).json({ ok: false, error: 'geen prompt' }); return; }

    const content = imageDataUrl
      ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUrl } }]
      : prompt;

    const model = process.env.OR_IMAGE_MODEL || 'google/gemini-3.1-flash-image';
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, modalities: ['image', 'text'], messages: [{ role: 'user', content }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(502).json({ ok: false, error: `openrouter ${r.status}` }); return; }
    const url = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) { res.status(502).json({ ok: false, error: 'geen beeld ontvangen' }); return; }
    res.status(200).json({ ok: true, image: url });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) });
  }
};
