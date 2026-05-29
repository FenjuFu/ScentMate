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

const STYLE_CONSTRAINTS = {
    zh: {
        positive: [
            "先写整体氛围，再写气味如何流动",
            "多写质地、空气感、温度、植物感、茶感、贴肤感",
            "像香水编辑写的短香评，克制、细腻、有画面",
            "可以有一点人物气场，但不要浮夸"
        ],
        negative: [
            "不要机械罗列香材",
            "不要写“这组灵魂香调传递出……”",
            "不要写“XX的气味名片”",
            "不要写“高级感、氛围感、温柔治愈”这种空泛套话",
            "不要写“像一位……”这种土味拟人",
            "不要像广告 slogan"
        ],
        examples: [
            {
                mood: "清透、自然、解压的绿意，线性茶感，微凉植物气息",
                output: {
                    name: "不焦绿",
                    cardTitle: "一口微凉的绿意",
                    cardQuote: "像刚修剪过的潮湿草坪，绿叶与淡茶气一路铺开，最后停在干净、安静的呼吸里。"
                }
            },
            {
                mood: "轻盈果香与花香交织，尾端有清透的海洋矿物感",
                output: {
                    name: "果雾轻潮",
                    cardTitle: "明亮果香里的海风",
                    cardQuote: "前段是酸甜多汁的果气，中段慢慢透出干净花香，最后落在带一点盐感的清透尾韵里。"
                }
            }
        ]
    },
    en: {
        positive: [
            "Start from the overall aura, then describe the way the scent moves",
            "Write with texture, air, temperature, tea-like clarity, skin-like softness",
            "Sound like a short perfume review, not an ad line"
        ],
        negative: [
            "Do not mechanically list ingredients",
            "Do not write generic phrases like luxury vibe or healing energy",
            "Do not write like a slogan"
        ],
        examples: [
            {
                mood: "cool green clarity, linear tea-like freshness, calm and airy",
                output: {
                    name: "Quiet Green",
                    cardTitle: "A Cool Breath of Green",
                    cardQuote: "It opens like wet grass and crushed leaves, then settles into a clean tea hush that stays close to the skin."
                }
            }
        ]
    }
};

const STYLE_BLOCKLIST = {
    zh: [
        /气味名片/g,
        /传递出/g,
        /高级感/g,
        /氛围感/g,
        /温柔治愈/g,
        /像一位/g,
        /这组灵魂香调/g,
        /收藏夹/g
    ],
    en: [
        /scent card/gi,
        /luxury vibe/gi,
        /healing/gi,
        /like a .*person/gi,
        /this collection conveys/gi,
        /collection name/gi
    ]
};

const REVIEW_SCENES = {
    zh: {
        "木质": { title: "林间静气", opening: "开场偏安静，像干净木纹里慢慢透出的凉意", heart: "中段更沉着，带一点树影与空气感", finish: "最后收成贴肤、克制的木质余韵" },
        "花香": { title: "柔光花影", opening: "前段是轻而薄的花气，不甜，也不过分张扬", heart: "中段慢慢舒展开，像光线落在花瓣背面", finish: "最后留下干净、柔和的花香薄雾" },
        "柑橘": { title: "晨光果息", opening: "一开始很明亮，像被果皮汁水轻轻擦过空气", heart: "中段依旧轻快，但轮廓变得更干净", finish: "最后停在清爽、透气的尾韵里" },
        "辛辣": { title: "微火香尘", opening: "开场带一点热度，不厚重，像香料刚刚被捻开", heart: "中段开始发光，气息更有张力", finish: "最后留下克制但持续的暖意" },
        "美食": { title: "暖甜余温", opening: "前段有柔软的甜感，但不腻，像温热空气里的奶香与点心气", heart: "中段逐渐变得绵密、安静", finish: "最后留下一层低饱和度的暖甜" },
        "草本": { title: "微凉绿息", opening: "开场像刚折开的草叶和茶梗，带一点微凉的清苦", heart: "中段很线性，像绿意一路铺开", finish: "最后停在干净、安静的植物气息里" },
        "果香": { title: "果雾轻漾", opening: "前段有酸甜多汁的果气，轻盈而明亮", heart: "中段慢慢变得通透，不会黏腻", finish: "最后只剩一点带水感的果香回声" },
        "树脂": { title: "琥珀回响", opening: "开场是安静的暖意，不张扬，却有厚度", heart: "中段像树脂在体温里慢慢化开", finish: "最后留下低调而绵长的回响" },
        "动物": { title: "夜绒贴肤", opening: "前段贴肤而安静，像布料与体温之间的摩擦", heart: "中段更柔滑，也更有亲密感", finish: "最后沉到一层干净、丝绒感的尾韵里" },
        "绿叶": { title: "雨后青影", opening: "开场像潮湿草坪和被捣碎的绿叶，带一点湿润感", heart: "中段慢慢转向更轻、更清的植物气息", finish: "最后留下微凉、透气的绿意余韵" },
        "其他": { title: "雾感余韵", opening: "开场是轻轻浮起的一层气息，不急着展开", heart: "中段轮廓慢慢清晰，却始终克制", finish: "最后停在一层干净、模糊的尾韵里" }
    },
    en: {
        "木质": { title: "Quiet Grain", opening: "It opens with a cool, clean grain of wood", heart: "then settles into a steadier, shaded calm", finish: "and dries down to a restrained woody trail" },
        "花香": { title: "Soft Bloom", opening: "It begins with a sheer floral light", heart: "then opens slowly like petals in indirect light", finish: "before fading into a clean floral haze" },
        "柑橘": { title: "Bright Peel", opening: "It starts bright, like citrus oil brushed into the air", heart: "then stays crisp and airy through the middle", finish: "before ending in a clear, breathable trail" },
        "辛辣": { title: "Soft Ember", opening: "It opens with a restrained heat, like spice just cracked open", heart: "then grows more vivid without turning heavy", finish: "before settling into a quiet warmth" },
        "美食": { title: "Warm Crumb", opening: "It opens with a soft sweetness that feels warm rather than sugary", heart: "then becomes smoother and more muted", finish: "before resting in a low, comforting warmth" },
        "草本": { title: "Cool Green", opening: "It opens like snapped stems and cool tea leaves", heart: "then stays linear and green through the middle", finish: "before settling into a clean botanical hush" },
        "果香": { title: "Fruit Mist", opening: "It begins with a juicy brightness", heart: "then turns lighter and more transparent", finish: "before fading into a watery fruit echo" },
        "树脂": { title: "Amber Echo", opening: "It starts with a quiet warmth that already has depth", heart: "then softens like resin melting into skin", finish: "before leaving a long, low amber trace" },
        "动物": { title: "Skin Velvet", opening: "It opens close to the skin, soft and intimate", heart: "then grows smoother and more tactile", finish: "before ending in a clean velvety trail" },
        "绿叶": { title: "After Rain Green", opening: "It opens like wet grass and crushed leaves", heart: "then shifts into a lighter, cleaner green air", finish: "before ending in a cool leafy trace" },
        "其他": { title: "Hazy Trace", opening: "It opens softly, without rushing into shape", heart: "then becomes clearer while staying restrained", finish: "before resting in a clean blur of scent" }
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

function formatDisplayedSoulScents(topSoulScents, lang = 'zh') {
    return topSoulScents.map((item) => lang === 'en'
        ? (SCENT_TRANSLATIONS[item.note] || item.note)
        : item.note);
}

function containsBlockedStyle(text, lang = 'zh') {
    const rules = STYLE_BLOCKLIST[lang] || STYLE_BLOCKLIST.zh;
    return rules.some((pattern) => pattern.test(String(text || '')));
}

function sanitizeField(value, fallbackValue, lang = 'zh') {
    const text = String(value || '').trim();
    if (!text || containsBlockedStyle(text, lang)) return fallbackValue;
    return text;
}

function buildReviewFallback(topSoulScents, impressionKeywords, lang = 'zh') {
    const scenes = REVIEW_SCENES[lang] || REVIEW_SCENES.zh;
    const displayedSoulScents = formatDisplayedSoulScents(topSoulScents, lang);
    const dominantProfile = topSoulScents[0]?.profile || "其他";
    const secondaryProfile = topSoulScents[1]?.profile || dominantProfile;
    const tertiaryProfile = topSoulScents[2]?.profile || secondaryProfile;
    const dominantScene = scenes[dominantProfile] || scenes["其他"];
    const secondaryScene = scenes[secondaryProfile] || scenes["其他"];
    const tertiaryScene = scenes[tertiaryProfile] || scenes["其他"];
    const first = displayedSoulScents[0] || (lang === 'en' ? 'green air' : '绿意');
    const second = displayedSoulScents[1] || (lang === 'en' ? 'tea air' : '茶气');
    const moodText = impressionKeywords.slice(0, 2).join(lang === 'en' ? ' and ' : '、');

    return {
        name: dominantScene.title,
        cardTitle: lang === 'en'
            ? `${dominantScene.title}, with ${second.toLowerCase()}`
            : `${dominantScene.title}里的一点${second}`,
        cardQuote: lang === 'en'
            ? `${dominantScene.opening}, then leans into ${second.toLowerCase()} and a ${moodText || 'quiet'} clarity, before settling into ${tertiaryScene.finish.replace(/^and /, '')}.`
            : `${dominantScene.opening}，随后慢慢转向${second}和${moodText || '更安静的空气感'}，最后收在${tertiaryScene.finish}里。`
    };
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
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const reviewFallback = buildReviewFallback(topSoulScents, impressionKeywords, lang);

    return {
        name: reviewFallback.name,
        cardTitle: reviewFallback.cardTitle,
        cardQuote: reviewFallback.cardQuote,
        source: 'fallback'
    };
}

export async function generateCollectionIdentity(collection, lang = 'zh') {
    const fallback = buildFallbackIdentity(collection, lang);
    const perfumeNames = (collection?.perfumes || []).map(item => item.name).slice(0, 12);
    const notes = collectNotes(collection);
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const styleGuide = STYLE_CONSTRAINTS[lang] || STYLE_CONSTRAINTS.zh;
    const payload = {
        temperature: 0.9,
        messages: [
            {
                role: 'system',
                content: lang === 'en'
                    ? 'You are a perfume editor, not an ad copywriter. Write like a refined short fragrance review: restrained, tactile, atmospheric, and specific. Base the output on the mood, texture, and movement created by the top 3 soul notes, not on ingredient listing. Return JSON only with keys: name, cardTitle, cardQuote.'
                    : '你是香水编辑，不是广告文案生成器。请写得像一则克制、细腻、有质地的短香评：先有整体氛围，再写气味如何流动。命名必须优先依据“灵魂香调 Top 3”形成的气质、质地和人物气场，而不是机械拼接香材名。请只返回 JSON，包含 name、cardTitle、cardQuote 三个字段。'
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
                    styleGuide,
                    perfumeCount: perfumeNames.length,
                    constraints: lang === 'en'
                        ? {
                            name: '2-4 words, elegant and memorable, more like an editorial title than a product name',
                            cardTitle: '4-10 words, reads like the title of a short perfume review, not a template',
                            cardQuote: '1 sentence, 18-36 words, describe the scent movement and texture with imagery'
                        }
                        : {
                            name: '2-6 个字，要像真正有人会取的收藏夹标题，克制、有记忆点，不要像功能名',
                            cardTitle: '4-10 个字，要像短香评标题，不要出现“气味名片”四个字',
                            cardQuote: '1 句话，28-48 个字，写气味的流动、质地和停留方式，不要空泛总结'
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
        name: sanitizeField(parsed.name, fallback.name, lang),
        cardTitle: sanitizeField(parsed.cardTitle, fallback.cardTitle, lang),
        cardQuote: sanitizeField(parsed.cardQuote, fallback.cardQuote, lang),
        source: 'ai'
    };
}
