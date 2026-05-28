export class AuthSystem {
    constructor(app) {
        this.app = app;
        this.user = JSON.parse(localStorage.getItem('scent_user')) || null;
        this.currentTab = 'login'; // 'login' or 'register'
    }

    init() {
        this.bindEvents();
        this.renderAuthModal();
        this.updateUserNav();
    }

    bindEvents() {
        document.getElementById('btn-login-tab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('btn-register-tab').addEventListener('click', () => this.switchTab('register'));
        document.getElementById('btn-auth-submit').addEventListener('click', () => this.handleSubmit());
    }

    openModal() {
        document.getElementById('login-modal').classList.add('active');
        this.switchTab('login');
    }

    closeModal() {
        document.getElementById('login-modal').classList.remove('active');
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.getElementById('btn-login-tab').classList.toggle('active', tab === 'login');
        document.getElementById('btn-register-tab').classList.toggle('active', tab === 'register');
        
        const isRegister = tab === 'register';
        document.getElementById('auth-username-group').style.display = isRegister ? 'block' : 'none';
        document.getElementById('auth-confirm-password-group').style.display = isRegister ? 'block' : 'none';
        
        const t = this.app.getTranslation().auth;
        document.getElementById('btn-auth-submit').innerText = isRegister ? t.register_btn : t.login_btn;
    }

    async handleSubmit() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        
        const isEn = this.app.state.currentLang === 'en';
        if (!email || !password) {
            this.app.showToast(isEn ? 'Please fill in all required fields.' : '请填写所有必填项', 'error');
            return;
        }

        try {
            if (this.currentTab === 'login') {
                await this.mockLogin(email, password);
            } else {
                const username = document.getElementById('auth-username').value.trim();
                const confirmPwd = document.getElementById('auth-confirm-password').value.trim();
                if (password !== confirmPwd) {
                    this.app.showToast(isEn ? 'Passwords do not match!' : '两次输入的密码不一致', 'error');
                    return;
                }
                await this.mockRegister(username, email, password);
            }

            this.closeModal();
            this.updateUserNav();
            this.app.showToast(isEn ? `Welcome, ${this.user.name}` : `欢迎，${this.user.name}`, 'success');
            if (this.app.state.currentView === 'home') {
                this.app.navigate('collection');
            }
        } catch (error) {
            this.app.showToast(error.message, 'error');
        }
    }

    // Mock API for Backend Integration
    mockLogin(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    this.user = { email, name: email.split('@')[0] };
                    localStorage.setItem('scent_user', JSON.stringify(this.user));
                    resolve(this.user);
                } else {
                    reject(new Error("Invalid credentials"));
                }
            }, 500);
        });
    }

    mockRegister(username, email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Here we would normally send to backend.
                this.user = { email, name: username || email.split('@')[0] };
                localStorage.setItem('scent_user', JSON.stringify(this.user));
                resolve(this.user);
            }, 500);
        });
    }

    logout() {
        const t = this.app.getTranslation().auth;
        if (confirm(t.logout_confirm)) {
            this.user = null;
            localStorage.removeItem('scent_user');
            this.updateUserNav();
            this.app.navigate('home');
        }
    }

    updateUserNav() {
        const container = document.getElementById('user-nav');
        const t = this.app.getTranslation();
        const langBtnText = this.app.state.currentLang === 'zh' ? 'EN' : '中文';
        
        let html = `<div class="lang-btn" id="lang-toggle">${langBtnText}</div>`;
        
        if (this.user) {
            html += `
                <div class="user-avatar" id="btn-logout" title="${t.auth.logout_confirm}: ${this.user.email}">
                    ${this.user.name[0].toUpperCase()}
                </div>
            `;
        } else {
            html += `
                <div class="login-btn" id="btn-open-login">${t.nav.login}</div>
            `;
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
