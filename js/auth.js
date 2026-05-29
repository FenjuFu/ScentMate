import { auth, isFirebaseConfigured } from './firebase-config.js';
import { DEFAULT_VISIBILITY_SETTINGS, loadUserVisibilitySettings, saveUserVisibilitySettings } from './store.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    reload,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const PROFILE_PRESET_DEFS = [
    { id: 'citrus', zh: '柑橘晴日', en: 'Citrus Daydream', mark: 'CD', colors: ['#ffd07a', '#fc4c02'], accent: '#fff6da' },
    { id: 'tea', zh: '白茶漫游', en: 'Tea Drifter', mark: 'TD', colors: ['#c7d9a6', '#6f8b52'], accent: '#edf5dd' },
    { id: 'iris', zh: '鸢尾月光', en: 'Iris Moon', mark: 'IM', colors: ['#c8b8ff', '#7b61ff'], accent: '#efeaff' },
    { id: 'moss', zh: '青苔来信', en: 'Moss Letter', mark: 'ML', colors: ['#88c27a', '#2f6f4f'], accent: '#ddf3e0' },
    { id: 'amber', zh: '琥珀旅人', en: 'Amber Rover', mark: 'AR', colors: ['#ffbb66', '#b85b12'], accent: '#ffe6c5' },
    { id: 'cedar', zh: '雪松黄昏', en: 'Cedar Dusk', mark: 'CD', colors: ['#b9967a', '#6e4f3f'], accent: '#efe1d7' },
    { id: 'rose', zh: '玫瑰低语', en: 'Rose Whisper', mark: 'RW', colors: ['#ffb0c8', '#db5e93'], accent: '#ffe5ef' },
    { id: 'sea', zh: '海盐微光', en: 'Sea Gleam', mark: 'SG', colors: ['#8bd4ff', '#2b72c9'], accent: '#dff4ff' }
];

export class AuthSystem {
    constructor(app) {
        this.app = app;
        this.user = null;
        this.currentTab = 'login'; // 'login' or 'register'
        this.savedVisibilitySettings = { ...DEFAULT_VISIBILITY_SETTINGS };
        this.profileDraft = { uid: null, nickname: '', presetId: null, customPhotoURL: null, publicCollection: false, publicCard: false };
        this.profilePresets = PROFILE_PRESET_DEFS.map(preset => ({
            ...preset,
            photoURL: this.createAvatarDataUrl(preset)
        }));
    }

    init() {
        this.bindEvents();
        this.renderAuthModal();
        this.updateUserNav();

        if (isFirebaseConfigured) {
            onAuthStateChanged(auth, async (user) => {
                let activeUser = user;
                let seeded = false;
                if (user) {
                    seeded = await this.ensureUserProfile(user);
                    activeUser = auth.currentUser || user;
                    this.savedVisibilitySettings = await loadUserVisibilitySettings(activeUser);
                    this.syncProfileDraft(activeUser, true, this.savedVisibilitySettings);
                } else {
                    this.savedVisibilitySettings = { ...DEFAULT_VISIBILITY_SETTINGS };
                    this.profileDraft = { uid: null, nickname: '', presetId: null, customPhotoURL: null, publicCollection: false, publicCard: false };
                }

                this.user = activeUser;
                this.updateUserNav();
                this.app.onAuthChanged(activeUser);

                if (seeded && activeUser) {
                    this.openProfile(true);
                    this.app.showToast(this.app.getTranslation().toast.profile_seeded, 'info');
                }
            });
        } else {
            // Guest-only mode: load local data so the app still works.
            this.app.onAuthChanged(null);
        }
    }

    bindEvents() {
        document.getElementById('btn-login-tab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('btn-register-tab').addEventListener('click', () => this.switchTab('register'));
        document.getElementById('btn-auth-submit').addEventListener('click', () => this.handleSubmit());
        document.getElementById('btn-google-signin').addEventListener('click', () => this.handleGoogle());
        document.getElementById('btn-forgot-password').addEventListener('click', () => this.handleForgotPassword());
    }

    openModal() {
        if (!isFirebaseConfigured) {
            const isEn = this.app.state.currentLang === 'en';
            this.app.showToast(isEn
                ? 'Auth not configured — fill in js/firebase-config.js'
                : '尚未配置认证，请先在 js/firebase-config.js 填入 Firebase 配置', 'error');
            return;
        }
        document.getElementById('login-modal').classList.add('active');
        this.switchTab('login');
    }

    openProfile(forceSync = false) {
        if (!this.user) return;
        this.syncProfileDraft(this.user, forceSync);
        this.app.navigate('profile');
    }

    closeModal() {
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('auth-password').value = '';
        document.getElementById('auth-confirm-password').value = '';
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.getElementById('btn-login-tab').classList.toggle('active', tab === 'login');
        document.getElementById('btn-register-tab').classList.toggle('active', tab === 'register');

        const isRegister = tab === 'register';
        document.getElementById('auth-username-group').style.display = isRegister ? 'block' : 'none';
        document.getElementById('auth-confirm-password-group').style.display = isRegister ? 'block' : 'none';
        document.getElementById('auth-forgot').style.display = isRegister ? 'none' : 'block';

        const t = this.app.getTranslation().auth;
        document.getElementById('btn-auth-submit').innerText = isRegister ? t.register_btn : t.login_btn;
    }

    displayName(user) {
        if (!user) return '';
        return user.displayName || (user.email ? user.email.split('@')[0] : 'User');
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

    getInitial(name) {
        const chars = Array.from((name || 'U').trim());
        if (chars.length === 0) return 'U';
        return /[\u4e00-\u9fff]/.test(chars[0]) ? chars[0] : chars.slice(0, 2).join('').toUpperCase();
    }

    hashSeed(value) {
        return Array.from(String(value || 'scentmate')).reduce((acc, char) => {
            return (acc * 31 + char.charCodeAt(0)) >>> 0;
        }, 7);
    }

    createAvatarDataUrl(preset) {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
                <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${preset.colors[0]}"/>
                        <stop offset="100%" stop-color="${preset.colors[1]}"/>
                    </linearGradient>
                </defs>
                <rect width="96" height="96" rx="28" fill="url(#g)"/>
                <circle cx="72" cy="24" r="14" fill="${preset.accent}" opacity="0.82"/>
                <circle cx="26" cy="68" r="18" fill="#ffffff" opacity="0.16"/>
                <text x="48" y="57" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="1">${preset.mark}</text>
            </svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    getProfilePresets() {
        return this.profilePresets;
    }

    getPresetName(preset) {
        return this.app.state.currentLang === 'en' ? preset.en : preset.zh;
    }

    getPresetById(id) {
        return this.getProfilePresets().find(preset => preset.id === id) || null;
    }

    getPresetByPhotoURL(photoURL) {
        return this.getProfilePresets().find(preset => preset.photoURL === photoURL) || null;
    }

    pickDefaultPreset(user) {
        const presets = this.getProfilePresets();
        return presets[this.hashSeed(user?.uid || user?.email) % presets.length];
    }

    getSavedVisibilitySettings() {
        return { ...this.savedVisibilitySettings };
    }

    syncProfileDraft(user = this.user, force = false, visibilitySettings = this.savedVisibilitySettings) {
        if (!user) return;
        if (force || this.profileDraft.uid !== user.uid) {
            const preset = this.getPresetByPhotoURL(user.photoURL) || this.pickDefaultPreset(user);
            this.profileDraft = {
                uid: user.uid,
                nickname: this.displayName(user),
                presetId: this.getPresetByPhotoURL(user.photoURL) ? preset.id : null,
                customPhotoURL: this.getPresetByPhotoURL(user.photoURL) ? null : (user.photoURL || null),
                publicCollection: !!visibilitySettings.publicCollection,
                publicCard: !!visibilitySettings.publicCard
            };
        }
    }

    async ensureUserProfile(user) {
        const preset = this.pickDefaultPreset(user);
        const nextProfile = {
            displayName: user.displayName || this.getPresetName(preset),
            photoURL: user.photoURL || preset.photoURL
        };

        if (nextProfile.displayName !== user.displayName || nextProfile.photoURL !== user.photoURL) {
            await updateProfile(user, nextProfile);
            return true;
        }

        return false;
    }

    renderAvatarMarkup(photoURL, name, className, fallbackClass) {
        const safeName = this.escapeHtml(name);
        if (photoURL) {
            return `<img class="${className}" src="${photoURL}" alt="${safeName}" referrerpolicy="no-referrer">`;
        }
        return `<div class="${fallbackClass}">${this.escapeHtml(this.getInitial(name))}</div>`;
    }

    getDraftPhotoURL() {
        return this.profileDraft.customPhotoURL || this.getPresetById(this.profileDraft.presetId)?.photoURL || this.pickDefaultPreset(this.user)?.photoURL || null;
    }

    async fileToSquareDataUrl(file) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('invalid-image');
        }

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('read-failed'));
            reader.readAsDataURL(file);
        });

        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('image-load-failed'));
            img.src = dataUrl;
        });

        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(image.width, image.height);
        const sx = (image.width - side) / 2;
        const sy = (image.height - side) / 2;
        ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
        return canvas.toDataURL('image/jpeg', 0.86);
    }

    async handleCustomAvatarChange(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const isValid = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        if (!isValid) {
            this.app.showToast(this.app.getTranslation().toast.avatar_invalid, 'error');
            event.target.value = '';
            return;
        }

        try {
            const customPhotoURL = await this.fileToSquareDataUrl(file);
            this.profileDraft = {
                ...this.profileDraft,
                presetId: null,
                customPhotoURL
            };
            this.renderProfileView();
            this.app.showToast(this.app.getTranslation().toast.avatar_uploaded, 'success');
        } catch (error) {
            this.app.showToast(this.app.getTranslation().toast.avatar_invalid, 'error');
        } finally {
            event.target.value = '';
        }
    }

    async handleSubmit() {
        const isEn = this.app.state.currentLang === 'en';
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;

        if (!email || !password) {
            this.app.showToast(isEn ? 'Please fill in all required fields.' : '请填写所有必填项', 'error');
            return;
        }

        const submitBtn = document.getElementById('btn-auth-submit');
        submitBtn.disabled = true;
        try {
            if (this.currentTab === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                this.app.showToast((isEn ? 'Welcome back, ' : '欢迎回来，') + this.displayName(auth.currentUser), 'success');
            } else {
                const username = document.getElementById('auth-username').value.trim();
                const confirmPwd = document.getElementById('auth-confirm-password').value;
                if (password !== confirmPwd) {
                    this.app.showToast(isEn ? 'Passwords do not match!' : '两次输入的密码不一致', 'error');
                    return;
                }
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (username) await updateProfile(cred.user, { displayName: username });
                this.updateUserNav();
                try { await sendEmailVerification(cred.user); } catch (e) { /* non-blocking */ }
                this.app.showToast(isEn ? 'Account created — verification email sent' : '注册成功，验证邮件已发送', 'success');
            }
            this.closeModal();
        } catch (error) {
            this.app.showToast(this.mapError(error), 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    async handleGoogle() {
        const isEn = this.app.state.currentLang === 'en';
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            this.app.showToast((isEn ? 'Welcome, ' : '欢迎，') + this.displayName(auth.currentUser), 'success');
            this.closeModal();
        } catch (error) {
            this.app.showToast(this.mapError(error), 'error');
        }
    }

    async handleForgotPassword() {
        const isEn = this.app.state.currentLang === 'en';
        const email = document.getElementById('auth-email').value.trim();
        if (!email) {
            this.app.showToast(isEn ? 'Enter your email first, then tap reset' : '请先填写邮箱再点击找回', 'info');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            this.app.showToast(isEn ? 'Password reset email sent' : '重置密码邮件已发送，请查收', 'success');
        } catch (error) {
            this.app.showToast(this.mapError(error), 'error');
        }
    }

    async logout() {
        const isEn = this.app.state.currentLang === 'en';
        const t = this.app.getTranslation().auth;
        if (confirm(t.logout_confirm)) {
            await signOut(auth);
            this.app.navigate('home');
            this.app.showToast(isEn ? 'Signed out' : '已退出登录', 'info');
        }
    }

    selectProfilePreset(presetId) {
        const preset = this.getPresetById(presetId);
        if (!preset) return;
        this.profileDraft = {
            ...this.profileDraft,
            presetId: preset.id,
            customPhotoURL: null,
            nickname: this.getPresetName(preset)
        };
        this.renderProfileView();
    }

    randomizeProfileDraft() {
        const presets = this.getProfilePresets();
        const choices = presets.filter(preset => preset.id !== this.profileDraft.presetId);
        const preset = choices[Math.floor(Math.random() * choices.length)] || presets[0];
        this.profileDraft = {
            ...this.profileDraft,
            presetId: preset.id,
            customPhotoURL: null,
            nickname: this.getPresetName(preset)
        };
        this.renderProfileView();
    }

    async refreshVerificationStatus() {
        const activeUser = auth.currentUser || this.user;
        if (!activeUser) return;

        await reload(activeUser);
        this.user = auth.currentUser || activeUser;
        this.app.currentUser = this.user;
        this.renderProfileView(true);
        this.updateUserNav();
        this.app.showToast(this.app.getTranslation().toast.verification_checked, 'info');
    }

    async sendVerificationEmailAgain() {
        const activeUser = auth.currentUser || this.user;
        if (!activeUser) return;

        await sendEmailVerification(activeUser);
        this.app.showToast(this.app.getTranslation().toast.verification_sent, 'success');
    }

    async changePassword() {
        const activeUser = auth.currentUser || this.user;
        if (!activeUser) return;

        const t = this.app.getTranslation();
        const nextPassword = document.getElementById('input-profile-password').value;
        const confirmPassword = document.getElementById('input-profile-password-confirm').value;
        if (!nextPassword || !confirmPassword) {
            this.app.showToast(t.toast.password_need_input, 'error');
            return;
        }
        if (nextPassword !== confirmPassword) {
            this.app.showToast(t.toast.password_mismatch, 'error');
            return;
        }

        const button = document.getElementById('btn-profile-password-save');
        if (button) button.disabled = true;
        try {
            await updatePassword(activeUser, nextPassword);
            document.getElementById('input-profile-password').value = '';
            document.getElementById('input-profile-password-confirm').value = '';
            this.app.showToast(t.toast.password_updated, 'success');
        } catch (error) {
            this.app.showToast(this.mapError(error), 'error');
        } finally {
            if (button) button.disabled = false;
        }
    }

    async saveProfile() {
        if (!this.user) return;

        const t = this.app.getTranslation();
        const nickname = (this.profileDraft.nickname || '').trim();
        if (!nickname) {
            this.app.showToast(t.profile.need_nickname, 'error');
            return;
        }

        const photoURL = this.getDraftPhotoURL();
        const activeUser = auth.currentUser || this.user;
        const visibilitySettings = {
            publicCollection: !!this.profileDraft.publicCollection,
            publicCard: !!this.profileDraft.publicCard
        };
        const saveButton = document.getElementById('btn-profile-save');
        if (saveButton) saveButton.disabled = true;

        try {
            await updateProfile(activeUser, {
                displayName: nickname,
                photoURL
            });
            this.savedVisibilitySettings = await saveUserVisibilitySettings(activeUser, visibilitySettings, this.app.getOwnedCollections());
            this.user = auth.currentUser || activeUser;
            this.app.currentUser = this.user;
            this.syncProfileDraft(this.user, true, this.savedVisibilitySettings);
            this.updateUserNav();
            this.renderProfileView(true);
            if (this.app.state.currentView === 'card') this.app.viz.renderCard();
            if (this.app.state.currentView === 'social') this.app.renderSocial();
            this.app.showToast(t.toast.profile_saved, 'success');
        } catch (error) {
            this.app.showToast(this.mapError(error) || t.profile.save_error, 'error');
        } finally {
            if (saveButton) saveButton.disabled = false;
        }
    }

    renderProfileView(forceSync = false) {
        const section = document.getElementById('view-profile');
        if (!section) return;

        if (!this.user) {
            section.innerHTML = '';
            return;
        }

        this.syncProfileDraft(this.user, forceSync);

        const t = this.app.getTranslation().profile;
        const activePreset = this.getPresetById(this.profileDraft.presetId);
        const nickname = this.profileDraft.nickname || this.displayName(this.user);
        const activePhotoURL = this.getDraftPhotoURL();
        const isCustomAvatar = !!this.profileDraft.customPhotoURL;
        const visibilityCollectionText = this.profileDraft.publicCollection ? t.visibility_public : t.visibility_private;
        const visibilityCardText = this.profileDraft.publicCard ? t.visibility_public : t.visibility_private;
        const allPerfumes = this.app.getAllOwnedPerfumes();
        const uniqueNotes = new Set();
        allPerfumes.forEach(perfume => {
            perfume.notes.top.forEach(note => uniqueNotes.add(note));
            perfume.notes.middle.forEach(note => uniqueNotes.add(note));
            perfume.notes.base.forEach(note => uniqueNotes.add(note));
        });

        const presetCards = this.getProfilePresets().map((preset) => `
            <button class="avatar-preset-card${activePreset && preset.id === activePreset.id ? ' active' : ''}" type="button" data-preset-id="${preset.id}">
                ${this.renderAvatarMarkup(preset.photoURL, this.getPresetName(preset), 'avatar-preset-img', 'avatar-preset-fallback')}
                <div class="avatar-preset-name">${this.escapeHtml(this.getPresetName(preset))}</div>
            </button>
        `).join('');

        section.innerHTML = `
            <div class="profile-shell">
                <div class="profile-hero-card">
                    <div class="profile-hero-copy">
                        <div class="profile-kicker">Account</div>
                        <h2 class="profile-title">${this.escapeHtml(t.title)}</h2>
                        <p class="profile-subtitle">${this.escapeHtml(t.subtitle)}</p>
                        <div class="profile-stat-row">
                            <div class="profile-stat-card">
                                <div class="profile-stat-value">${allPerfumes.length}</div>
                                <div class="profile-stat-label">${this.escapeHtml(t.perfume_count)}</div>
                            </div>
                            <div class="profile-stat-card">
                                <div class="profile-stat-value">${uniqueNotes.size}</div>
                                <div class="profile-stat-label">${this.escapeHtml(t.scent_count)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-preview-card">
                        ${this.renderAvatarMarkup(activePhotoURL, nickname, 'profile-avatar-img', 'profile-avatar-fallback')}
                        <div class="profile-preview-name" id="profile-preview-name">${this.escapeHtml(nickname)}</div>
                        <div class="profile-preview-email">${this.escapeHtml(this.user.email || '')}</div>
                    </div>
                </div>

                <div class="profile-form-card">
                    <div class="profile-visibility-banner">
                        <div class="profile-visibility-banner-title">${this.escapeHtml(this.app.state.currentLang === 'en' ? 'New collection default visibility' : '新建收藏夹默认公开设置')}</div>
                        <div class="profile-visibility-banner-badges">
                            <span class="profile-status-pill${this.profileDraft.publicCollection ? ' active' : ''}">${this.escapeHtml(t.public_collection_label)}: ${this.escapeHtml(visibilityCollectionText)}</span>
                            <span class="profile-status-pill${this.profileDraft.publicCard ? ' active' : ''}">${this.escapeHtml(t.public_card_label)}: ${this.escapeHtml(visibilityCardText)}</span>
                        </div>
                    </div>
                    <div class="profile-field">
                        <label class="form-label" for="input-profile-name">${this.escapeHtml(t.nickname_label)}</label>
                        <input
                            type="text"
                            class="form-input"
                            id="input-profile-name"
                            value="${this.escapeHtml(nickname)}"
                            placeholder="${this.escapeHtml(t.nickname_placeholder)}"
                        >
                    </div>
                    <div class="profile-field">
                        <label class="form-label" for="profile-email-static">${this.escapeHtml(t.email_label)}</label>
                        <div class="profile-email-static" id="profile-email-static">${this.escapeHtml(this.user.email || '-')}</div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-section-head">
                            <div>
                                <div class="profile-section-title">${this.escapeHtml(t.preset_title)}</div>
                                <div class="profile-section-hint">${this.escapeHtml(t.preset_hint)}</div>
                            </div>
                            <button class="btn-secondary" id="btn-profile-random" type="button">${this.escapeHtml(t.random_btn)}</button>
                        </div>
                        <div class="avatar-preset-grid">${presetCards}</div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-section-head">
                            <div>
                                <div class="profile-section-title">${this.escapeHtml(t.upload_title)}</div>
                                <div class="profile-section-hint">${this.escapeHtml(t.upload_hint)}</div>
                            </div>
                        </div>
                        <div class="profile-upload-card${isCustomAvatar ? ' active' : ''}">
                            <div class="profile-upload-preview">
                                ${this.renderAvatarMarkup(activePhotoURL, nickname, 'profile-upload-avatar', 'profile-upload-fallback')}
                            </div>
                            <div class="profile-upload-info">
                                <div class="profile-upload-status">${this.escapeHtml(isCustomAvatar ? t.custom_avatar_active : t.upload_hint)}</div>
                                <label class="btn-secondary profile-upload-btn" for="input-profile-avatar-file">${this.escapeHtml(isCustomAvatar ? t.upload_replace_btn : t.upload_btn)}</label>
                                <input type="file" id="input-profile-avatar-file" accept="image/png,image/jpeg,image/webp" hidden>
                            </div>
                        </div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-section-head">
                            <div>
                                <div class="profile-section-title">${this.escapeHtml(t.visibility_title)}</div>
                                <div class="profile-section-hint">${this.escapeHtml(t.visibility_hint)}</div>
                            </div>
                        </div>
                        <div class="profile-visibility-grid">
                            <label class="profile-toggle-card">
                                <div class="profile-toggle-copy">
                                    <div class="profile-toggle-title">${this.escapeHtml(t.public_collection_label)}</div>
                                    <div class="profile-toggle-hint">${this.escapeHtml(t.public_collection_hint)}</div>
                                </div>
                                <input type="checkbox" class="profile-toggle-input" id="input-public-collection"${this.profileDraft.publicCollection ? ' checked' : ''}>
                                <span class="profile-toggle-slider"></span>
                            </label>
                            <label class="profile-toggle-card">
                                <div class="profile-toggle-copy">
                                    <div class="profile-toggle-title">${this.escapeHtml(t.public_card_label)}</div>
                                    <div class="profile-toggle-hint">${this.escapeHtml(t.public_card_hint)}</div>
                                </div>
                                <input type="checkbox" class="profile-toggle-input" id="input-public-card"${this.profileDraft.publicCard ? ' checked' : ''}>
                                <span class="profile-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-section-head">
                            <div>
                                <div class="profile-section-title">${this.escapeHtml(t.security_title)}</div>
                                <div class="profile-section-hint">${this.escapeHtml(t.verify_hint)}</div>
                            </div>
                        </div>
                        <div class="profile-security-grid">
                            <div class="profile-security-card">
                                <div class="profile-security-label">${this.escapeHtml(t.verify_status_label)}</div>
                                <div class="profile-verify-status${this.user.emailVerified ? ' verified' : ''}">${this.escapeHtml(this.user.emailVerified ? t.verify_done : t.verify_pending)}</div>
                                <div class="profile-inline-actions">
                                    ${this.user.emailVerified ? '' : `<button class="btn-secondary" id="btn-profile-send-verify" type="button">${this.escapeHtml(t.verify_send_btn)}</button>`}
                                    <button class="btn-secondary" id="btn-profile-refresh-verify" type="button">${this.escapeHtml(t.verify_refresh_btn)}</button>
                                </div>
                            </div>
                            <div class="profile-security-card">
                                <div class="profile-security-label">${this.escapeHtml(t.password_title)}</div>
                                <div class="profile-password-grid">
                                    <input type="password" class="form-input" id="input-profile-password" placeholder="${this.escapeHtml(t.password_placeholder)}">
                                    <input type="password" class="form-input" id="input-profile-password-confirm" placeholder="${this.escapeHtml(t.password_placeholder)}">
                                </div>
                                <div class="profile-password-labels">
                                    <span>${this.escapeHtml(t.password_new_label)}</span>
                                    <span>${this.escapeHtml(t.password_confirm_label)}</span>
                                </div>
                                <div class="profile-inline-actions">
                                    <button class="btn-secondary" id="btn-profile-password-save" type="button">${this.escapeHtml(t.password_save_btn)}</button>
                                </div>
                                <div class="profile-password-tip">${this.escapeHtml(t.password_tip)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-action-row">
                        <button class="btn-secondary" id="btn-profile-logout" type="button">${this.escapeHtml(this.app.getTranslation().auth.logout_btn)}</button>
                        <button class="btn-primary" id="btn-profile-save" type="button">${this.escapeHtml(t.save_btn)}</button>
                    </div>
                </div>
            </div>
        `;

        const nicknameInput = document.getElementById('input-profile-name');
        nicknameInput.addEventListener('input', (event) => {
            this.profileDraft = { ...this.profileDraft, nickname: event.target.value };
            document.getElementById('profile-preview-name').textContent = event.target.value.trim() || this.displayName(this.user);
        });
        document.querySelectorAll('.avatar-preset-card').forEach((button) => {
            button.addEventListener('click', () => this.selectProfilePreset(button.getAttribute('data-preset-id')));
        });
        document.getElementById('input-profile-avatar-file').addEventListener('change', (event) => this.handleCustomAvatarChange(event));
        document.getElementById('btn-profile-random').addEventListener('click', () => this.randomizeProfileDraft());
        document.getElementById('input-public-collection').addEventListener('change', (event) => {
            this.profileDraft = { ...this.profileDraft, publicCollection: event.target.checked };
        });
        document.getElementById('input-public-card').addEventListener('change', (event) => {
            this.profileDraft = { ...this.profileDraft, publicCard: event.target.checked };
        });
        if (document.getElementById('btn-profile-send-verify')) {
            document.getElementById('btn-profile-send-verify').addEventListener('click', async () => {
                try {
                    await this.sendVerificationEmailAgain();
                } catch (error) {
                    this.app.showToast(this.mapError(error), 'error');
                }
            });
        }
        document.getElementById('btn-profile-refresh-verify').addEventListener('click', async () => {
            try {
                await this.refreshVerificationStatus();
            } catch (error) {
                this.app.showToast(this.mapError(error), 'error');
            }
        });
        document.getElementById('btn-profile-password-save').addEventListener('click', () => this.changePassword());
        document.getElementById('btn-profile-save').addEventListener('click', () => this.saveProfile());
        document.getElementById('btn-profile-logout').addEventListener('click', () => this.logout());
    }

    mapError(error) {
        const isEn = this.app.state.currentLang === 'en';
        const code = error && error.code ? error.code : '';
        const zh = {
            'auth/invalid-email': '邮箱格式不正确',
            'auth/user-not-found': '该邮箱尚未注册',
            'auth/wrong-password': '密码错误',
            'auth/invalid-credential': '邮箱或密码错误',
            'auth/email-already-in-use': '该邮箱已被注册',
            'auth/weak-password': '密码强度不够（至少 6 位）',
            'auth/too-many-requests': '尝试过于频繁，请稍后再试',
            'auth/popup-closed-by-user': '登录窗口已关闭',
            'auth/popup-blocked': '弹窗被浏览器拦截，请允许弹窗后重试',
            'auth/network-request-failed': '网络错误，请检查连接',
            'auth/operation-not-allowed': '该登录方式未在 Firebase 控制台启用',
            'auth/unauthorized-domain': '当前域名未加入 Firebase 授权域名列表',
            'auth/requires-recent-login': '出于安全考虑，请重新登录后再执行此操作',
            'permission-denied': 'Firestore 权限不足：大概率是公开资料规则还没部署',
            'unavailable': 'Firestore 服务暂时不可用，请稍后重试'
        };
        const en = {
            'auth/invalid-email': 'Invalid email format',
            'auth/user-not-found': 'Email not registered',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-credential': 'Incorrect email or password',
            'auth/email-already-in-use': 'Email already in use',
            'auth/weak-password': 'Password too weak (min 6 chars)',
            'auth/too-many-requests': 'Too many attempts, try again later',
            'auth/popup-closed-by-user': 'Sign-in popup closed',
            'auth/popup-blocked': 'Popup blocked — please allow popups',
            'auth/network-request-failed': 'Network error, check your connection',
            'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase',
            'auth/unauthorized-domain': 'This domain is not in the Firebase authorized list',
            'auth/requires-recent-login': 'For security, please sign in again before doing this',
            'permission-denied': 'Firestore permission denied: public profile rules are likely not deployed yet',
            'unavailable': 'Firestore is temporarily unavailable, please try again'
        };
        const map = isEn ? en : zh;
        return map[code] || (isEn ? `Auth error: ${code || error.message}` : `认证失败：${code || error.message}`);
    }

    updateUserNav() {
        const container = document.getElementById('user-nav');
        const t = this.app.getTranslation();
        const langBtnText = this.app.state.currentLang === 'zh' ? 'EN' : '中文';

        let html = `<div class="lang-btn" id="lang-toggle">${langBtnText}</div>`;

        if (this.user) {
            const name = this.displayName(this.user);
            const avatar = this.renderAvatarMarkup(this.user.photoURL, name, 'user-avatar-img', 'user-avatar');
            html += `<button class="user-box" id="btn-open-profile" type="button" title="${this.escapeHtml(t.profile.entry_title)}">${avatar}</button>`;
        } else {
            html += `<div class="login-btn" id="btn-open-login">${t.nav.login}</div>`;
        }
        container.innerHTML = html;

        document.getElementById('lang-toggle').addEventListener('click', () => this.app.toggleLanguage());
        if (this.user) {
            document.getElementById('btn-open-profile').addEventListener('click', () => this.openProfile(true));
        } else {
            document.getElementById('btn-open-login').addEventListener('click', () => this.openModal());
        }
    }

    renderAuthModal() {
        const t = this.app.getTranslation().auth;
        document.getElementById('btn-login-tab').innerText = t.login_tab;
        document.getElementById('btn-register-tab').innerText = t.register_tab;

        document.querySelector('label[for="auth-email"]').innerText = t.email;
        document.querySelector('label[for="auth-password"]').innerText = t.password;
        document.querySelector('label[for="auth-confirm-password"]').innerText = t.confirm_password;
        document.querySelector('label[for="auth-username"]').innerText = t.username;

        const isRegister = this.currentTab === 'register';
        document.getElementById('btn-auth-submit').innerText = isRegister ? t.register_btn : t.login_btn;
    }
}
