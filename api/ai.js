function readJsonBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }
    return req.body;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const baseURL = String(process.env.AI_BASE_URL || '').trim().replace(/\/$/, '');
    const apiKey = String(process.env.AI_API_KEY || '').trim();
    const model = String(process.env.AI_MODEL || '').trim();

    if (!baseURL || !apiKey || !model) {
        return res.status(500).json({
            error: 'AI environment variables are missing',
            missing: {
                AI_BASE_URL: !baseURL,
                AI_API_KEY: !apiKey,
                AI_MODEL: !model
            }
        });
    }

    const body = readJsonBody(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.9;

    if (messages.length === 0) {
        return res.status(400).json({ error: 'messages is required' });
    }

    try {
        const upstream = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature,
                messages
            })
        });

        const text = await upstream.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            data = { raw: text };
        }

        if (!upstream.ok) {
            return res.status(upstream.status).json({
                error: 'Upstream AI request failed',
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(502).json({
            error: 'AI proxy request failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
