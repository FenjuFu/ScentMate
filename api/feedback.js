function readJsonBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch { return {}; }
    }
    return req.body;
}

function stripControlChars(value, { keepNewline = false } = {}) {
    const s = String(value || '');
    let out = '';
    for (const ch of s) {
        const code = ch.charCodeAt(0);
        if (code < 0x20) {
            if (keepNewline && (code === 0x0a || code === 0x0d)) out += ch;
            continue;
        }
        if (code === 0x7f) continue;
        out += ch;
    }
    return out;
}

function sanitizeLine(value, max) {
    return stripControlChars(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function sanitizeBody(value, max) {
    return stripControlChars(value, { keepNewline: true }).replace(/\r\n/g, '\n').trim().slice(0, max);
}

const REPO_OWNER = 'FenjuFu';
const REPO_NAME = 'ScentMate';
const MAX_TITLE = 100;
const MAX_BODY = 4000;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = String(process.env.GITHUB_TOKEN || '').trim();
    if (!token) {
        return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
    }

    const body = readJsonBody(req);
    const title = sanitizeLine(body.title, MAX_TITLE);
    const description = sanitizeBody(body.description, MAX_BODY);
    const category = sanitizeLine(body.category, 32);
    const contact = sanitizeLine(body.contact, 200);
    const userAgent = sanitizeLine(req.headers['user-agent'], 200);
    const lang = sanitizeLine(body.lang, 8) || 'zh';
    const submittedBy = sanitizeLine(body.submittedBy, 80);

    if (!title || title.length < 4) {
        return res.status(400).json({ error: 'Title too short' });
    }
    if (!description || description.length < 10) {
        return res.status(400).json({ error: 'Description too short' });
    }

    const labels = ['user-feedback'];
    if (category === 'bug') labels.push('bug');
    else if (category === 'feature') labels.push('enhancement');
    else if (category === 'ui') labels.push('ui');
    else labels.push('feedback');

    const issueBody = [
        '## 用户反馈',
        '',
        description,
        '',
        '---',
        '',
        `- 分类: ${category || '未指定'}`,
        `- 语言: ${lang}`,
        submittedBy ? `- 用户: ${submittedBy}` : null,
        contact ? `- 联系方式: ${contact}` : null,
        userAgent ? `- UA: ${userAgent}` : null,
        `- 提交时间: ${new Date().toISOString()}`
    ].filter(Boolean).join('\n');

    try {
        const upstream = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'ScentMate-Feedback',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `[反馈] ${title}`,
                body: issueBody,
                labels
            })
        });

        const text = await upstream.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (!upstream.ok) {
            return res.status(upstream.status).json({
                error: 'GitHub issue creation failed',
                details: data
            });
        }

        return res.status(200).json({
            ok: true,
            number: data.number,
            url: data.html_url
        });
    } catch (error) {
        return res.status(502).json({
            error: 'Feedback proxy request failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
