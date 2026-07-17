// Vercel serverless function: genereert een fotorealistische AI-impressie van het
// tuinontwerp via OpenRouter (Gemini image-model).
// - imageDataUrl : de plattegrond-PNG (conditioning voor de indeling)
// - photoDataUrl : (optioneel) foto van de huidige tuin — het ontwerp wordt hierin verwerkt
// - prompt       : de tekstinstructie (client bouwt deze incl. indelingsbeschrijving)
// Sleutel staat in env OPENROUTER_API_KEY.
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { res.status(500).json({ ok: false, error: 'geen sleutel geconfigureerd' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { imageDataUrl, photoDataUrl, prompt } = body || {};
    if (!prompt) { res.status(400).json({ ok: false, error: 'geen prompt' }); return; }

    // Volgorde van de beelden telt: eerst de huidige-tuinfoto (het canvas dat we herontwerpen),
    // dan de plattegrond (de indeling die we erin verwerken).
    const content = [{ type: 'text', text: prompt }];
    if (photoDataUrl) content.push({ type: 'image_url', image_url: { url: photoDataUrl } });
    if (imageDataUrl) content.push({ type: 'image_url', image_url: { url: imageDataUrl } });

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
