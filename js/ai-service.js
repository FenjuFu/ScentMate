import { DB, SCENT_TRANSLATIONS, ALL_INGREDIENTS } from './data.js';

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

const CLASSICAL_MUSIC_LIBRARY = [
    {
        id: 'satie-gymnopedie-1',
        title: 'Gymnopédie No. 1',
        composer: 'Erik Satie',
        url: 'https://imslp.org/wiki/3_Gymnop%C3%A9dies_(Satie,_Erik)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['tea', 'leafy-green'],
        profiles: ['草本', '绿叶', '花香'],
        keywords: ['清透', '解压', '微凉', '安静', '线性', 'green', 'calm', 'airy', 'cool', 'quiet', 'tea', 'minimal']
    },
    {
        id: 'debussy-arabesque-1',
        title: 'Arabesque No. 1',
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/2_Arabesques_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['tea', 'leafy-green'],
        profiles: ['草本', '绿叶', '花香'],
        keywords: ['茶感', '白茶', '叶尖', '清苦', '透气', 'tea-like', 'airy', 'leafy', 'delicate', 'clear']
    },
    {
        id: 'debussy-clair-de-lune',
        title: 'Clair de lune',
        composer: 'Claude Debussy',
        url: 'https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg',
        provider: 'wikimedia',
        linkType: 'audio',
        subtypes: ['powdery-iris'],
        profiles: ['花香', '树脂', '动物'],
        keywords: ['月光', '静奢', '柔光', '粉感', '贴肤', 'moonlit', 'soft', 'powdery', 'quiet luxury']
    },
    {
        id: 'faure-pavane-op50',
        title: 'Pavane, Op. 50',
        composer: 'Gabriel Faure',
        url: 'https://imslp.org/wiki/Pavane,_Op.50_(Faur%C3%A9,_Gabriel)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['powdery-iris'],
        profiles: ['花香', '动物', '木质'],
        keywords: ['鸢尾粉感', '皂感', '丝绒', '静奢', '古典粉雾', 'orris', 'powdery', 'velvet', 'refined', 'soft-focus']
    },
    {
        id: 'ravel-tombeau-menuet',
        title: 'Menuet from Le tombeau de Couperin',
        composer: 'Maurice Ravel',
        url: 'https://imslp.org/wiki/Le_tombeau_de_Couperin_(piano)_(Ravel,_Maurice)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['powdery-iris'],
        profiles: ['花香', '木质', '动物'],
        keywords: ['鸢尾', '米粉感', '干净', '细腻', '粉扑', 'iris', 'powdery', 'clean', 'silken', 'classic']
    },
    {
        id: 'debussy-faun',
        title: "Prélude à l'après-midi d'un faune",
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/Pr%C3%A9lude_%C3%A0_l%27apr%C3%A8s-midi_d%27un_faune_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['leafy-green'],
        profiles: ['绿叶', '花香', '果香'],
        keywords: ['植物感', '空气感', '流动', '轻盈', '朦胧', 'floral', 'green', 'fluid', 'hazy']
    },
    {
        id: 'delius-first-cuckoo',
        title: 'On Hearing the First Cuckoo in Spring',
        composer: 'Frederick Delius',
        url: 'https://imslp.org/wiki/2_Pieces_for_Small_Orchestra_(Delius,_Frederick)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['leafy-green'],
        profiles: ['绿叶', '草本', '木质'],
        keywords: ['春野', '湿润', '苔感', '草坪', '露水', 'spring meadow', 'dewy', 'mossy', 'pastoral', 'verdant']
    },
    {
        id: 'schumann-waldszenen',
        title: 'Waldszenen, Op. 82',
        composer: 'Robert Schumann',
        url: 'https://imslp.org/wiki/Waldszenen,_Op.82_(Schumann,_Robert)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['leafy-green'],
        profiles: ['绿叶', '木质', '草本'],
        keywords: ['林间', '树影', '阴翳', '松针', '湿土', 'forest', 'shaded', 'woodland', 'green', 'earthy']
    },
    {
        id: 'ravel-pavane',
        title: 'Pavane pour une infante défunte',
        composer: 'Maurice Ravel',
        url: 'https://imslp.org/wiki/Pavane_pour_une_infante_d%C3%A9funte,_M.19_(Ravel,_Maurice)',
        provider: 'imslp',
        linkType: 'score-audio',
        profiles: ['花香', '动物', '木质'],
        keywords: ['古典', '克制', '优雅', '粉感', '沉静', 'elegant', 'restrained', 'classic', 'poised']
    },
    {
        id: 'faure-sicilienne',
        title: 'Sicilienne, Op. 78',
        composer: 'Gabriel Faure',
        url: 'https://imslp.org/wiki/Sicilienne,_Op.78_(Faur%E9,_Gabriel)',
        provider: 'imslp',
        linkType: 'score-audio',
        profiles: ['花香', '果香', '草本'],
        keywords: ['明亮', '轻快', '柔和', '花果', '清新', 'bright', 'graceful', 'light', 'fresh']
    },
    {
        id: 'bach-air',
        title: 'Air',
        composer: 'J. S. Bach',
        url: 'https://imslp.org/wiki/Orchestral_Suite_No.3_in_D_major,_BWV_1068_(Bach,_Johann_Sebastian)',
        provider: 'imslp',
        linkType: 'score-audio',
        profiles: ['木质', '树脂', '花香'],
        keywords: ['干净', '平衡', '纯净', '秩序', '安宁', 'clean', 'balanced', 'pure', 'serene']
    },
    {
        id: 'satie-gnossienne-1',
        title: 'Gnossienne No. 1',
        composer: 'Erik Satie',
        url: 'https://imslp.org/wiki/Gnossiennes%20(Satie,%20Erik)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['resin-incense'],
        profiles: ['树脂', '木质', '动物'],
        keywords: ['苦甜', '神秘', '药感', '阴影', '内省', 'bitter', 'mysterious', 'shadowy', 'introspective']
    },
    {
        id: 'debussy-pagodes',
        title: 'Pagodes',
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/Estampes_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['resin-incense'],
        profiles: ['树脂', '木质', '辛辣'],
        keywords: ['焚香', '树脂焚香', '木烟', '琥珀', '回响', 'incense', 'resinous', 'smoky', 'amber', 'ritual']
    },
    {
        id: 'couperin-barricades',
        title: 'Les Barricades mystérieuses',
        composer: 'Francois Couperin',
        url: 'https://imslp.org/wiki/Les_Barricades_myst%C3%A9rieuses_(Couperin,_Fran%C3%A7ois)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['resin-incense'],
        profiles: ['树脂', '花香', '动物'],
        keywords: ['香脂', '烛光', '粉尘', '缓慢燃烧', '旧木柜', 'benzoin', 'ambered', 'hushed', 'powdered', 'incense veil']
    },
    {
        id: 'debussy-la-mer',
        title: 'La mer',
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/La_mer_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['fruity-sea-breeze'],
        profiles: ['果香', '绿叶', '树脂'],
        keywords: ['海风', '矿物感', '盐感', '流动', '通透', 'sea', 'mineral', 'salty', 'transparent']
    },
    {
        id: 'ravel-une-barque',
        title: "Une barque sur l'ocean",
        composer: 'Maurice Ravel',
        url: 'https://imslp.org/wiki/Miroirs_(Ravel,_Maurice)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['fruity-sea-breeze'],
        profiles: ['果香', '树脂', '花香'],
        keywords: ['水感', '波光', '漂浮', '海洋', '轻晃', 'watery', 'shimmering', 'floating', 'ocean']
    },
    {
        id: 'mendelssohn-hebrides',
        title: 'The Hebrides Overture',
        composer: 'Felix Mendelssohn',
        url: 'https://imslp.org/wiki/The_Hebrides,_Op.26_(Mendelssohn,_Felix)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['fruity-sea-breeze'],
        profiles: ['果香', '树脂', '绿叶'],
        keywords: ['果香海风', '潮气', '海崖', '冷调盐感', '风压', 'sea breeze', 'briny', 'windy', 'mineral', 'open-air']
    },
    {
        id: 'vivaldi-spring',
        title: 'Spring',
        composer: 'Antonio Vivaldi',
        url: 'https://imslp.org/wiki/Violin_Concerto_in_E_major,_RV_269_(Vivaldi,_Antonio)',
        provider: 'imslp',
        linkType: 'score',
        profiles: ['绿叶', '花香', '果香'],
        keywords: ['生机', '明媚', '鲜活', '发芽', '晴朗', 'spring', 'alive', 'fresh', 'radiant']
    },
    {
        id: 'debussy-reverie',
        title: 'Rêverie',
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/R%C3%AAverie_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        profiles: ['花香', '树脂', '其他'],
        keywords: ['朦胧', '雾气', '柔光', '漂浮', '梦感', 'dreamy', 'misty', 'soft', 'floating']
    },
    {
        id: 'debussy-voiles',
        title: 'Voiles',
        composer: 'Claude Debussy',
        url: 'https://imslp.org/wiki/Pr%C3%A9ludes,_Livre_1_(Debussy,_Claude)',
        provider: 'imslp',
        linkType: 'score-audio',
        subtypes: ['tea'],
        profiles: ['草本', '树脂', '其他'],
        keywords: ['茶雾', '薄纱', '蒸汽', '半透明', '静水', 'tea mist', 'gauzy', 'sheer', 'drifting', 'cool']
    }
];

const MUSIC_SUBTYPE_SIGNALS = {
    tea: {
        notes: ['茶叶', '乌龙茶', '马黛茶', '绿茶', '白茶', '普洱茶', '中式珠茶', '东方美人茶', '阿萨姆红茶', '茶', '茶香'],
        impressions: ['清透', '微凉', '安静', '线性', 'green', 'airy', 'cool', 'quiet', 'tea'],
        profiles: ['草本']
    },
    'leafy-green': {
        notes: ['绿叶', '青绿', '紫罗兰叶', '黄瓜', '苦瓜', '松叶', '蕨类植物', '大黄', '醋栗叶', '青草', '常春藤'],
        impressions: ['雨露', '鲜活', '植物感', 'dewy', 'verdant', 'alive', 'leafy', 'green'],
        profiles: ['绿叶']
    },
    'powdery-iris': {
        notes: ['鸢尾', '鸢尾根', '佛罗伦萨鸢尾', '紫罗兰', '紫罗兰叶', '麝香', '白麝香', '丝绒麝香'],
        impressions: ['粉感', '柔光', '贴肤', 'powdery', 'orris', 'velvet', 'soft', 'skin-close'],
        profiles: ['花香', '动物']
    },
    'resin-incense': {
        notes: ['乳香', '没药', '安息香', '劳丹脂', '白松香', '岩玫瑰树脂', '琥珀', '灰琥珀'],
        impressions: ['焚香', '琥珀', '回响', 'incense', 'resinous', 'amber', 'smoky'],
        profiles: ['树脂']
    },
    'fruity-sea-breeze': {
        fruitNotes: ['苹果', '桃子', '梨', '黑加仑', '黑醋栗', '无花果', '树莓', '菠萝', '西瓜', '橙子', '蜜瓜', '草莓', '青梨', '青苹果', '杏桃', '甜瓜', '樱桃', '清新香槟果香'],
        marineNotes: ['海盐', '海藻', '龙涎香', '灰琥珀'],
        impressions: ['海风', '盐感', '矿物感', '流动', 'sea', 'salty', 'mineral', 'watery', 'ocean'],
        profiles: ['果香']
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

function getMusicById(id) {
    return CLASSICAL_MUSIC_LIBRARY.find(item => item.id === id) || null;
}

function getMusicLinkLabel(piece, lang = 'zh') {
    const provider = piece?.provider || 'web';
    const linkType = piece?.linkType || 'web';
    const key = `${provider}:${linkType}`;
    const zh = {
        'wikimedia:audio': '在 Wikimedia Commons 收听',
        'wikimedia:score-audio': '在 Wikimedia Commons 打开',
        'imslp:score': '在 IMSLP 查看乐谱',
        'imslp:audio': '在 IMSLP 收听录音',
        'imslp:score-audio': '在 IMSLP 查看乐谱与录音',
        'musopen:audio': '在 Musopen 收听',
        'musopen:score': '在 Musopen 查看乐谱'
    };
    const en = {
        'wikimedia:audio': 'Listen on Wikimedia Commons',
        'wikimedia:score-audio': 'Open on Wikimedia Commons',
        'imslp:score': 'View score on IMSLP',
        'imslp:audio': 'Listen on IMSLP',
        'imslp:score-audio': 'Open score and recordings on IMSLP',
        'musopen:audio': 'Listen on Musopen',
        'musopen:score': 'View score on Musopen'
    };
    const dictionary = lang === 'en' ? en : zh;
    return dictionary[key] || (lang === 'en' ? 'Open public link' : '打开公开链接');
}

function deriveMusicSubtypeSignals(topSoulScents, impressionKeywords, collectionNotes = []) {
    const notes = new Set([
        ...(collectionNotes || []),
        ...topSoulScents.map((item) => item.note)
    ].filter(Boolean));
    const profiles = new Set(topSoulScents.map((item) => item.profile).filter(Boolean));
    const lowerImpressions = new Set((impressionKeywords || []).map((item) => String(item).toLowerCase()));
    const weightedSignals = [];

    const addSignal = (id, weight) => {
        if (!weight) return;
        const existing = weightedSignals.find((item) => item.id === id);
        if (existing) existing.weight = Math.max(existing.weight, weight);
        else weightedSignals.push({ id, weight });
    };

    Object.entries(MUSIC_SUBTYPE_SIGNALS).forEach(([id, rule]) => {
        let weight = 0;
        const noteMatches = (rule.notes || []).filter((note) => notes.has(note)).length;
        const impressionMatches = (rule.impressions || []).filter((item) => lowerImpressions.has(String(item).toLowerCase())).length;
        const profileMatches = (rule.profiles || []).filter((profile) => profiles.has(profile)).length;

        if (id === 'fruity-sea-breeze') {
            const fruitMatches = (rule.fruitNotes || []).filter((note) => notes.has(note)).length;
            const marineMatches = (rule.marineNotes || []).filter((note) => notes.has(note)).length;
            if (fruitMatches > 0 && marineMatches > 0) weight += 6;
            else if ((fruitMatches > 0 && profileMatches > 0) || (marineMatches > 0 && profileMatches > 0)) weight += 3;
            if (impressionMatches > 0) weight += Math.min(2, impressionMatches);
        } else {
            if (noteMatches > 0) weight += Math.min(5, noteMatches * 2);
            if (profileMatches > 0) weight += profileMatches;
            if (impressionMatches > 0) weight += Math.min(2, impressionMatches);
        }

        if (weight > 0) addSignal(id, weight);
    });

    return weightedSignals.sort((a, b) => b.weight - a.weight);
}

function rankMusicCandidates(topSoulScents, impressionKeywords, excludeIds = [], collectionNotes = []) {
    const profileWeights = topSoulScents.map((item, index) => ({
        profile: item.profile,
        weight: Math.max(1, 4 - index)
    }));
    const subtypeSignals = deriveMusicSubtypeSignals(topSoulScents, impressionKeywords, collectionNotes);
    const excluded = new Set((excludeIds || []).filter(Boolean));
    return CLASSICAL_MUSIC_LIBRARY
        .filter((piece) => !excluded.has(piece.id))
        .map((piece) => {
            let score = 0;
            profileWeights.forEach(({ profile, weight }) => {
                if (piece.profiles.includes(profile)) score += weight * 3;
            });
            impressionKeywords.forEach((keyword) => {
                const lowerKeyword = String(keyword).toLowerCase();
                if (piece.keywords.some((item) => item.toLowerCase() === lowerKeyword)) score += 2;
                else if (piece.keywords.some((item) => item.toLowerCase().includes(lowerKeyword))) score += 1;
            });
            subtypeSignals.forEach(({ id, weight }) => {
                if (piece.subtypes?.includes(id)) score += weight * 4;
            });
            if (piece.linkType === 'audio') score += 1.5;
            if (piece.provider === 'wikimedia' || piece.provider === 'musopen') score += 1;
            return { piece, score };
        })
        .sort((a, b) => b.score - a.score);
}

function chooseMusicFallback(topSoulScents, impressionKeywords, lang = 'zh', options = {}) {
    const ranked = rankMusicCandidates(
        topSoulScents,
        impressionKeywords,
        options.excludeIds || [],
        options.collectionNotes || []
    );
    return ranked[0]?.piece || CLASSICAL_MUSIC_LIBRARY[0];
}

function buildMusicPayload(piece, topSoulScents, impressionKeywords, lang = 'zh', reasonOverride = '', source = 'fallback') {
    return {
        musicId: piece.id,
        musicTitle: piece.title,
        musicComposer: piece.composer,
        musicUrl: piece.url,
        musicProvider: piece.provider || '',
        musicLinkLabel: getMusicLinkLabel(piece, lang),
        musicReason: reasonOverride || buildMusicReasonFallback(piece, topSoulScents, impressionKeywords, lang),
        source
    };
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

function buildMusicReasonFallback(piece, topSoulScents, impressionKeywords, lang = 'zh') {
    const displayedSoulScents = formatDisplayedSoulScents(topSoulScents, lang);
    const first = displayedSoulScents[0] || (lang === 'en' ? 'green air' : '绿意');
    const second = displayedSoulScents[1] || (lang === 'en' ? 'tea air' : '茶气');
    const moodText = impressionKeywords.slice(0, 2).join(lang === 'en' ? ' and ' : '、');

    if (lang === 'en') {
        return `${piece.title} fits this card because it carries the same ${moodText || 'quiet'} restraint, opening with ${first.toLowerCase()} and settling into a more skin-close sense of ${second.toLowerCase()}.`;
    }

    return `${piece.title} 很适合这张卡片，因为它和这组气味一样带着${moodText || '克制的安静'}，从 ${first} 的开场慢慢过渡到更贴肤的 ${second} 气息。`;
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
    const notes = collectNotes(collection);
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const reviewFallback = buildReviewFallback(topSoulScents, impressionKeywords, lang);
    const musicFallback = chooseMusicFallback(topSoulScents, impressionKeywords, lang, { collectionNotes: notes });

    return {
        name: reviewFallback.name,
        cardTitle: reviewFallback.cardTitle,
        cardQuote: reviewFallback.cardQuote,
        ...buildMusicPayload(musicFallback, topSoulScents, impressionKeywords, lang),
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
                    ? 'You are a perfume editor, not an ad copywriter. Write like a refined short fragrance review: restrained, tactile, atmospheric, and specific. Base the output on the mood, texture, and movement created by the top 3 soul notes, not on ingredient listing. Also choose one classical music work from the provided catalog that best matches the card mood. Return JSON only with keys: name, cardTitle, cardQuote, musicId, musicReason.'
                    : '你是香水编辑，不是广告文案生成器。请写得像一则克制、细腻、有质地的短香评：先有整体氛围，再写气味如何流动。命名必须优先依据“灵魂香调 Top 3”形成的气质、质地和人物气场，而不是机械拼接香材名。还要从提供的古典音乐作品库里挑一首最贴合这张气味名片气质的作品。请只返回 JSON，包含 name、cardTitle、cardQuote、musicId、musicReason 五个字段。'
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
                    musicCatalog: CLASSICAL_MUSIC_LIBRARY.map((item) => ({
                        id: item.id,
                        title: item.title,
                        composer: item.composer,
                        provider: item.provider,
                        linkType: item.linkType,
                        subtypes: item.subtypes || [],
                        profiles: item.profiles,
                        keywords: item.keywords
                    })),
                    styleGuide,
                    perfumeCount: perfumeNames.length,
                    constraints: lang === 'en'
                        ? {
                            name: '2-4 words, elegant and memorable, more like an editorial title than a product name',
                            cardTitle: '4-10 words, reads like the title of a short perfume review, not a template',
                            cardQuote: '1 sentence, 18-36 words, describe the scent movement and texture with imagery',
                            musicId: 'must be one id from musicCatalog',
                            musicReason: '1 sentence, explain why the music matches the scent mood'
                        }
                        : {
                            name: '2-6 个字，要像真正有人会取的收藏夹标题，克制、有记忆点，不要像功能名',
                            cardTitle: '4-10 个字，要像短香评标题，不要出现“气味名片”四个字',
                            cardQuote: '1 句话，28-48 个字，写气味的流动、质地和停留方式，不要空泛总结',
                            musicId: '必须是 musicCatalog 里的某个 id',
                            musicReason: '1 句话，解释这首古典音乐和这张卡片为什么气质相合'
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

    const chosenMusic = getMusicById(String(parsed.musicId || ''))
        || getMusicById(fallback.musicId)
        || chooseMusicFallback(topSoulScents, impressionKeywords, lang, { collectionNotes: notes });
    const musicPayload = buildMusicPayload(
        chosenMusic,
        topSoulScents,
        impressionKeywords,
        lang,
        sanitizeField(parsed.musicReason, fallback.musicReason, lang),
        'ai'
    );

    return {
        name: sanitizeField(parsed.name, fallback.name, lang),
        cardTitle: sanitizeField(parsed.cardTitle, fallback.cardTitle, lang),
        cardQuote: sanitizeField(parsed.cardQuote, fallback.cardQuote, lang),
        ...musicPayload,
        source: 'ai'
    };
}

export async function generateCollectionMusicPairing(collection, currentMusicId = '', lang = 'zh') {
    const notes = collectNotes(collection);
    const topSoulScents = computeTopSoulScents(collection);
    const impressionKeywords = buildImpressionKeywords(topSoulScents, lang);
    const fallbackPiece = chooseMusicFallback(topSoulScents, impressionKeywords, lang, {
        excludeIds: [currentMusicId],
        collectionNotes: notes
    });
    const fallback = buildMusicPayload(fallbackPiece, topSoulScents, impressionKeywords, lang, '', 'fallback');
    const candidates = rankMusicCandidates(topSoulScents, impressionKeywords, [currentMusicId], notes)
        .slice(0, 6)
        .map(({ piece }) => ({
            id: piece.id,
            title: piece.title,
            composer: piece.composer,
            provider: piece.provider,
            linkType: piece.linkType,
            subtypes: piece.subtypes || [],
            profiles: piece.profiles,
            keywords: piece.keywords
        }));

    if (candidates.length === 0) {
        return fallback;
    }

    try {
        const payload = {
            temperature: 0.75,
            messages: [
                {
                    role: 'system',
                    content: lang === 'en'
                        ? 'You are a perfume editor selecting a classical music pairing. Choose one work from the provided candidate list that best matches the mood of the scent card. Return JSON only with keys: musicId, musicReason.'
                        : '你是香水编辑，正在为一张气味名片挑选更贴切的古典音乐。请只从提供的候选作品里选一首，返回 JSON，包含 musicId 和 musicReason 两个字段。'
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        lang,
                        currentMusicId,
                        topSoulScents: topSoulScents.map((item) => ({
                            note: item.note,
                            displayName: lang === 'en' ? (SCENT_TRANSLATIONS[item.note] || item.note) : item.note,
                            count: item.count,
                            profile: item.profile
                        })),
                        impressionKeywords,
                        candidates,
                        constraints: lang === 'en'
                            ? {
                                musicId: 'must be one id from candidates',
                                musicReason: '1 sentence, explain why this piece matches the scent better than the current one'
                            }
                            : {
                                musicId: '必须是 candidates 里的某个 id',
                                musicReason: '1 句话，解释这首曲子为什么更贴这张气味名片'
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
            return fallback;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || '';
        const parsed = extractJson(content);
        if (!parsed) {
            return fallback;
        }

        const chosenMusic = getMusicById(String(parsed.musicId || '')) || fallbackPiece;
        return buildMusicPayload(
            chosenMusic,
            topSoulScents,
            impressionKeywords,
            lang,
            sanitizeField(parsed.musicReason, fallback.musicReason, lang),
            'ai'
        );
    } catch (error) {
        return fallback;
    }
}

export async function lookupPerfumeNotes(name, brand, lang = 'zh') {
    const cleanName = String(name || '').trim().slice(0, 80);
    const cleanBrand = String(brand || '').trim().slice(0, 80);
    if (!cleanName) throw new Error('lookup-need-name');

    const ingredientNames = Array.isArray(ALL_INGREDIENTS) ? ALL_INGREDIENTS.map(i => i.name) : [];
    const enToZh = {};
    Object.entries(SCENT_TRANSLATIONS || {}).forEach(([zh, en]) => {
        if (typeof en === 'string') {
            enToZh[en.toLowerCase()] = zh;
        }
    });

    const systemContent = lang === 'en'
        ? `You are a fragrance expert. Given a perfume's brand and name (which may be misspelled, partial, abbreviated, or in mixed languages), do two things:
1) Identify the perfume the user most likely means. If the input is ambiguous or you are not confident, leave fields empty — do NOT guess.
2) Return its real, publicly known notes split into top / middle / base. Use Chinese ingredient names (short, single-term like 血橙, 青豌豆, 降龙涎香醚, 鸢尾花, 白松香). Prefer the names from the provided dictionary when they fit; if the actual note is outside the dictionary write it out anyway — accuracy beats dictionary-matching.

Output strict JSON only: {"brand_canonical": "...", "name_canonical": "...", "summary": "...", "confidence": "high|medium|low", "top": [...], "middle": [...], "base": [...]}.
- brand_canonical: the brand's most commonly used Chinese name (or its original Western name if no Chinese name exists). Empty string if unsure.
- name_canonical: the perfume's commonly used Chinese name. Empty string if unsure.
- summary: 1-2 short Chinese sentences explaining which perfume you matched (brand + name + brief identifier like "调香师 / 系列 / 发布年份") and your confidence basis. If unsure, say so in summary.
- confidence: your honest confidence — "high" if you've definitely seen this exact release, "medium" if you matched by family/series, "low" if you're guessing.
- 2-6 notes per layer.
- If confidence is "low" or unsure overall, return empty arrays AND empty canonical strings. Do not invent perfumes.`
        : `你是熟悉香水的资深成分编辑。用户给的品牌 / 香水名可能拼错、不完整、缩写或中英混排。请做两件事：
1) 推断他最有可能指的是哪一款香水。如果不确定或有歧义，相关字段留空——不要瞎猜。
2) 输出该香水**真实公开记录**的前调 / 中调 / 后调。请用简短的中文成分名（如：血橙、青豌豆、降龙涎香醚、鸢尾花、白松香）。**字典只是参考**：能对上就用字典词，对不上的真实成分直接写出来，准确性比对齐字典更重要。

严格只输出 JSON：{"brand_canonical": "...", "name_canonical": "...", "summary": "...", "confidence": "high|medium|low", "top": [...], "middle": [...], "base": [...]}。
- brand_canonical：该品牌最常用的中文名（如果没有公认中文名就用原文）。不确定就空字符串。
- name_canonical：该香水最常用的中文名。不确定就空字符串。
- summary：1-2 句中文，说明你判断的是哪一款香水（品牌 + 名字 + 可识别的辅助信息，如调香师 / 系列 / 发布年份），以及你判断的依据。没把握就直说"不确定"。
- confidence：诚实评估自己的确信度——"high"（你确定见过这款发布）/"medium"（按家族/系列推断）/"low"（基本是猜的）。
- 每层 2-6 个成分。
- 如果 confidence 是 "low" 或整体没把握，请同时把数组和 canonical 置空，不要编造香水。`;

    const payload = {
        temperature: 0.2,
        messages: [
            {
                role: 'system',
                content: `${systemContent}\n\n--- Ingredient dictionary (reference) ---\n${ingredientNames.join(', ')}`
            },
            {
                role: 'user',
                content: JSON.stringify({
                    brand: cleanBrand || '(unknown)',
                    name: cleanName,
                    lang
                })
            }
        ]
    };

    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let detail = '';
        try { detail = (await response.text()).slice(0, 300); } catch {}
        const err = new Error(`ai-http-${response.status}`);
        err.code = `ai-http-${response.status}`;
        err.detail = detail;
        throw err;
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(content);
    if (!parsed) throw new Error('ai-invalid-json');

    const ingredientSet = new Set(ingredientNames);
    const normalize = (list) => {
        if (!Array.isArray(list)) return [];
        const cleaned = [];
        const seen = new Set();
        for (const item of list) {
            if (typeof item !== 'string') continue;
            let candidate = item.trim();
            if (!candidate || candidate.length > 20) continue;
            // Strip wrapping punctuation
            candidate = candidate.replace(/^[("「『]+|[)"」』。,，、；;]+$/g, '').trim();
            if (!candidate) continue;
            // Map english alias to chinese dictionary entry if possible
            if (!ingredientSet.has(candidate)) {
                const zh = enToZh[candidate.toLowerCase()];
                if (zh && ingredientSet.has(zh)) candidate = zh;
            }
            if (seen.has(candidate)) continue;
            seen.add(candidate);
            cleaned.push(candidate);
            if (cleaned.length >= 8) break;
        }
        return cleaned;
    };

    const cleanCanonical = (v) => {
        if (typeof v !== 'string') return '';
        return v.trim().replace(/^["「『"]+|["」』"]+$/g, '').slice(0, 60);
    };

    const cleanConfidence = (v) => {
        const s = String(v || '').trim().toLowerCase();
        if (s === 'high' || s === 'medium' || s === 'low') return s;
        return 'medium';
    };

    return {
        brandCanonical: cleanCanonical(parsed.brand_canonical),
        nameCanonical: cleanCanonical(parsed.name_canonical),
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 400) : '',
        confidence: cleanConfidence(parsed.confidence),
        top: normalize(parsed.top),
        middle: normalize(parsed.middle),
        base: normalize(parsed.base)
    };
}

export async function askScentAdvisor(history, context, lang = 'zh') {
    const safeHistory = (history || [])
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!safeHistory.length || safeHistory[safeHistory.length - 1].role !== 'user') {
        throw new Error('advisor-need-user-message');
    }

    const perfumeNames = Array.isArray(context?.perfumes)
        ? context.perfumes.map(p => (p && p.name) || '').filter(Boolean).slice(0, 24)
        : [];
    const topSoulScents = Array.isArray(context?.topSoulScents)
        ? context.topSoulScents.slice(0, 6).map(s => (typeof s === 'string' ? s : s?.note || ''))
        : [];
    const topPairs = Array.isArray(context?.topPairs)
        ? context.topPairs.slice(0, 6)
        : [];
    const collectionName = (context?.collectionName || '').toString().slice(0, 60);

    const contextSummary = lang === 'en'
        ? `Collection name: ${collectionName || 'unnamed'}.\nPerfumes in this collection (${perfumeNames.length}): ${perfumeNames.join(', ') || '(none)'}\nTop soul notes: ${topSoulScents.join(', ') || '(none)'}\nTop co-occurring pairs: ${topPairs.map(p => `${p.source}-${p.target}`).join(', ') || '(none)'}`
        : `收藏夹名称：${collectionName || '未命名'}。\n这一收藏夹里的香水（${perfumeNames.length} 瓶）：${perfumeNames.join('，') || '（空）'}\n灵魂香调 Top：${topSoulScents.join('，') || '（无）'}\n共现最强的调性组合：${topPairs.map(p => `${p.source}-${p.target}`).join('，') || '（无）'}`;

    const systemContent = lang === 'en'
        ? `You are a knowledgeable, warm, and concise fragrance advisor on the ScentMate app. You are looking at a specific perfume collection (which may belong to the user or to another user whose card they are viewing). Base your replies on this collection's data when possible, and refer to it as "this collection" — do NOT assume the asker owns it. Be specific (real perfume names, brands, notes), avoid generic marketing tone, and keep answers tight (under 250 words). Never invent perfumes — if you are not confident, say so. When recommending, prefer well-known and findable releases. If the question is unrelated to fragrance, gently steer back to fragrance topics.\n\n--- Collection context ---\n${contextSummary}`
        : `你是 ScentMate 应用里一位懂行、克制、有温度的香水顾问。你正在查看的是一份特定的香水收藏夹（可能属于提问者本人，也可能是另一位用户公开的气味名片），请围绕"这一收藏夹 / 这份名片"回答，不要默认提问者就是收藏夹的主人，避免使用"你的收藏""你喜欢"这类归属性表述。建议必须具体（真实存在的香水名/品牌/调性），避免广告腔，回答控制在 250 字以内。不要编造香水——没把握就直说。推荐时优先选知名、可查证的作品。如果用户问的内容和香水无关，温和地把话题拉回来。\n\n--- 收藏夹上下文 ---\n${contextSummary}`;

    const payload = {
        temperature: 0.6,
        messages: [
            { role: 'system', content: systemContent },
            ...safeHistory
        ]
    };

    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let detail = '';
        try {
            const body = await response.text();
            detail = body.slice(0, 300);
        } catch {}
        const err = new Error(`ai-http-${response.status}`);
        err.code = `ai-http-${response.status}`;
        err.detail = detail;
        throw err;
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (!content.trim()) {
        const err = new Error('advisor-empty-reply');
        err.code = 'advisor-empty-reply';
        throw err;
    }
    return content.trim();
}

export async function searchPerfumesByNoteCombination(notes, lang = 'zh') {
    const cleanNotes = Array.from(new Set((notes || []).filter(n => typeof n === 'string' && n.trim()))).slice(0, 8);
    if (cleanNotes.length < 2) {
        throw new Error('combo-need-two');
    }
    const displayNotes = lang === 'en'
        ? cleanNotes.map(n => SCENT_TRANSLATIONS[n] || n)
        : cleanNotes;

    const payload = {
        temperature: 0.4,
        messages: [
            {
                role: 'system',
                content: lang === 'en'
                    ? 'You are a knowledgeable perfume reviewer. Given a set of fragrance notes, suggest real perfumes that prominently feature ALL of those notes together (or as close to all as realistically possible). Prefer well-known and verifiable releases. Return JSON only, with the shape {"results": [{"name": "...", "brand": "...", "reason": "one short sentence explaining how this perfume uses these notes"}]}. If you cannot find any confident match, return {"results": []}. Provide at most 6 suggestions, ordered by how strongly they match the combo. Do not invent perfumes — only list ones you are confident exist.'
                    : '你是熟悉香水的资深评测者。给你一组香气成分，请列出真实存在、并且明显同时含有这些成分（或尽可能接近全部）的香水。请优先推荐知名度较高、可查证的作品。只返回 JSON，结构为 {"results": [{"name": "...", "brand": "...", "reason": "一句话说明这款香水如何呈现这些气味"}]}。如果没有把握，返回 {"results": []}。最多 6 条结果，按匹配度排序。不要编造香水——只列你确信存在的。'
            },
            {
                role: 'user',
                content: JSON.stringify({
                    lang,
                    notes: cleanNotes,
                    displayNotes,
                    instruction: lang === 'en'
                        ? 'Find perfumes that contain these notes together.'
                        : '找含有这些气味组合的香水。'
                })
            }
        ]
    };

    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`ai-http-${response.status}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(content);
    if (!parsed || !Array.isArray(parsed.results)) {
        throw new Error('ai-invalid-json');
    }
    return parsed.results
        .map(item => ({
            name: typeof item.name === 'string' ? item.name.trim() : '',
            brand: typeof item.brand === 'string' ? item.brand.trim() : '',
            reason: typeof item.reason === 'string' ? item.reason.trim() : ''
        }))
        .filter(item => item.name)
        .slice(0, 6);
}
