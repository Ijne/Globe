import { syncScrollLock } from '../../utils/dom.js';

const ICON_BURGER = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
const ICON_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

export class Nav {
    constructor({ navSelector, mobileWidth = 800 }) {
        this.nav = document.querySelector(navSelector);
        this.burgerButton = null;
        this.mobileWidth = mobileWidth;
        this.navButtons = [];
    }

    init() {
        if (!this.nav) return;

        this.navButtons = Array.from(this.nav.querySelectorAll('.nav__button'));
        this.burgerButton = this.createBurgerButton();
        this.nav.prepend(this.burgerButton);

        this.burgerButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });

        window.addEventListener('resize', () => this.handleResize());

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.close();
            }
        });

        document.addEventListener('click', (event) => {
            if (!this.isOpen()) return;
            if (this.nav.contains(event.target)) return;
            this.close();
        });

        this.applyResponsiveState();
    }

    createBurgerButton() {
        const button = document.createElement('button');
        button.classList.add('burger-button');
        button.setAttribute('aria-label', 'Открыть меню');
        button.innerHTML = ICON_BURGER;
        return button;
    }

    isOpen() {
        return this.nav.classList.contains('nav--open');
    }

    toggle() {
        const opened = this.nav.classList.toggle('nav--open');
        this.burgerButton.innerHTML = opened ? ICON_CLOSE : ICON_BURGER;
        this.burgerButton.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
        this.applyResponsiveState();
        syncScrollLock();
    }

    close() {
        if (!this.nav || !this.isOpen()) return;
        this.nav.classList.remove('nav--open');
        this.burgerButton.innerHTML = ICON_BURGER;
        this.burgerButton.setAttribute('aria-label', 'Открыть меню');
        this.applyResponsiveState();
        syncScrollLock();
    }

    handleResize() {
        // Если экран стал шире мобильного порога, а меню осталось открытым —
        // снимаем полноэкранный оверлей, чтобы он не залипал поверх страницы.
        if (window.innerWidth > this.mobileWidth && this.isOpen()) {
            this.nav.classList.remove('nav--open');
            this.burgerButton.innerHTML = ICON_BURGER;
            this.burgerButton.setAttribute('aria-label', 'Открыть меню');
        }
        this.applyResponsiveState();
        syncScrollLock();
    }

    applyResponsiveState() {
        if (!this.burgerButton) return;
        const isMobile = window.innerWidth <= this.mobileWidth;
        const menuOpen = this.isOpen();

        this.navButtons.forEach((button) => {
            button.style.display = isMobile && !menuOpen ? 'none' : '';
        });

        this.burgerButton.style.display = isMobile ? 'flex' : 'none';
    }

    bindAnchors() {
        if (!this.nav) return;

        this.nav.querySelectorAll('.nav__button[data-target]').forEach((button) => {
            button.addEventListener('click', () => {
                const target = document.getElementById(button.dataset.target);
                if (!target) return;

                target.scrollIntoView({ behavior: 'smooth', block: 'start' });

                if (window.innerWidth <= this.mobileWidth) {
                    this.close();
                }
            });
        });
    }
}
