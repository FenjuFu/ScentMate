import { SCENT_TRANSLATIONS } from './data.js';
import { aiConfig, isAIConfigured } from './ai-config.js';

function compactList(items = [], limit = 12) {
    return Array.from(new Set(items)).slice(0, limit);
}

function collectNotes(collection) {
    const notes = [];
    (collection?.perfumes || []).forEach((perfume) => {
        notes.push(...(perfume.notes?.top || []));
        notes.push(...(perfume.notes?.middle || []));
        notes.push(...(perfume.notes?.base || []));
    });
    return compactList(notes, 18);
}

function extractJson(text) {
    if (!text) return null;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch (error) {
        return null;
    }
}

export function buildFallbackIdentity(collection, lang = 'zh') {
    const perfumes = collection?.perfumes || [];
    const notes = collectNotes(collection);
    const displayNotes = lang === 'en'
        ? notes.map(note => SCENT_TRANSLATIONS[note] || note)
        : notes;
    const first = displayNotes[0] || (lang === 'en' ? 'Scent' : '气味');
    const second = displayNotes[1] || (lang === 'en' ? 'Archive' : '档案');
    const currentName = String(collection?.name || '').trim();
    const shouldReuseName = currentName && !/^收藏夹\s*\d+$/.test(currentName) && !/^Collection\s+\d+$/i.test(currentName) && currentName !== '默认收藏夹';

    return {
        name: shouldReuseName ? currentName : (lang === 'en' ? `${first} Archive` : `${first}${second}`),
        cardTitle: lang === 'en'
            ? `${first} x ${second}`
            : `${first}与${second}的气味名片`,
        cardQuote: lang === 'en'
            ? `A scent story shaped by ${perfumes.length} perfumes and the memory of ${first}.`
            : `这张气味名片由 ${perfumes.length} 瓶香水与 ${first} 的记忆共同生成。`,
        source: 'fallback'
    };
}

export async function generateCollectionIdentity(collection, lang = 'zh') {
    const fallback = buildFallbackIdentity(collection, lang);
    if (!isAIConfigured) return fallback;

    const perfumeNames = (collection?.perfumes || []).map(item => item.name).slice(0, 12);
    const notes = collectNotes(collection);
    const payload = {
        model: aiConfig.model,
        temperature: 0.9,
        messages: [
            {
                role: 'system',
                content: lang === 'en'
                    ? 'You create poetic scent collection identities. Return JSON only with keys: name, cardTitle, cardQuote.'
                    : '你是气味策展命名助手。请只返回 JSON，包含 name、cardTitle、cardQuote 三个字段。'
            },
            {
                role: 'user',
                content: JSON.stringify({
                    lang,
                    currentName: collection?.name || '',
                    perfumeNames,
                    keyNotes: notes,
                    perfumeCount: perfumeNames.length,
                    constraints: lang === 'en'
                        ? {
                            name: '2-8 words, poetic but readable',
                            cardTitle: '4-14 words, suitable as a scent card title',
                            cardQuote: '1 sentence, under 40 words'
                        }
                        : {
                            name: '2-8 个字，像收藏夹名字',
                            cardTitle: '4-14 个字，适合作为气味名片标题',
                            cardQuote: '1 句话，40 字以内'
                        }
                })
            }
        ]
    };

    const response = await fetch(`${aiConfig.baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`ai-http-${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(content);
    if (!parsed) {
        throw new Error('ai-invalid-json');
    }

    return {
        name: String(parsed.name || fallback.name).trim() || fallback.name,
        cardTitle: String(parsed.cardTitle || fallback.cardTitle).trim() || fallback.cardTitle,
        cardQuote: String(parsed.cardQuote || fallback.cardQuote).trim() || fallback.cardQuote,
        source: 'ai'
    };
}
