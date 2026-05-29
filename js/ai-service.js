import { DB, SCENT_TRANSLATIONS } from './data.js';

const PROFILE_FEELINGS = {
    zh: {
        "木质": ["静谧", "森林", "沉稳"],
        "花香": ["柔光", "绽放", "温柔"],
        "柑橘": ["晨光", "清朗", "明快"],
        "辛辣": ["微火", "热烈", "张力"],
        "美食": ["暖甜", "绵软", "安抚"],
        "草本": ["青野", "清透", "自由"],
        "果香": ["轻盈", "灵动", "明媚"],
        "树脂": ["琥珀", "回响", "深邃"],
        "动物": ["贴肤", "夜色", "丝绒"],
        "绿叶": ["青影", "雨露", "鲜活"],
        "其他": ["余韵", "游离", "朦胧"]
    },
    en: {
        "木质": ["quiet", "forest", "grounded"],
        "花香": ["luminous", "blooming", "tender"],
        "柑橘": ["sunlit", "bright", "fresh"],
        "辛辣": ["smoldering", "vivid", "tense"],
        "美食": ["warm", "soft", "comforting"],
        "草本": ["green", "clear", "free"],
        "果香": ["airy", "playful", "radiant"],
        "树脂": ["amber", "echoing", "deep"],
        "动物": ["velvet", "nocturnal", "skin-close"],
        "绿叶": ["verdant", "dewy", "alive"],
        "其他": ["hazy", "floating", "lingering"]
    }
};

const PROFILE_NAME_PARTS = {
    zh: {
        "木质": ["林间", "静默"],
        "花香": ["柔光", "花信"],
        "柑橘": ["晨光", "晴息"],
        "辛辣": ["余温", "微火"],
        "美食": ["暖甜", "余甜"],
        "草本": ["青野", "风息"],
        "果香": ["果雾", "轻漾"],
        "树脂": ["琥珀", "回响"],
        "动物": ["夜绒", "贴肤"],
        "绿叶": ["青影", "雨痕"],
        "其他": ["微尘", "回声"]
    },
    en: {
        "木质": ["Forest", "Hush"],
        "花香": ["Bloom", "Glow"],
        "柑橘": ["Sunlit", "Zest"],
        "辛辣": ["Ember", "Spice"],
        "美食": ["Velvet", "Honey"],
        "草本": ["Verdant", "Breeze"],
        "果香": ["Lilt", "Mist"],
        "树脂": ["Amber", "Echo"],
        "动物": ["Velvet", "Noir"],
        "绿叶": ["Moss", "Dew"],
        "其他": ["Halo", "Whisper"]
    }
};

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

function getNoteProfile(note) {
    const match = Object.entries(DB.scentProfiles).find(([, notes]) => notes.includes(note));
    return match ? match[0] : "其他";
}

function computeTopSoulScents(collection) {
    const counts = {};
    (collection?.perfumes || []).forEach((perfume) => {
        const uniqueNotes = [...new Set([
            ...(perfume.notes?.top || []),
            ...(perfume.notes?.middle || []),
            ...(perfume.notes?.base || [])
        ])];
        uniqueNotes.forEach((note) => {
            counts[note] = (counts[note] || 0) + 1;
        });
    });

    return Object.entries(counts)
        .map(([note, count]) => ({ note, count, profile: getNoteProfile(note) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
}

function buildImpressionKeywords(topSoulScents, lang = 'zh') {
    const dictionary = PROFILE_FEELINGS[lang] || PROFILE_FEELINGS.zh;
    const keywords = [];
    topSoulScents.forEach((item) => {
        (dictionary[item.profile] || dictionary["其他"]).forEach((word) => {
            if (!keywords.includes(word)) keywords.push(word);
        });
    });
    return keywords.slice(0, 6);
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
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const dominantProfile = topSoulScents[0]?.profile || "其他";
    const secondaryProfile = topSoulScents[1]?.profile || dominantProfile;
    const nameParts = PROFILE_NAME_PARTS[lang] || PROFILE_NAME_PARTS.zh;
    const dominantWords = nameParts[dominantProfile] || nameParts["其他"];
    const secondaryWords = nameParts[secondaryProfile] || nameParts["其他"];
    const first = topSoulScents[0]
        ? (lang === 'en' ? (SCENT_TRANSLATIONS[topSoulScents[0].note] || topSoulScents[0].note) : topSoulScents[0].note)
        : (lang === 'en' ? 'Scent' : '气味');
    const second = topSoulScents[1]
        ? (lang === 'en' ? (SCENT_TRANSLATIONS[topSoulScents[1].note] || topSoulScents[1].note) : topSoulScents[1].note)
        : (lang === 'en' ? 'Archive' : '回声');
    const fallbackName = lang === 'en'
        ? `${dominantWords[0]} ${secondaryWords[1]}`
        : `${dominantWords[0]}${secondaryWords[1]}`;
    const feelingLine = impressionKeywords.slice(0, 3).join(lang === 'en' ? ', ' : '、');

    return {
        name: fallbackName,
        cardTitle: lang === 'en'
            ? `${first} in ${feelingLine || 'a new mood'}`
            : `${feelingLine || `${first}与${second}`}的气味名片`,
        cardQuote: lang === 'en'
            ? `Led by ${first}, ${second}, and the soul-note mood of ${feelingLine || 'quiet radiance'}, this collection feels intimate and memorable.`
            : `以 ${first}、${second} 为主调，这组灵魂香调传递出${feelingLine || '难以言明'}的气质。`,
        source: 'fallback'
    };
}

export async function generateCollectionIdentity(collection, lang = 'zh') {
    const fallback = buildFallbackIdentity(collection, lang);
    const perfumeNames = (collection?.perfumes || []).map(item => item.name).slice(0, 12);
    const notes = collectNotes(collection);
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const payload = {
        temperature: 0.9,
        messages: [
            {
                role: 'system',
                content: lang === 'en'
                    ? 'You create poetic scent collection identities. Base naming primarily on the emotional impression conveyed by the top 3 soul notes, not by mechanically concatenating note names. Return JSON only with keys: name, cardTitle, cardQuote.'
                    : '你是气味策展命名助手。命名必须优先依据“灵魂香调 Top 3”传递给人的感觉与气质，而不是机械拼接香材名。请只返回 JSON，包含 name、cardTitle、cardQuote 三个字段。'
            },
            {
                role: 'user',
                content: JSON.stringify({
                    lang,
                    currentName: collection?.name || '',
                    perfumeNames,
                    keyNotes: notes,
                    topSoulScents: topSoulScents.map((item) => ({
                        note: item.note,
                        displayName: lang === 'en' ? (SCENT_TRANSLATIONS[item.note] || item.note) : item.note,
                        count: item.count,
                        profile: item.profile
                    })),
                    impressionKeywords,
                    perfumeCount: perfumeNames.length,
                    constraints: lang === 'en'
                        ? {
                            name: '2-6 words, poetic but readable, should express mood before ingredients',
                            cardTitle: '4-14 words, suitable as a scent card title, based on the feeling of top soul notes',
                            cardQuote: '1 sentence, under 40 words, capture the emotional aura of the top soul notes'
                        }
                        : {
                            name: '2-6 个字，像收藏夹名字，优先写气质与感觉，不要只是罗列香材',
                            cardTitle: '4-14 个字，适合作为气味名片标题，要体现 Top 3 灵魂香调的感觉',
                            cardQuote: '1 句话，40 字以内，概括 Top 3 灵魂香调带来的情绪和氛围'
                        }
                })
            }
        ]
    };

    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
