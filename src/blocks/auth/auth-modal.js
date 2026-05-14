import { StorageService } from '../../services/storage-service.js';

export class AuthModal {
    constructor() {
        this.storage = new StorageService('globe');
        this.authModal = document.getElementById('authModal');
    }

    init() {
        if (!this.authModal) return;

        this.bindOpenButtons();
        this.bindCloseActions();
        this.bindTabs();
        this.bindForms();
    }

    bindOpenButtons() {
        document.querySelectorAll('.login-button').forEach((btn) => {
            btn.addEventListener('click', () => this.open());
        });
    }

    bindCloseActions() {
        const closeButton = document.getElementById('modalClose');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        this.authModal.addEventListener('click', (event) => {
            if (event.target === this.authModal) {
                this.close();
            }
        });
    }

    bindTabs() {
        const tabLogin = document.getElementById('tabLogin');
        const tabRegister = document.getElementById('tabRegister');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (!tabLogin || !tabRegister || !loginForm || !registerForm) return;

        tabLogin.addEventListener('click', () => {
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            tabLogin.classList.add('modal-tab--active');
            tabRegister.classList.remove('modal-tab--active');
        });

        tabRegister.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            tabRegister.classList.add('modal-tab--active');
            tabLogin.classList.remove('modal-tab--active');
        });
    }

    bindForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleRegister();
            });
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const loginError = document.getElementById('loginError');

        if (loginError) loginError.textContent = '';

        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Заполните почту и пароль';
            }
            return;
        }

        if (!this.isValidEmail(email)) {
            if (loginError) {
                loginError.textContent = 'Введите корректный email (например, name@mail.com)';
            }
            return;
        }

        const users = this.storage.getUsers();
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
            if (loginError) {
                loginError.textContent = 'Неверная почта или пароль';
            }
            return;
        }

        this.storage.setCurrentUser({ name: user.name, email: user.email });
        window.location.href = 'dashboard.html';
    }

    handleRegister() {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const registerError = document.getElementById('registerError');

        if (registerError) registerError.textContent = '';

        if (!name || !email || !password) {
            if (registerError) {
                registerError.textContent = 'Заполните все поля';
            }
            return;
        }

        if (!this.isValidEmail(email)) {
            if (registerError) {
                registerError.textContent = 'Введите корректный email (например, name@mail.com)';
            }
            return;
        }

        const users = this.storage.getUsers();
        const existing = users.find((u) => u.email === email);

        if (existing) {
            if (registerError) {
                registerError.textContent = 'Эта почта уже зарегистрирована';
            }
            return;
        }

        users.push({ name, email, password });
        this.storage.setUsers(users);
        this.storage.setCurrentUser({ name, email });
        window.location.href = 'dashboard.html';
    }

    open() {
        this.authModal.classList.add('modal-overlay--visible');
    }

    close() {
        this.authModal.classList.remove('modal-overlay--visible');
        const loginError = document.getElementById('loginError');
        const registerError = document.getElementById('registerError');
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    }
}
