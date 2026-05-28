import { auth, isFirebaseConfigured } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export class AuthSystem {
    constructor(app) {
        this.app = app;
        this.user = null;
        this.currentTab = 'login'; // 'login' or 'register'
    }

    init() {
        this.bindEvents();
        this.renderAuthModal();
        this.updateUserNav();

        if (isFirebaseConfigured) {
            onAuthStateChanged(auth, (user) => {
                this.user = user;
                this.updateUserNav();
                this.app.onAuthChanged(user);
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
            'auth/unauthorized-domain': '当前域名未加入 Firebase 授权域名列表'
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
            'auth/unauthorized-domain': 'This domain is not in the Firebase authorized list'
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
            const avatar = this.user.photoURL
                ? `<img class="user-avatar-img" src="${this.user.photoURL}" alt="${name}" referrerpolicy="no-referrer">`
                : `<div class="user-avatar">${name[0].toUpperCase()}</div>`;
            html += `<div class="user-box" id="btn-logout" title="${name} · ${this.user.email || ''}">${avatar}</div>`;
        } else {
            html += `<div class="login-btn" id="btn-open-login">${t.nav.login}</div>`;
        }
        container.innerHTML = html;

        document.getElementById('lang-toggle').addEventListener('click', () => this.app.toggleLanguage());
        if (this.user) {
            document.getElementById('btn-logout').addEventListener('click', () => this.logout());
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
