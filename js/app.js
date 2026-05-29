import { DB, ALL_INGREDIENTS, SCENT_TRANSLATIONS, TRANSLATIONS, PROFILE_COLORS } from './data.js';
import { AuthSystem } from './auth.js';
import { ScentVisualization } from './viz.js';
import { loadLocalSync, loadPerfumes, loadPublicUsers, savePerfumes } from './store.js';

const DEFAULT_PERFUMES = [
    { id: 1, name: "蓦岚 青藤", brand: "", notes: { top: ["苦橙", "罗勒"], middle: ["常春藤"], base: ["小豆蔻", "橡木苔"] } },
    { id: 2, name: "银杉 泥煤", brand: "", notes: { top: ["威士忌", "小豆蔻", "烟雾"], middle: ["麦芽", "康乃馨", "茉莉", "橡木"], base: ["檀香木", "广藿香", "黄葵", "香草", "零陵香豆"] } },
    { id: 3, name: "天乐 天乐", brand: "", notes: { top: ["醛", "尤加利", "香柠檬", "薄荷", "杜松"], middle: ["迷迭香", "苦橙叶", "薰衣草", "劳丹脂", "乳香"], base: ["沉香(乌木)", "檀香木", "香根草", "广藿香", "琥珀", "麝香"] } },
    { id: 4, name: "天乐 不要惊动爱情", brand: "", notes: { top: ["海藻", "干邑白兰地", "蓝色洋甘菊"], middle: ["橙花", "紫罗兰叶", "乳香"], base: ["白松香", "橡木", "龙涎香"] } },
    { id: 5, name: "梅森马吉拉 梧叶秋声", brand: "", notes: { top: ["粉红胡椒", "小豆蔻"], middle: ["肉豆蔻", "胡萝卜籽", "乳香"], base: ["雪松", "苔藓", "冷杉香脂"] } },
    { id: 6, name: "Jébilly 娘惹黄姜", brand: "", notes: { top: ["香柠檬", "茶叶", "薄荷"], middle: ["茉莉", "大米", "生姜"], base: ["香根草"] } },
    { id: 7, name: "FLORAMUSE 摩登薄荷", brand: "", notes: { top: ["绿薄荷", "柠檬", "丁香", "粉红胡椒"], middle: ["茉莉", "生姜", "苹果"], base: ["香草", "桃花心木", "雪松"] } },
    { id: 8, name: "FLORAMUSE 晚风", brand: "", notes: { top: ["菩提花", "香柠檬", "苦橙叶"], middle: ["龙蒿", "椴树花", "茉莉", "玫瑰", "铃兰", "月桂叶"], base: ["洋槐", "干草", "柠檬", "马鞭草"] } },
    { id: 9, name: "FLORAMUSE 雨后", brand: "", notes: { top: ["芫荽", "青草", "树莓"], middle: ["梧桐", "胡椒", "小豆蔻", "老鹳草"], base: ["香根草", "柏树"] } },
    { id: 10, name: "One Day Taipei台北", brand: "", notes: { top: ["豆乳", "米香", "芋头"], middle: ["愈创木", "鸢尾"], base: ["麝香", "香根草", "檀香木"] } },
    { id: 11, name: "五朵里 鸭屎香", brand: "", notes: { top: ["香柠檬", "莎草", "辛香料"], middle: ["乌龙茶", "兰花"], base: ["香根草", "愈创木", "不凋花"] } },
    { id: 12, name: "花宫娜天芥菜生姜heliotrope gingembre", brand: "", notes: { top: ["佛手柑", "橙子"], middle: ["玫瑰", "肉桂", "姜", "苹果"], base: ["天芥菜", "零陵香豆", "焦糖"] } },
    { id: 13, name: "hellenist梦神之臂", brand: "", notes: { top: ["紫罗兰叶", "桃子", "天芥菜"], middle: ["鸢尾草", "紫罗兰", "榛木"], base: ["香草", "零陵香豆", "喀什米尔木"] } },
    { id: 14, name: "费雷罗选集", brand: "", notes: { top: ["薄荷", "天竺葵", "苦橙", "柠檬", "香柠檬"], middle: ["广藿香", "马黛茶", "胡萝卜籽", "肉豆蔻"], base: ["冷杉", "零陵香豆", "愈创木", "安息香"] } },
    { id: 15, name: "曼谷", brand: "Cottee", notes: { top: ["佛手柑", "柠檬", "胡椒"], middle: ["黑醋栗", "白花"], base: ["琥珀", "香根草"] } },
    { id: 16, name: "半生瓜", brand: "MO MAKE", notes: { top: ["苦瓜", "青绿", "佛手柑", "黄瓜"], middle: ["仙客来", "蜜瓜", "铃兰"], base: ["白松香", "麝香", "百合"] } },
    { id: 17, name: "水仙", brand: "窄门", notes: { top: ["冷杉", "松叶", "薄荷", "柑橘"], middle: ["小花茉莉", "五月玫瑰", "水仙"], base: ["乳香", "沉香", "橡木苔", "奇楠"] } },
    { id: 18, name: "倔强草莓", brand: "天乐", notes: { top: ["黑加仑", "小青柑", "粉红胡椒"], middle: ["草莓", "金橘", "广藿香", "依兰", "桂花"], base: ["葡萄柚", "龙涎香", "香草", "麝香"] } },
    { id: 19, name: "不焦绿", brand: "减法", notes: { top: ["摩洛哥艾蒿", "香柠檬", "大黄"], middle: ["甜罗勒", "迷迭香", "苦橙叶", "白茉莉"], base: ["广藿香", "巴拉圭愈创木", "檀香"] } },
    { id: 20, name: "薄荷茶", brand: "", notes: { top: ["胡椒薄荷", "克莱门丁橘", "中式珠茶"], middle: ["鸢尾根", "小花茉莉", "咖啡"], base: ["香根草", "檀香木", "灰琥珀"] } },
    { id: 21, name: "雨崩", brand: "肌肤之味", notes: { top: ["普洱茶", "蕨类植物"], middle: ["墨红玫瑰", "白檀"], base: ["广藿香", "茶香"] } },
    { id: 22, name: "Maison 21G", brand: "", notes: { top: [], middle: ["茉莉", "麝香", "檀香"], base: [] } },
    { id: 23, name: "特洛伊莲花", brand: "Sifr Aromatics", notes: { top: ["黑麝香", "莲花"], middle: ["广藿香", "茶叶", "月桂叶"], base: ["檀香", "雪松"] } },
    { id: 24, name: "Mutsu", brand: "Sifr Aromatics", notes: { top: ["柠檬"], middle: ["青梨", "青苹果"], base: ["花香麝香"] } },
    { id: 25, name: "Matcha 抹茶", brand: "The Perfume Oil Factory", notes: { top: ["抹茶", "杏桃", "罗勒", "香柠檬"], middle: ["百合", "甜瓜", "仙客来"], base: ["绿茶", "麝香", "香根草", "广藿香"] } },
    { id: 26, name: "无名 Unknown", brand: "", notes: { top: [], middle: ["铃兰", "阿萨姆红茶", "黑醋栗"], base: [] } },
    { id: 27, name: "Fennel 茴香", brand: "ann fragrance", notes: { top: ["新鲜茴香"], middle: ["葛缕子", "莳萝籽"], base: ["八角茴香"] } },
    { id: 28, name: "L'Iris 鸢尾", brand: "Santa Maria Novella 圣塔玛利亚诺维拉", notes: { top: ["白松香", "四川花椒", "奈若利橙花"], middle: ["天竺葵", "黄玉兰", "小花茉莉"], base: ["佛罗伦萨鸢尾", "麝香", "龙涎香"] } },
    { id: 29, name: "POLAR STAR 北极星1902", brand: "MUCHA 穆夏", notes: { top: ["佛手柑", "柠檬", "香橙", "薄荷"], middle: ["绿叶", "雪绒花", "马黛茶", "木质香"], base: ["橡木苔", "香草", "麝香"] } },
    { id: 30, name: "Chocolate & Salt 巧克力与盐", brand: "MUCHA 穆夏", notes: { top: ["蜜橘", "海盐", "佛手柑"], middle: ["黑巧克力", "芫荽", "迷迭香"], base: ["劳丹脂", "广藿香", "香草", "安息香"] } },
    { id: 31, name: "Cherry Chocolate 樱桃巧克力1897", brand: "MUCHA 穆夏", notes: { top: ["樱桃", "阿玛雷托", "肉豆蔻"], middle: ["玫瑰", "安息香", "巧克力", "可可"], base: ["广藿香", "麝香", "香草", "琥珀"] } },
    { id: 32, name: "Patchouli Lavender Vanilla 广藿香薰衣草香草", brand: "SABON", notes: { top: ["薰衣草"], middle: ["琥珀", "广藿香", "薰衣草花"], base: ["香草", "岩玫瑰树脂"] } },
    { id: 33, name: "Infusion de Rhubarbe 绯裙黄良", brand: "Prada 普拉达", notes: { top: ["绿柑橘"], middle: ["大黄", "玫瑰"], base: ["白麝香"] } },
    { id: 34, name: "You Or Someone Like You 你或像你的人", brand: "Etat Libre d'Orange 解放橘郡", notes: { top: ["薄荷", "葡萄柚", "香柠檬", "茴香"], middle: ["绿叶", "醋栗叶", "玫瑰", "Hedione"], base: ["白麝香"] } },
    { id: 35, name: "Whiskey Sour at 23:59 23:59的威士忌酸", brand: "SCENT CHANT 宣香", notes: { top: ["橙皮", "茶", "苹果"], middle: ["香草", "兰花", "鼠尾草"], base: ["柚木", "雪松", "香脂冷杉"] } },
    { id: 36, name: "White Tea 白茶", brand: "SABON", notes: { top: ["无花果", "柠檬", "茉莉"], middle: ["白茶", "小豆蔻", "肉豆蔻"], base: ["紫罗兰", "雪松", "百里香"] } },
    { id: 37, name: "Spearmint 绿薄荷", brand: "handhandhand 叁手", notes: { top: ["艾草", "薄荷", "留兰香"], middle: ["薰衣草", "尤加利", "布枯叶", "广藿香"], base: ["雪松", "檀香", "琥珀"] } },
    { id: 38, name: "Bottega Floral 花卉小铺", brand: "MARMAR;D", notes: { top: ["绿叶", "柠檬", "草本"], middle: ["玫瑰", "茉莉", "栀子花"], base: ["木质香", "依兰"] } },
    { id: 39, name: "Thays 泰斯", brand: "Fueguia 1833", notes: { top: [], middle: ["马黛花", "绿茶", "柠檬", "木兰", "安息香", "丁香", "豆蔻", "葡萄柚"], base: [] } },
    { id: 40, name: "玉香 Formosa Beau-Tea", brand: "P.Seven 奉茶系列", notes: { top: ["清新香槟果香"], middle: ["东方美人茶"], base: ["丝绒麝香"] } }
];

class ScentMateApp {
    constructor() {
        this.state = {
            currentLang: localStorage.getItem('scent_lang') || 'zh',
            currentView: 'home',
            myPerfumes: loadLocalSync(DEFAULT_PERFUMES),
            collectionProfile: null,
            cardProfile: null,
            publicUsers: [],
            tempNotes: { top: new Set(), middle: new Set(), base: new Set() },
            currentPickingSection: null,
            editingId: null,
            searchQuery: ''
        };
        this.currentUser = null;

        this.auth = new AuthSystem(this);
        this.viz = new ScentVisualization(this);
    }

    // Called by AuthSystem whenever the auth state resolves/changes.
    async onAuthChanged(user) {
        this.currentUser = user;
        try {
            this.state.myPerfumes = await loadPerfumes(user, DEFAULT_PERFUMES);
        } catch (e) {
            const isEn = this.state.currentLang === 'en';
            this.showToast(isEn ? 'Failed to load your collection' : '加载收藏失败，请稍后重试', 'error');
        }
        if (!user && this.state.currentView === 'profile') this.navigate('home');
        this.renderPerfumeList();
        if (this.state.currentView === 'card') this.viz.renderCard();
        if (this.state.currentView === 'social') this.renderSocial();
        if (this.state.currentView === 'profile') this.auth.renderProfileView(true);
    }

    async persist() {
        try {
            await savePerfumes(this.currentUser, this.state.myPerfumes, this.auth.getSavedVisibilitySettings());
        } catch (e) {
            const isEn = this.state.currentLang === 'en';
            this.showToast(isEn ? 'Failed to save — check your connection' : '保存失败，请检查网络后重试', 'error');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }

    init() {
        this.updateTexts();
        this.renderPerfumeList();
        this.initPicker();
        this.initHomeAnimation();
        this.bindEvents();
        this.auth.init(); // sets up auth listener; onAuthChanged reloads the right data source
    }

    initHomeAnimation() {
        const container = document.getElementById('hero-orbs');
        if (!container || container.childElementCount > 0) return;
        const colors = Object.values(PROFILE_COLORS);
        for (let i = 0; i < 14; i++) {
            const orb = document.createElement('div');
            orb.className = 'hero-orb';
            const size = 60 + Math.random() * 220;
            orb.style.width = `${size}px`;
            orb.style.height = `${size}px`;
            orb.style.background = colors[i % colors.length];
            orb.style.left = `${Math.random() * 100}%`;
            orb.style.top = `${Math.random() * 100}%`;
            orb.style.setProperty('--orb-dur', `${6 + Math.random() * 8}s`);
            orb.style.setProperty('--orb-delay', `${-Math.random() * 8}s`);
            container.appendChild(orb);
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const viewId = e.target.getAttribute('data-view');
                if (viewId) this.navigate(viewId);
            });
        });
        document.querySelector('.logo').addEventListener('click', () => this.navigate('home'));
        document.getElementById('btn-manage-collection').addEventListener('click', () => this.navigate('collection'));
        document.getElementById('btn-home-card').addEventListener('click', () => this.navigate('card'));
        document.getElementById('btn-add-perfume').addEventListener('click', () => this.openAddModal());

        document.getElementById('collection-search').addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.trim().toLowerCase();
            this.renderPerfumeList();
        });
        
        // Modal closes
        document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal-overlay').classList.remove('active');
            });
        });

        document.getElementById('btn-save-perfume').addEventListener('click', () => this.savePerfume());
        document.getElementById('btn-picker-done').addEventListener('click', () => {
            document.getElementById('picker-modal').classList.remove('active');
            this.renderSelectedNotes();
        });

        // Add Perfume Smart Input Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('tab-' + e.target.getAttribute('data-tab')).classList.add('active');
            });
        });

        // Smart Inputs
        document.getElementById('btn-voice-record').addEventListener('click', () => this.startVoiceRecognition());
        document.getElementById('image-input').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('btn-smart-parse').addEventListener('click', () => this.parseSmartInput());
    }

    getTranslation() {
        return TRANSLATIONS[this.state.currentLang];
    }

    toggleLanguage() {
        this.state.currentLang = this.state.currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('scent_lang', this.state.currentLang);
        this.updateTexts();
        this.auth.updateUserNav();
        this.renderPerfumeList();
        if (this.state.currentView === 'card') this.viz.renderCard();
        if (this.state.currentView === 'social') this.renderSocial();
        if (this.state.currentView === 'profile') this.auth.renderProfileView(true);
        this.initPicker();
    }

    updateTexts() {
        const t = this.getTranslation();
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const keys = el.getAttribute('data-i18n').split('.');
            let value = t;
            keys.forEach(k => { value = value ? value[k] : null; });
            if (value) el.innerHTML = value;
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const keys = el.getAttribute('data-i18n-placeholder').split('.');
            let value = t;
            keys.forEach(k => { value = value ? value[k] : null; });
            if (value) el.setAttribute('placeholder', value);
        });
    }

    navigate(viewId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (navItem) navItem.classList.add('active');

        this.state.currentView = viewId;
        if (viewId === 'collection') this.state.collectionProfile = null;
        if (viewId === 'card') this.state.cardProfile = null;
        if (viewId === 'collection') this.renderPerfumeList();
        if (viewId === 'card') this.viz.renderCard();
        if (viewId === 'social') this.renderSocial();
        if (viewId === 'profile') this.auth.renderProfileView();
    }

    // --- Perfume Management ---
    renderPerfumeList() {
        const container = document.getElementById('perfume-list');
        const t = this.getTranslation();
        const isEn = this.state.currentLang === 'en';
        const q = this.state.searchQuery;
        const activeCollectionProfile = this.getActiveCollectionProfile();
        const isReadonlyCollection = !!activeCollectionProfile;
        const activePerfumes = this.getActiveCollectionPerfumes();
        const titleEl = document.getElementById('collection-title');
        const addBtn = document.getElementById('btn-add-perfume');

        if (titleEl) {
            titleEl.textContent = activeCollectionProfile
                ? (isEn ? `${activeCollectionProfile.name}'s Public Collection` : `${activeCollectionProfile.name} 的公开收藏`)
                : t.collection.title;
        }
        if (addBtn) {
            addBtn.style.display = isReadonlyCollection ? 'none' : '';
        }

        container.innerHTML = '';
        if (!isReadonlyCollection) {
            container.innerHTML = `
            <div class="perfume-card add-perfume-card" id="card-add-perfume">
                <div style="font-size: 40px;">+</div>
                <div>${t.collection.record_new}</div>
            </div>`;

            document.getElementById('card-add-perfume').addEventListener('click', () => this.openAddModal());
        }

        const formatNotes = (notes) => {
            if (!notes || notes.length === 0) return "-";
            if (!isEn) return notes.join(", ");
            return notes.map(n => SCENT_TRANSLATIONS[n] || n).join(", ");
        };

        const matchesQuery = (perfume) => {
            if (!q) return true;
            const haystack = [
                perfume.name,
                perfume.brand || '',
                ...perfume.notes.top, ...perfume.notes.middle, ...perfume.notes.base,
                ...perfume.notes.top.map(n => SCENT_TRANSLATIONS[n] || ''),
                ...perfume.notes.middle.map(n => SCENT_TRANSLATIONS[n] || ''),
                ...perfume.notes.base.map(n => SCENT_TRANSLATIONS[n] || '')
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        };

        const visible = activePerfumes.filter(matchesQuery);

        if (visible.length === 0) {
            const msg = activePerfumes.length === 0
                ? (isReadonlyCollection ? (isEn ? 'This public collection is empty.' : '这个公开收藏夹还是空的。') : t.collection.empty)
                : t.collection.empty_search;
            const empty = document.createElement('div');
            empty.className = 'collection-empty';
            empty.textContent = msg;
            container.appendChild(empty);
        }

        visible.forEach(perfume => {
            const card = document.createElement('div');
            card.className = 'perfume-card';

            const profiles = [...new Set([...perfume.notes.top, ...perfume.notes.middle, ...perfume.notes.base].map(n => this.getProfile(n)))];
            const dots = profiles.map(p => `<span class="note-dot" style="background:${PROFILE_COLORS[p] || PROFILE_COLORS['其他']}" title="${p}"></span>`).join('');
            const brandHtml = perfume.brand ? `<div class="perfume-brand">${perfume.brand}</div>` : '';

            card.innerHTML = `
                ${isReadonlyCollection ? '' : `<div class="card-actions">
                    <span class="edit-btn" data-id="${perfume.id}" title="${isEn ? 'Edit' : '编辑'}">✎</span>
                    <span class="delete-btn" data-id="${perfume.id}" title="${isEn ? 'Delete' : '删除'}">×</span>
                </div>`}
                <div class="perfume-name">${perfume.name}</div>
                ${brandHtml}
                <div class="note-indicators">${dots}</div>
                <div class="perfume-notes">
                    <div class="note-line"><span class="note-label">${t.collection.top}</span> <span>${formatNotes(perfume.notes.top)}</span></div>
                    <div class="note-line"><span class="note-label">${t.collection.middle}</span> <span>${formatNotes(perfume.notes.middle)}</span></div>
                    <div class="note-line"><span class="note-label">${t.collection.base}</span> <span>${formatNotes(perfume.notes.base)}</span></div>
                </div>
            `;
            container.appendChild(card);
        });

        if (!isReadonlyCollection) {
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deletePerfume(parseInt(e.currentTarget.getAttribute('data-id')));
                });
            });
            container.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openAddModal(parseInt(e.currentTarget.getAttribute('data-id')));
                });
            });
        }
    }

    deletePerfume(id) {
        const t = this.getTranslation();
        if (confirm(t.collection.delete_confirm)) {
            this.state.myPerfumes = this.state.myPerfumes.filter(p => p.id !== id);
            this.renderPerfumeList();
            this.showToast(t.toast.deleted, 'info');
            this.persist();
        }
    }

    openAddModal(id = null) {
        const t = this.getTranslation();
        document.getElementById('add-modal').classList.add('active');
        document.getElementById('smart-input-text').value = '';
        this.state.editingId = id;
        this.state.tempNotes = { top: new Set(), middle: new Set(), base: new Set() };

        document.querySelector('.tab-btn[data-tab="manual"]').click();

        const titleEl = document.getElementById('modal-title');
        if (id) {
            const perfume = this.state.myPerfumes.find(p => p.id === id);
            titleEl.textContent = t.modal.edit_perfume;
            document.getElementById('input-perfume-name').value = perfume.name;
            document.getElementById('input-perfume-brand').value = perfume.brand || '';
            perfume.notes.top.forEach(n => this.state.tempNotes.top.add(n));
            perfume.notes.middle.forEach(n => this.state.tempNotes.middle.add(n));
            perfume.notes.base.forEach(n => this.state.tempNotes.base.add(n));
        } else {
            titleEl.textContent = t.modal.add_perfume;
            document.getElementById('input-perfume-name').value = '';
            document.getElementById('input-perfume-brand').value = '';
        }
        this.renderSelectedNotes();
    }

    savePerfume() {
        const t = this.getTranslation();
        const name = document.getElementById('input-perfume-name').value.trim();
        if (!name) return this.showToast(t.toast.need_name, 'error');

        const notes = {
            top: Array.from(this.state.tempNotes.top),
            middle: Array.from(this.state.tempNotes.middle),
            base: Array.from(this.state.tempNotes.base)
        };

        if (notes.top.length === 0 && notes.middle.length === 0 && notes.base.length === 0) {
            return this.showToast(t.toast.need_notes, 'error');
        }

        const brand = document.getElementById('input-perfume-brand').value.trim();

        if (this.state.editingId) {
            const perfume = this.state.myPerfumes.find(p => p.id === this.state.editingId);
            perfume.name = name;
            perfume.brand = brand;
            perfume.notes = notes;
            this.showToast(t.toast.updated, 'success');
        } else {
            this.state.myPerfumes.push({ id: Date.now(), name, brand, notes });
            this.showToast(t.toast.saved, 'success');
        }

        this.state.editingId = null;
        this.renderPerfumeList();
        document.getElementById('add-modal').classList.remove('active');
        this.persist();
    }

    // --- Smart Inputs ---
    startVoiceRecognition() {
        const t = this.getTranslation().toast;
        const voiceStatus = document.getElementById('voice-status');
        const btnRecord = document.getElementById('btn-voice-record');

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = this.state.currentLang === 'en' ? 'en-US' : 'zh-CN';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                voiceStatus.textContent = t.voice_listening;
                btnRecord.style.background = "#fc4c02";
                btnRecord.style.color = "white";
            };

            recognition.onend = () => {
                voiceStatus.textContent = t.voice_idle;
                btnRecord.style.background = "#f5f5f5";
                btnRecord.style.color = "black";
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('smart-input-text').value += transcript + " ";
                this.parseSmartInput();
            };

            recognition.start();
        } else {
            this.showToast(t.voice_unsupported, 'error');
        }
    }

    handleImageUpload(e) {
        if (e.target.files && e.target.files[0]) {
            const t = this.getTranslation().toast;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${ev.target.result}" style="max-width:200px; border-radius:10px; margin-top:10px;">`;
                this.showToast(t.img_analyzing, 'info');
                setTimeout(() => {
                    document.getElementById('smart-input-text').value += "玫瑰, 茉莉, 檀香木, 佛手柑 ";
                    this.parseSmartInput();
                }, 1000);
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    parseSmartInput() {
        const t = this.getTranslation().toast;
        const text = document.getElementById('smart-input-text').value;
        if (!text) return;

        let found = false;
        ALL_INGREDIENTS.forEach(item => {
            if (text.includes(item.name)) {
                this.state.tempNotes.middle.add(item.name); // Default to middle for smart parse
                found = true;
            }
        });

        if (found) {
            this.showToast(t.parsed, 'success');
            this.renderSelectedNotes();
            document.querySelector('.tab-btn[data-tab="manual"]').click();
        } else {
            this.showToast(t.not_found, 'error');
        }
    }

    // --- Picker ---
    initPicker() {
        const filters = document.getElementById('picker-filters');
        filters.innerHTML = '';
        
        const t = this.getTranslation();
        const allTag = document.createElement('div');
        allTag.className = 'filter-tag active';
        allTag.textContent = t.common.all;
        allTag.onclick = (e) => this.filterPicker('all', e.target);
        filters.appendChild(allTag);

        Object.keys(DB.scentProfiles).forEach(profile => {
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            tag.textContent = profile;
            tag.onclick = (e) => this.filterPicker(profile, e.target);
            filters.appendChild(tag);
        });
        
        // Bind selector areas
        ['top', 'middle', 'base'].forEach(section => {
            document.getElementById(`area-${section}`).addEventListener('click', () => {
                this.state.currentPickingSection = section;
                document.getElementById('picker-modal').classList.add('active');
                this.filterPicker('all', document.querySelector('#picker-filters .filter-tag'));
            });
        });
    }

    filterPicker(category, el) {
        document.querySelectorAll('#picker-filters .filter-tag').forEach(t => t.classList.remove('active'));
        el.classList.add('active');

        const grid = document.getElementById('picker-grid');
        grid.innerHTML = '';
        
        const isEn = this.state.currentLang === 'en';
        const currentSet = this.state.tempNotes[this.state.currentPickingSection];

        ALL_INGREDIENTS.forEach(item => {
            if (category === 'all' || item.profile === category) {
                const div = document.createElement('div');
                div.className = `picker-item ${currentSet.has(item.name) ? 'selected' : ''}`;
                div.textContent = isEn ? (SCENT_TRANSLATIONS[item.name] || item.name) : item.name;
                div.onclick = () => {
                    if (currentSet.has(item.name)) {
                        currentSet.delete(item.name);
                        div.classList.remove('selected');
                    } else {
                        currentSet.add(item.name);
                        div.classList.add('selected');
                    }
                };
                grid.appendChild(div);
            }
        });
    }

    renderSelectedNotes() {
        const isEn = this.state.currentLang === 'en';
        ['top', 'middle', 'base'].forEach(section => {
            const container = document.getElementById(`selected-${section}`);
            const placeholder = document.getElementById(`placeholder-${section}`);
            container.innerHTML = '';
            
            const notes = Array.from(this.state.tempNotes[section]);
            
            if (notes.length > 0) {
                placeholder.style.display = 'none';
                notes.forEach(note => {
                    const tag = document.createElement('div');
                    tag.className = 'selected-note-tag';
                    const displayName = isEn ? (SCENT_TRANSLATIONS[note] || note) : note;
                    tag.innerHTML = `${displayName} <span data-note="${note}" data-section="${section}" class="remove-note" style="cursor:pointer;font-weight:bold;">&times;</span>`;
                    container.appendChild(tag);
                });
            } else {
                placeholder.style.display = 'inline';
            }
        });

        document.querySelectorAll('.remove-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.state.tempNotes[e.target.getAttribute('data-section')].delete(e.target.getAttribute('data-note'));
                this.renderSelectedNotes();
            });
        });
    }

    processNetworkData() {
        const perfumes = this.getActiveCardPerfumes();
        const nodeCounts = {};
        const linkCounts = {};
        const scentToProfile = {};

        perfumes.forEach(p => {
            const allNotes = [...p.notes.top, ...p.notes.middle, ...p.notes.base];
            const uniqueNotes = [...new Set(allNotes)];

            uniqueNotes.forEach(note => {
                nodeCounts[note] = (nodeCounts[note] || 0) + 1;
                if (!scentToProfile[note]) {
                    const entry = ALL_INGREDIENTS.find(x => x.name === note);
                    scentToProfile[note] = entry ? entry.profile : "其他";
                }
            });

            for (let i = 0; i < uniqueNotes.length; i++) {
                for (let j = i + 1; j < uniqueNotes.length; j++) {
                    const n1 = uniqueNotes[i];
                    const n2 = uniqueNotes[j];
                    const key = [n1, n2].sort().join("-");
                    linkCounts[key] = (linkCounts[key] || 0) + 1;
                }
            }
        });

        const nodes = Object.entries(nodeCounts).map(([id, count]) => ({ id, count, group: scentToProfile[id] }));
        const links = Object.entries(linkCounts).map(([key, value]) => {
            const [source, target] = key.split("-");
            return { source, target, value };
        });

        return { nodes, links };
    }

    getActiveCollectionProfile() {
        return this.state.collectionProfile;
    }

    getActiveCollectionPerfumes() {
        return this.state.collectionProfile ? (this.state.collectionProfile.publicCollectionPerfumes || []) : this.state.myPerfumes;
    }

    getActiveCardProfile() {
        return this.state.cardProfile;
    }

    getActiveCardPerfumes() {
        return this.state.cardProfile ? (this.state.cardProfile.publicCardPerfumes || []) : this.state.myPerfumes;
    }

    openPublicCollection(user) {
        this.state.collectionProfile = user;
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById('view-collection').classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="collection"]`);
        if (navItem) navItem.classList.add('active');
        this.state.currentView = 'collection';
        this.renderPerfumeList();
    }

    openSocialCard(user) {
        this.state.cardProfile = user;
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById('view-card').classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="card"]`);
        if (navItem) navItem.classList.add('active');
        this.state.currentView = 'card';
        this.viz.renderCard();
    }

    getProfile(note) {
        const entry = ALL_INGREDIENTS.find(x => x.name === note);
        return entry ? entry.profile : "其他";
    }

    async renderSocial() {
        const container = document.getElementById('match-list');
        const t = this.getTranslation().social;
        const isEn = this.state.currentLang === 'en';
        container.innerHTML = `<div class="collection-empty">${isEn ? 'Loading public profiles...' : '正在加载公开资料...'}</div>`;

        try {
            const publicUsers = await loadPublicUsers(this.currentUser);
            this.state.publicUsers = publicUsers;

            if (publicUsers.length === 0) {
                container.innerHTML = `<div class="collection-empty">${t.no_public_users}</div>`;
                return;
            }

            const myNotes = new Set();
            if (this.currentUser) {
                this.state.myPerfumes.forEach(p => {
                    p.notes.top.forEach(n => myNotes.add(n));
                    p.notes.middle.forEach(n => myNotes.add(n));
                    p.notes.base.forEach(n => myNotes.add(n));
                });
            }
            const myNotesArray = Array.from(myNotes);
            const canScoreMatches = this.currentUser && myNotesArray.length > 0;

            if (!this.currentUser || myNotesArray.length === 0) {
                container.innerHTML = `<div class="social-hint">${this.escapeHtml(!this.currentUser ? t.guest_hint : t.no_perfume_tip)}</div>`;
            } else {
                container.innerHTML = '';
            }

            const matches = publicUsers.map(user => {
                const otherNotes = Array.isArray(user.publicNoteSummary) ? user.publicNoteSummary : [];
                const otherSet = new Set(otherNotes);
                const intersection = myNotesArray.filter(x => otherSet.has(x));
                const union = new Set([...myNotesArray, ...otherNotes]);
                const score = canScoreMatches && union.size > 0 ? Math.round((intersection.length / union.size) * 100) : null;
                return { ...user, score, common: intersection, publicScentCount: otherNotes.length };
            }).sort((a, b) => {
                if (canScoreMatches && a.score !== b.score) return (b.score || 0) - (a.score || 0);
                return (b.publicPerfumeCount || 0) - (a.publicPerfumeCount || 0);
            });

            matches.forEach(m => {
                const el = document.createElement('div');
                el.className = 'match-card';
                const commonStr = m.common.map(n => isEn ? (SCENT_TRANSLATIONS[n] || n) : n).join(", ");
                const avatar = this.auth.renderAvatarMarkup(m.photoURL, m.name, 'match-avatar-img', 'match-avatar');
                const badges = [
                    m.publicCollectionEnabled ? `<span class="social-badge">${this.escapeHtml(t.public_collection)}</span>` : '',
                    m.publicCardEnabled ? `<span class="social-badge">${this.escapeHtml(t.public_card)}</span>` : ''
                ].join('');
                const actions = [
                    m.publicCollectionEnabled ? `<button class="btn-outline social-action-btn" data-action="collection" data-user="${m.uid}">${this.escapeHtml(t.view_collection)}</button>` : '',
                    m.publicCardEnabled ? `<button class="btn-outline social-action-btn" data-action="card" data-user="${m.uid}">${this.escapeHtml(t.view_card)}</button>` : ''
                ].join('');

                el.innerHTML = `
                    ${avatar}
                    <div class="match-info">
                        <div class="social-badge-row">${badges}</div>
                        <h3 class="match-name">${this.escapeHtml(m.name)}</h3>
                        <div class="social-public-stats">${t.public_perfumes}: ${m.publicPerfumeCount} · ${t.public_scents}: ${m.publicScentCount}</div>
                        ${canScoreMatches ? `<div class="social-common-line">${t.common_likes}: ${this.escapeHtml(commonStr || t.no_overlap)}</div>` : ''}
                    </div>
                    ${canScoreMatches ? `<div class="match-score"><span class="score-val">${m.score}%</span><span class="score-label">${t.match_score}</span></div>` : ''}
                    <div class="social-actions">${actions}</div>
                `;
                container.appendChild(el);
            });

            container.querySelectorAll('.social-action-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const user = matches.find(item => item.uid === btn.getAttribute('data-user'));
                    if (!user) return;
                    if (btn.getAttribute('data-action') === 'collection') this.openPublicCollection(user);
                    if (btn.getAttribute('data-action') === 'card') this.openSocialCard(user);
                });
            });
        } catch (error) {
            container.innerHTML = `<div class="collection-empty">${this.escapeHtml(this.getTranslation().toast.social_load_failed)}</div>`;
        }
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new ScentMateApp();
    window.app.init();
});
