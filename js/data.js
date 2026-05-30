export const DB = {
    scentProfiles: {
        "柑橘": ["香柠檬", "柠檬", "苦橙", "葡萄柚", "橘子", "青柠", "橙花油", "柚子", "苦橙叶", "佛手柑", "马鞭草", "醛", "克莱门丁橘", "小青柑", "金橘", "柑橘", "香橙", "蜜橘", "绿柑橘", "橙皮"],
        "花香": ["茉莉", "玫瑰", "依兰", "铃兰", "晚香玉", "鸢尾", "天竺葵", "薰衣草", "橙花", "紫罗兰", "牡丹", "木兰", "康乃馨", "黄葵", "菩提花", "椴树花", "洋槐", "老鹳草", "兰花", "天芥菜", "鸢尾草", "白花", "仙客来", "水仙", "小花茉莉", "五月玫瑰", "桂花", "白茉莉", "鸢尾根", "墨红玫瑰", "莲花", "百合", "奈若利橙花", "黄玉兰", "佛罗伦萨鸢尾", "雪绒花", "Hedione", "栀子花", "马黛花"],
        "木质": ["檀香木", "雪松", "香根草", "广藿香", "沉香(乌木)", "柏树", "愈创木", "松树", "橡木", "杜松", "苔藓", "冷杉香脂", "冷杉", "桃花心木", "梧桐", "莎草", "胡萝卜籽", "不凋花", "喀什米尔木", "榛木", "沉香", "奇楠", "巴拉圭愈创木", "檀香", "白檀", "木质香", "柚木", "香脂冷杉"],
        "辛辣": ["粉红胡椒", "黑胡椒", "小豆蔻", "肉桂", "丁香", "生姜", "肉豆蔻", "藏红花", "芫荽", "胡椒", "辛香料", "姜", "月桂叶", "新鲜茴香", "茴香", "葛缕子", "莳萝籽", "八角茴香", "四川花椒", "豆蔻"],
        "美食": ["香草", "零陵香豆", "焦糖", "巧克力", "蜂蜜", "咖啡", "杏仁", "椰子", "朗姆酒", "威士忌", "麦芽", "干邑白兰地", "大米", "豆乳", "米香", "芋头", "抹茶", "黑巧克力", "可可", "阿玛雷托"],
        "草本": ["薄荷", "罗勒", "迷迭香", "鼠尾草", "百里香", "茶叶", "烟草", "尤加利", "常春藤", "橡木苔", "蓝色洋甘菊", "绿薄荷", "龙蒿", "干草", "青草", "乌龙茶", "马黛茶", "摩洛哥艾蒿", "甜罗勒", "胡椒薄荷", "中式珠茶", "普洱茶", "茶香", "绿茶", "阿萨姆红茶", "茶", "白茶", "艾草", "留兰香", "布枯叶", "草本", "东方美人茶"],
        "果香": ["苹果", "桃子", "梨", "黑加仑", "无花果", "树莓", "菠萝", "西瓜", "橙子", "黑醋栗", "蜜瓜", "草莓", "青梨", "青苹果", "杏桃", "甜瓜", "樱桃", "清新香槟果香"],
        "树脂": ["琥珀", "乳香", "没药", "安息香", "劳丹脂", "白松香", "灰琥珀", "岩玫瑰树脂"],
        "动物": ["麝香", "龙涎香", "海狸香", "皮革", "海藻", "黑麝香", "花香麝香", "白麝香", "丝绒麝香"],
        "绿叶": ["紫罗兰叶", "青绿", "苦瓜", "黄瓜", "松叶", "蕨类植物", "大黄", "绿叶", "海盐", "醋栗叶"]
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
    "香橙": "Orange", "蜜橘": "Tangerine", "绿柑橘": "Green Mandarin", "橙皮": "Orange Peel", "橙子": "Orange",
    "花香": "Floral", "茉莉": "Jasmine", "玫瑰": "Rose", "依兰": "Ylang-Ylang", "铃兰": "Lily of the Valley",
    "白花": "White Flowers", "仙客来": "Cyclamen", "水仙": "Narcissus", "小花茉莉": "Jasmine Sambac",
    "五月玫瑰": "May Rose", "桂花": "Osmanthus", "白茉莉": "White Jasmine", "鸢尾根": "Orris Root",
    "墨红玫瑰": "Dark Red Rose", "莲花": "Lotus", "百合": "Lily",
    "奈若利橙花": "Neroli", "黄玉兰": "Magnolia Champaca", "佛罗伦萨鸢尾": "Florentine Iris", "雪绒花": "Edelweiss",
    "Hedione": "Hedione", "栀子花": "Gardenia", "马黛花": "Mate Blossom", "天竺葵": "Geranium", "木兰": "Magnolia", "兰花": "Orchid", "紫罗兰": "Violet",
    "木质": "Woody", "檀香木": "Sandalwood", "雪松": "Cedar", "香根草": "Vetiver", "广藿香": "Patchouli",
    "沉香": "Agarwood", "奇楠": "Kinam", "巴拉圭愈创木": "Paraguayan Guaiac Wood", "檀香": "Sandalwood", "白檀": "White Sandalwood",
    "木质香": "Woody Notes", "柚木": "Teakwood", "香脂冷杉": "Balsam Fir",
    "辛辣": "Spicy", "粉红胡椒": "Pink Pepper", "黑胡椒": "Black Pepper", "小豆蔻": "Cardamom", "肉桂": "Cinnamon",
    "肉豆蔻": "Nutmeg", "芫荽": "Coriander",
    "新鲜茴香": "Fresh Fennel", "茴香": "Fennel", "葛缕子": "Caraway", "莳萝籽": "Dill Seed", "八角茴香": "Star Anise",
    "四川花椒": "Sichuan Pepper", "豆蔻": "Cardamom", "丁香": "Clove", "月桂叶": "Bay Leaf",
    "美食": "Gourmand", "香草": "Vanilla", "零陵香豆": "Tonka Bean", "焦糖": "Caramel", "巧克力": "Chocolate",
    "抹茶": "Matcha", "黑巧克力": "Dark Chocolate", "可可": "Cocoa", "阿玛雷托": "Amaretto",
    "草本": "Herbal", "薄荷": "Mint", "罗勒": "Basil", "迷迭香": "Rosemary", "鼠尾草": "Sage",
    "摩洛哥艾蒿": "Moroccan Mugwort", "甜罗勒": "Sweet Basil", "胡椒薄荷": "Peppermint", "中式珠茶": "Chinese Gunpowder Tea",
    "普洱茶": "Pu-erh Tea", "茶香": "Tea Accord", "绿茶": "Green Tea", "阿萨姆红茶": "Assam Black Tea", "茶": "Tea",
    "东方美人茶": "Oriental Beauty Tea",
    "白茶": "White Tea", "艾草": "Wormwood", "留兰香": "Spearmint", "布枯叶": "Buchu Leaf", "草本": "Herbal Notes",
    "薰衣草花": "Lavender Blossom",
    "马黛茶": "Mate", "橡木苔": "Oakmoss", "薰衣草": "Lavender", "尤加利": "Eucalyptus", "百里香": "Thyme",
    "果香": "Fruity", "苹果": "Apple", "桃子": "Peach", "梨": "Pear", "黑加仑": "Blackcurrant",
    "黑醋栗": "Blackcurrant", "蜜瓜": "Melon", "草莓": "Strawberry", "青梨": "Green Pear", "青苹果": "Green Apple",
    "清新香槟果香": "Fresh Sparkling Fruity Notes",
    "杏桃": "Apricot", "甜瓜": "Sweet Melon", "樱桃": "Cherry", "无花果": "Fig",
    "树脂": "Resinous", "琥珀": "Amber", "乳香": "Frankincense", "没药": "Myrrh", "安息香": "Benzoin",
    "灰琥珀": "Gray Amber", "岩玫瑰树脂": "Rock Rose Resin", "白松香": "White Rosin", "劳丹脂": "Labdanum",
    "动物": "Animalic", "麝香": "Musk", "龙涎香": "Ambergris", "海狸香": "Castoreum", "皮革": "Leather",
    "黑麝香": "Black Musk", "花香麝香": "Floral Musk", "白麝香": "White Musk", "丝绒麝香": "Velvet Musk",
    "绿叶": "Green", "紫罗兰叶": "Violet Leaf", "青绿": "Green Notes", "苦瓜": "Bitter Melon", "黄瓜": "Cucumber",
    "松叶": "Pine Needles", "蕨类植物": "Fern", "大黄": "Rhubarb", "海盐": "Sea Salt", "醋栗叶": "Cassis Leaf"
};

export const TRANSLATIONS = {
    zh: {
        nav: { home: "首页", collection: "气味收藏夹", card: "气味名片", social: "气味相投", login: "登录 / 注册" },
        home: { title: "记录你的嗅觉记忆", subtitle: "每一瓶香水都是一段故事。<br>记录你收藏的香水前中后调，生成你的专属气味星云。", cta: "管理我的收藏", view_card: "查看我的星云" },
        collection: { title: "我的香水橱", add: "+ 添加香水", record_new: "记录新香水", top: "前调", middle: "中调", base: "后调", delete_confirm: "确定删除这瓶香水吗？", search: "搜索香水...", empty: "你的香水橱还是空的，点击右上角添加第一瓶香水。", empty_search: "没有找到匹配的香水。" },
        empty_quotes: ["气味先于记忆抵达。", "在等一缕风，把空白吹成形状。", "留白也是香气的一部分。", "一只空瓶，正在悄悄酝酿。", "气味未至，故事先在心里发芽。"],
        card: { overview: "气味概览", top_scents: "灵魂香调 (Top 3)", top_scents_hint: "气味名称由你在收藏夹中填写的成分决定。如果希望调整某个气味的出现频次，可以在收藏夹里编辑香水成分（例如把「墨红玫瑰」统一改为「玫瑰」），也可以保留原始名称——完全取决于你想呈现的方式。", top_pairs: "经典和弦", generated_by: "基于你收藏的香水成分生成", combo_label: "已选气味", combo_search: "搜索这组组合的香水", combo_clear: "清空", combo_hint: "在中心图上点选两个及以上气味或连线，可以让 AI 帮你找含有这组组合的香水。", combo_modal_title: "组合可能匹配的香水", combo_modal_subtitle: "包含 {0} 的香水：", combo_loading: "正在让 AI 寻找含有这组气味的香水…", combo_empty_result: "暂时没找到明确含有这组组合的香水，可以尝试更换或减少几个气味再试。", combo_error: "AI 搜索失败，请稍后重试。", combo_disclaimer: "结果由 AI 推测生成，可能不完全准确，建议进一步核实。", find_match: "寻找共鸣者", perfumes: "收藏香水", scents: "独特气味", bottles: "瓶", types: "种", explorer: "气味探索者", default_quote: "在气味的迷宫中，你找到了属于自己的线索。", music_kicker: "古典音乐配对", music_link: "打开公开链接", music_change: "换一首", music_fallback_title: "暂未匹配到音乐", music_fallback_reason: "等这张气味名片更完整一点，再为它找一首真正贴合的古典作品。" },
        social: { title: "气味相投的伙伴", match_score: "共鸣度", common_likes: "共同喜好", no_overlap: "暂无显著重叠", no_perfume_tip: "你还没有收藏香水，先公开看看大家的气味名片吧。", view_card: "查看气味名片", view_collection: "查看公开收藏", public_collection: "公开收藏夹", public_card: "公开气味名片", public_perfumes: "公开香水", public_scents: "公开气味", guest_hint: "未登录时可浏览所有公开资料，登录后还能按你的收藏计算共鸣度。", no_public_users: "还没有用户公开收藏夹或气味名片。" },
        profile: { title: "账户设置", subtitle: "设置你的昵称与头像，让你的气味名片更像你。", email_label: "登录邮箱", nickname_label: "昵称", nickname_placeholder: "输入你的昵称", preset_title: "默认昵称与头像", preset_hint: "点击一组预设即可同时应用头像和昵称，你也可以继续手动修改昵称。", random_btn: "换一组默认形象", upload_title: "自定义头像", upload_hint: "支持上传 JPG、PNG、WEBP，系统会自动裁成方形头像。", upload_btn: "上传头像", upload_replace_btn: "重新选择图片", custom_avatar_active: "当前使用自定义头像", save_btn: "保存账户设置", quick_stats: "我的收藏", perfume_count: "收藏香水", scent_count: "独特气味", entry_title: "进入账户设置", need_nickname: "请输入昵称", save_error: "保存账户设置失败，请稍后重试", security_title: "账号安全", verify_status_label: "邮箱验证状态", verify_done: "已验证", verify_pending: "未验证", verify_hint: "未验证邮箱会影响后续找回密码和账号安全。", verify_send_btn: "发送验证邮件", verify_refresh_btn: "刷新验证状态", password_title: "修改密码", password_new_label: "新密码", password_confirm_label: "确认新密码", password_placeholder: "至少 6 位", password_save_btn: "更新密码", password_tip: "出于安全考虑，Firebase 可能要求你重新登录后再修改密码。", visibility_title: "新建收藏夹默认公开", visibility_hint: "这里设置的是新建收藏夹的默认公开状态；每个收藏夹仍可在收藏页单独修改。", visibility_status_title: "默认公开状态", visibility_private: "未公开", visibility_public: "已公开", public_collection_label: "默认公开收藏夹", public_collection_hint: "新建收藏夹时，默认允许别人查看公开香水列表。", public_card_label: "默认公开气味名片", public_card_hint: "新建收藏夹时，默认允许别人查看根据该收藏夹生成的气味名片。" },
        modal: { add_perfume: "添加香水", edit_perfume: "编辑香水", perfume_name: "香水名称", brand: "品牌", top_notes: "前调", middle_notes: "中调", base_notes: "后调", select_placeholder: "点击选择...", select_ingredient: "选择成分" },
        auth: { login_tab: "登录", register_tab: "注册", email: "电子邮箱", password: "密码", confirm_password: "确认密码", username: "用户名", login_btn: "登录", register_btn: "立即注册", logout_confirm: "确定要退出登录吗？", logout_btn: "退出登录", forgot: "忘记密码？", or: "或", google: "使用 Google 登录" },
        common: { cancel: "取消", save: "保存", done: "完成", all: "全部" },
        toast: { saved: "已保存", updated: "已更新", deleted: "已删除", need_name: "请输入香水名称", need_notes: "请至少选择一种气味成分", parsed: "已解析出成分，默认添加到中调，请自行调整", not_found: "未识别出已知成分，请手动添加或检查拼写", voice_unsupported: "您的浏览器不支持语音识别", voice_listening: "正在聆听...", voice_idle: "点击麦克风开始说话", img_analyzing: "正在识别图片成分...", img_done: "识别完成，已提取成分", profile_seeded: "已为你生成默认昵称与头像，可在账户设置中继续调整", profile_saved: "账户设置已保存", avatar_uploaded: "自定义头像已载入，记得保存", avatar_invalid: "请选择 JPG、PNG 或 WEBP 图片", verification_sent: "验证邮件已发送，请前往邮箱查收", verification_checked: "邮箱验证状态已刷新", password_mismatch: "两次输入的新密码不一致", password_updated: "密码已更新", password_need_input: "请填写新密码并确认", social_load_failed: "加载公开气味资料失败，请稍后重试", music_generating: "正在重选古典音乐...", music_updated: "已换一首更贴合的古典作品", music_fallback: "AI 不可用，已改用候选作品库重新配对", music_need_perfumes: "先往收藏夹里添加香水，再为它换一首" }
    },
    en: {
        nav: { home: "Home", collection: "Collection", card: "Scent Card", social: "ScentMate", login: "Login / Sign Up" },
        home: { title: "Capture Olfactory Memories", subtitle: "Every perfume tells a story.<br>Record notes to generate your scent nebula.", cta: "Manage Collection", view_card: "View My Nebula" },
        collection: { title: "My Perfume Cabinet", add: "+ Add Perfume", record_new: "Add New", top: "Top", middle: "Middle", base: "Base", delete_confirm: "Delete this perfume?", search: "Search perfumes...", empty: "Your cabinet is empty. Click the button above to add your first perfume.", empty_search: "No matching perfumes found." },
        empty_quotes: ["Scent arrives before memory.", "Waiting for a breeze to shape the silence.", "Emptiness is also part of the perfume.", "An empty bottle, quietly brewing.", "Before the scent arrives, the story begins inside."],
        card: { overview: "Overview", top_scents: "Soul Notes", top_scents_hint: "Scent names come from what you typed in your collection. To shift how often a scent appears, edit the perfume's notes (e.g. unify variants under one common name), or keep them separate — it's entirely up to how you want this card to read.", top_pairs: "Signature Chords", generated_by: "Generated based on your collection", combo_label: "Selected", combo_search: "Find perfumes with this combo", combo_clear: "Clear", combo_hint: "Tap two or more notes — or a connection line — to let AI suggest perfumes that contain this combo.", combo_modal_title: "Possible matching perfumes", combo_modal_subtitle: "Perfumes containing {0}:", combo_loading: "Asking AI for perfumes matching these notes…", combo_empty_result: "Couldn't find perfumes clearly matching this combo. Try a different or smaller set.", combo_error: "AI search failed, please try again.", combo_disclaimer: "Results are AI-generated suggestions and may not be fully accurate — please verify.", find_match: "Find Resonance", perfumes: "Perfumes", scents: "Unique Scents", bottles: "bottles", types: "types", explorer: "Scent Explorer", default_quote: "In the labyrinth of scents, you found your thread.", music_kicker: "Classical Pairing", music_link: "Open Public Link", music_change: "Change Track", music_fallback_title: "No music pairing yet", music_fallback_reason: "Let this card settle a little more, then it will be easier to match it with the right classical work." },
        social: { title: "Scent Soulmates", match_score: "Resonance", common_likes: "Common Likes", no_overlap: "No significant overlap", no_perfume_tip: "You have no perfumes yet, so public profiles are shown for now.", view_card: "View Scent Card", view_collection: "View Public Collection", public_collection: "Public Collection", public_card: "Public Scent Card", public_perfumes: "Public Perfumes", public_scents: "Public Scents", guest_hint: "Guests can browse all public profiles. Sign in to calculate resonance from your own collection.", no_public_users: "No one has shared a public collection or scent card yet." },
        profile: { title: "Account Settings", subtitle: "Set your nickname and avatar so your scent card feels more like you.", email_label: "Email", nickname_label: "Nickname", nickname_placeholder: "Enter your nickname", preset_title: "Default Nickname & Avatar", preset_hint: "Tap a preset to apply both the avatar and nickname, then tweak the nickname if you want.", random_btn: "Shuffle Defaults", upload_title: "Custom Avatar", upload_hint: "Upload JPG, PNG, or WEBP. The app crops it into a square avatar automatically.", upload_btn: "Upload Avatar", upload_replace_btn: "Choose Another", custom_avatar_active: "Using a custom avatar now", save_btn: "Save Settings", quick_stats: "My Collection", perfume_count: "Perfumes", scent_count: "Unique Scents", entry_title: "Open Account Settings", need_nickname: "Please enter a nickname", save_error: "Failed to save account settings, please try again", security_title: "Account Security", verify_status_label: "Email Verification", verify_done: "Verified", verify_pending: "Not verified", verify_hint: "Unverified email may affect password recovery and account security.", verify_send_btn: "Send Verification Email", verify_refresh_btn: "Refresh Status", password_title: "Change Password", password_new_label: "New Password", password_confirm_label: "Confirm Password", password_placeholder: "At least 6 characters", password_save_btn: "Update Password", password_tip: "For security, Firebase may require you to sign in again before changing your password.", visibility_title: "Default visibility for new collections", visibility_hint: "These are the defaults for newly created collections. Each collection can still be changed individually on the collection page.", visibility_status_title: "Default Visibility", visibility_private: "Private", visibility_public: "Public", public_collection_label: "Default public collection", public_collection_hint: "New collections will share their perfume list by default.", public_card_label: "Default public scent card", public_card_hint: "New collections will share their generated scent card by default." },
        modal: { add_perfume: "Add Perfume", edit_perfume: "Edit Perfume", perfume_name: "Perfume Name", brand: "Brand", top_notes: "Top Notes", middle_notes: "Heart Notes", base_notes: "Base Notes", select_placeholder: "Click to select...", select_ingredient: "Select Ingredient" },
        auth: { login_tab: "Login", register_tab: "Register", email: "Email", password: "Password", confirm_password: "Confirm Password", username: "Username", login_btn: "Login", register_btn: "Register Now", logout_confirm: "Are you sure you want to logout?", logout_btn: "Sign Out", forgot: "Forgot password?", or: "OR", google: "Sign in with Google" },
        common: { cancel: "Cancel", save: "Save", done: "Done", all: "All" },
        toast: { saved: "Saved", updated: "Updated", deleted: "Deleted", need_name: "Please enter a perfume name", need_notes: "Please select at least one note", parsed: "Notes parsed and added to Heart by default, please adjust", not_found: "No known notes recognized, please add manually or check spelling", voice_unsupported: "Your browser does not support speech recognition", voice_listening: "Listening...", voice_idle: "Tap the mic to start speaking", img_analyzing: "Analyzing image notes...", img_done: "Done, notes extracted", profile_seeded: "A default nickname and avatar are ready for you in account settings", profile_saved: "Account settings saved", avatar_uploaded: "Custom avatar loaded, remember to save", avatar_invalid: "Please choose a JPG, PNG, or WEBP image", verification_sent: "Verification email sent. Please check your inbox", verification_checked: "Email verification status refreshed", password_mismatch: "The new passwords do not match", password_updated: "Password updated", password_need_input: "Please enter and confirm the new password", social_load_failed: "Failed to load public scent profiles, please try again later", music_generating: "Picking another classical pairing...", music_updated: "Switched to a better-matched classical work", music_fallback: "AI is unavailable, so a curated fallback pairing was used", music_need_perfumes: "Add perfumes before changing the music pairing" }
    }
};
