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

function getEnv(name) {
    return String(process.env[name] || '').trim();
}

function resolveProvider(wantsSearch) {
    const defaultBase = getEnv('AI_BASE_URL').replace(/\/$/, '');
    const defaultKey = getEnv('AI_API_KEY');
    const defaultModel = getEnv('AI_MODEL');

    const searchBase = getEnv('AI_SEARCH_BASE_URL').replace(/\/$/, '');
    const searchKey = getEnv('AI_SEARCH_API_KEY');
    const searchModel = getEnv('AI_SEARCH_MODEL');

    if (wantsSearch && searchBase) {
        return {
            mode: 'search',
            baseURL: searchBase,
            apiKey: searchKey || defaultKey,
            model: searchModel || defaultModel
        };
    }
    return {
        mode: 'default',
        baseURL: defaultBase,
        apiKey: defaultKey,
        model: defaultModel
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = readJsonBody(req);
    const wantsSearch = body.search === true;
    const provider = resolveProvider(wantsSearch);
    const { baseURL, apiKey, model, mode } = provider;

    if (!baseURL || !apiKey || !model) {
        return res.status(500).json({
            error: wantsSearch
                ? 'Search-mode AI environment variables are missing'
                : 'AI environment variables are missing',
            mode,
            missing: {
                BASE_URL: !baseURL,
                API_KEY: !apiKey,
                MODEL: !model
            }
        });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.9;

    if (messages.length === 0) {
        return res.status(400).json({ error: 'messages is required' });
    }

    const upstreamBody = { model, messages };
    // Some search-only models (e.g. OpenAI gpt-4o-search-preview) reject the
    // temperature field. Only forward it for the default chat-completions path.
    if (mode === 'default') upstreamBody.temperature = temperature;

    try {
        const upstream = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(upstreamBody)
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
                mode,
                details: data
            });
        }

        // Pass through Perplexity citations if present so the client can show sources.
        if (Array.isArray(data?.citations) && !data?.choices?.[0]?.citations) {
            try { data.choices[0].citations = data.citations; } catch {}
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(502).json({
            error: 'AI proxy request failed',
            mode,
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
