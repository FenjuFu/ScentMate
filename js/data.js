export const DB = {
    scentProfiles: {
        "柑橘": ["香柠檬", "柠檬", "苦橙", "葡萄柚", "橘子", "青柠", "橙花油", "柚子", "苦橙叶", "佛手柑", "马鞭草", "醛", "克莱门丁橘", "小青柑", "金橘", "柑橘"],
        "花香": ["茉莉", "玫瑰", "依兰", "铃兰", "晚香玉", "鸢尾", "天竺葵", "薰衣草", "橙花", "紫罗兰", "牡丹", "木兰", "康乃馨", "黄葵", "菩提花", "椴树花", "洋槐", "老鹳草", "兰花", "天芥菜", "鸢尾草", "白花", "仙客来", "水仙", "小花茉莉", "五月玫瑰", "桂花", "白茉莉", "鸢尾根", "墨红玫瑰", "莲花", "百合"],
        "木质": ["檀香木", "雪松", "香根草", "广藿香", "沉香(乌木)", "柏树", "愈创木", "松树", "橡木", "杜松", "苔藓", "冷杉香脂", "冷杉", "桃花心木", "梧桐", "莎草", "胡萝卜籽", "不凋花", "喀什米尔木", "榛木", "沉香", "奇楠", "巴拉圭愈创木", "檀香", "白檀"],
        "辛辣": ["粉红胡椒", "黑胡椒", "小豆蔻", "肉桂", "丁香", "生姜", "肉豆蔻", "藏红花", "芫荽", "胡椒", "辛香料", "姜", "月桂叶"],
        "美食": ["香草", "零陵香豆", "焦糖", "巧克力", "蜂蜜", "咖啡", "杏仁", "椰子", "朗姆酒", "威士忌", "麦芽", "干邑白兰地", "大米", "豆乳", "米香", "芋头"],
        "草本": ["薄荷", "罗勒", "迷迭香", "鼠尾草", "百里香", "茶叶", "烟草", "尤加利", "常春藤", "橡木苔", "蓝色洋甘菊", "绿薄荷", "龙蒿", "干草", "青草", "乌龙茶", "马黛茶", "摩洛哥艾蒿", "甜罗勒", "胡椒薄荷", "中式珠茶", "普洱茶", "茶香"],
        "果香": ["苹果", "桃子", "梨", "黑加仑", "无花果", "树莓", "菠萝", "西瓜", "橙子", "黑醋栗", "蜜瓜", "草莓", "青梨", "青苹果"],
        "树脂": ["琥珀", "乳香", "没药", "安息香", "劳丹脂", "白松香", "灰琥珀"],
        "动物": ["麝香", "龙涎香", "海狸香", "皮革", "海藻", "黑麝香", "花香麝香"],
        "绿叶": ["紫罗兰叶", "青绿", "苦瓜", "黄瓜", "松叶", "蕨类植物", "大黄"]
    },
    descriptions: {
        "香柠檬": "清新、爽口的柑橘香，带有复杂的花香边缘。",
        "茉莉": "浓郁、华丽且甜美的花香。",
        "檀香木": "奶油般顺滑、奶香和柔软的木质香气。",
        "玫瑰": "经典、浪漫且清新的花香调。",
        "香根草": "来自根部的泥土、木质和烟熏气息。",
        "香草": "甜美、美食调和令人舒适的香气。",
        "麝香": "柔软、粉感和类似肌肤的动物气息。",
        "雪松": "干燥、木质，类似铅笔屑的香气。",
        "广藿香": "泥土、木质，略带甜味或薄荷味。",
        "粉红胡椒": "清新、辛辣，略带花香/玫瑰香。",
        "小豆蔻": "辛辣、芳香且略带树脂味的香调。",
        "琥珀": "温暖、甜美和树脂的调协。",
        "皮革": "烟熏、焦油和皮肤的气息。",
        "鸢尾": "粉感、花香和木质感。",
        "橙花": "清新、花香和柑橘味的花朵。",
        "薰衣草": "花香、草本和干净的芳香。",
        "沉香(乌木)": "浓郁、霉味、木质和坚果味。",
        "零陵香豆": "甜美、辛辣，带有杏仁和烟草的细微差别。",
        "乳香": "树脂、香脂和略带辛辣的焚香调。"
    }
};

export const ALL_INGREDIENTS = [];
Object.entries(DB.scentProfiles).forEach(([profile, list]) => {
    list.forEach(item => ALL_INGREDIENTS.push({ name: item, profile }));
});

export const PROFILE_COLORS = {
    "柑橘": "#f6c445",
    "花香": "#e87fa8",
    "木质": "#8d6e63",
    "辛辣": "#d9534f",
    "美食": "#c98a4b",
    "草本": "#6aa84f",
    "果香": "#e76f9e",
    "树脂": "#d4af37",
    "动物": "#7a6a5d",
    "绿叶": "#43a047",
    "其他": "#bdbdbd"
};

export const SCENT_TRANSLATIONS = {
    "柑橘": "Citrus", "香柠檬": "Bergamot", "柠檬": "Lemon", "苦橙": "Bitter Orange", "葡萄柚": "Grapefruit",
    "克莱门丁橘": "Clementine", "小青柑": "Green Mandarin", "金橘": "Kumquat", "佛手柑": "Bergamot",
    "花香": "Floral", "茉莉": "Jasmine", "玫瑰": "Rose", "依兰": "Ylang-Ylang", "铃兰": "Lily of the Valley",
    "白花": "White Flowers", "仙客来": "Cyclamen", "水仙": "Narcissus", "小花茉莉": "Jasmine Sambac",
    "五月玫瑰": "May Rose", "桂花": "Osmanthus", "白茉莉": "White Jasmine", "鸢尾根": "Orris Root",
    "墨红玫瑰": "Dark Red Rose", "莲花": "Lotus", "百合": "Lily",
    "木质": "Woody", "檀香木": "Sandalwood", "雪松": "Cedar", "香根草": "Vetiver", "广藿香": "Patchouli",
    "沉香": "Agarwood", "奇楠": "Kinam", "巴拉圭愈创木": "Paraguayan Guaiac Wood", "檀香": "Sandalwood", "白檀": "White Sandalwood",
    "辛辣": "Spicy", "粉红胡椒": "Pink Pepper", "黑胡椒": "Black Pepper", "小豆蔻": "Cardamom", "肉桂": "Cinnamon",
    "美食": "Gourmand", "香草": "Vanilla", "零陵香豆": "Tonka Bean", "焦糖": "Caramel", "巧克力": "Chocolate",
    "草本": "Herbal", "薄荷": "Mint", "罗勒": "Basil", "迷迭香": "Rosemary", "鼠尾草": "Sage",
    "摩洛哥艾蒿": "Moroccan Mugwort", "甜罗勒": "Sweet Basil", "胡椒薄荷": "Peppermint", "中式珠茶": "Chinese Gunpowder Tea",
    "普洱茶": "Pu-erh Tea", "茶香": "Tea Accord",
    "果香": "Fruity", "苹果": "Apple", "桃子": "Peach", "梨": "Pear", "黑加仑": "Blackcurrant",
    "黑醋栗": "Blackcurrant", "蜜瓜": "Melon", "草莓": "Strawberry", "青梨": "Green Pear", "青苹果": "Green Apple",
    "树脂": "Resinous", "琥珀": "Amber", "乳香": "Frankincense", "没药": "Myrrh", "安息香": "Benzoin",
    "灰琥珀": "Gray Amber",
    "动物": "Animalic", "麝香": "Musk", "龙涎香": "Ambergris", "海狸香": "Castoreum", "皮革": "Leather",
    "黑麝香": "Black Musk", "花香麝香": "Floral Musk",
    "绿叶": "Green", "紫罗兰叶": "Violet Leaf", "青绿": "Green Notes", "苦瓜": "Bitter Melon", "黄瓜": "Cucumber",
    "松叶": "Pine Needles", "蕨类植物": "Fern", "大黄": "Rhubarb"
};

export const TRANSLATIONS = {
    zh: {
        nav: { home: "首页", collection: "气味收藏夹", card: "气味名片", social: "气味相投", login: "登录 / 注册" },
        home: { title: "记录你的嗅觉记忆", subtitle: "每一瓶香水都是一段故事。<br>记录你收藏的香水前中后调，生成你的专属气味星云。", cta: "管理我的收藏", view_card: "查看我的星云" },
        collection: { title: "我的香水橱", add: "+ 添加香水", record_new: "记录新香水", top: "前调", middle: "中调", base: "后调", delete_confirm: "确定删除这瓶香水吗？", search: "搜索香水...", empty: "你的香水橱还是空的，点击右上角添加第一瓶香水。", empty_search: "没有找到匹配的香水。" },
        card: { overview: "气味概览", top_scents: "灵魂香调 (Top 3)", top_pairs: "经典和弦", generated_by: "基于你收藏的香水成分生成", find_match: "寻找共鸣者", perfumes: "收藏香水", scents: "独特气味", bottles: "瓶", types: "种", explorer: "气味探索者", default_quote: "在气味的迷宫中，你找到了属于自己的线索。" },
        social: { title: "气味相投的伙伴", match_score: "共鸣度", common_likes: "共同喜好", no_overlap: "暂无显著重叠", no_perfume_tip: "请先添加香水以寻找伙伴" },
        modal: { add_perfume: "添加香水", edit_perfume: "编辑香水", perfume_name: "香水名称", brand: "品牌", top_notes: "前调", middle_notes: "中调", base_notes: "后调", select_placeholder: "点击选择...", select_ingredient: "选择成分" },
        auth: { login_tab: "登录", register_tab: "注册", email: "电子邮箱", password: "密码", confirm_password: "确认密码", username: "用户名", login_btn: "登录", register_btn: "立即注册", logout_confirm: "确定要退出登录吗？", forgot: "忘记密码？", or: "或", google: "使用 Google 登录" },
        common: { cancel: "取消", save: "保存", done: "完成", all: "全部" },
        toast: { saved: "已保存", updated: "已更新", deleted: "已删除", need_name: "请输入香水名称", need_notes: "请至少选择一种气味成分", parsed: "已解析出成分，默认添加到中调，请自行调整", not_found: "未识别出已知成分，请手动添加或检查拼写", voice_unsupported: "您的浏览器不支持语音识别", voice_listening: "正在聆听...", voice_idle: "点击麦克风开始说话", img_analyzing: "正在识别图片成分...", img_done: "识别完成，已提取成分" }
    },
    en: {
        nav: { home: "Home", collection: "Collection", card: "Scent Card", social: "ScentMate", login: "Login / Sign Up" },
        home: { title: "Capture Olfactory Memories", subtitle: "Every perfume tells a story.<br>Record notes to generate your scent nebula.", cta: "Manage Collection", view_card: "View My Nebula" },
        collection: { title: "My Perfume Cabinet", add: "+ Add Perfume", record_new: "Add New", top: "Top", middle: "Middle", base: "Base", delete_confirm: "Delete this perfume?", search: "Search perfumes...", empty: "Your cabinet is empty. Click the button above to add your first perfume.", empty_search: "No matching perfumes found." },
        card: { overview: "Overview", top_scents: "Soul Notes", top_pairs: "Signature Chords", generated_by: "Generated based on your collection", find_match: "Find Resonance", perfumes: "Perfumes", scents: "Unique Scents", bottles: "bottles", types: "types", explorer: "Scent Explorer", default_quote: "In the labyrinth of scents, you found your thread." },
        social: { title: "Scent Soulmates", match_score: "Resonance", common_likes: "Common Likes", no_overlap: "No significant overlap", no_perfume_tip: "Add perfumes to find partners" },
        modal: { add_perfume: "Add Perfume", edit_perfume: "Edit Perfume", perfume_name: "Perfume Name", brand: "Brand", top_notes: "Top Notes", middle_notes: "Heart Notes", base_notes: "Base Notes", select_placeholder: "Click to select...", select_ingredient: "Select Ingredient" },
        auth: { login_tab: "Login", register_tab: "Register", email: "Email", password: "Password", confirm_password: "Confirm Password", username: "Username", login_btn: "Login", register_btn: "Register Now", logout_confirm: "Are you sure you want to logout?", forgot: "Forgot password?", or: "OR", google: "Sign in with Google" },
        common: { cancel: "Cancel", save: "Save", done: "Done", all: "All" },
        toast: { saved: "Saved", updated: "Updated", deleted: "Deleted", need_name: "Please enter a perfume name", need_notes: "Please select at least one note", parsed: "Notes parsed and added to Heart by default, please adjust", not_found: "No known notes recognized, please add manually or check spelling", voice_unsupported: "Your browser does not support speech recognition", voice_listening: "Listening...", voice_idle: "Tap the mic to start speaking", img_analyzing: "Analyzing image notes...", img_done: "Done, notes extracted" }
    }
};

export const MOCK_USERS = [
    { name: "ForestWalker", bio: "迷恋雨后的森林", ingredients: ["香根草", "雪松", "广藿香", "柏树", "苔藓", "橡木"] },
    { name: "CitrusSummer", bio: "永远的夏天", ingredients: ["香柠檬", "柠檬", "葡萄柚", "薄荷", "罗勒"] },
    { name: "SpicySoul", bio: "温暖而热烈", ingredients: ["肉桂", "生姜", "黑胡椒", "小豆蔻", "丁香", "檀香木"] },
    { name: "SweetDream", bio: "美食调爱好者", ingredients: ["香草", "焦糖", "巧克力", "杏仁", "零陵香豆"] }
];
