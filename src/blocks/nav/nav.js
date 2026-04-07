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

        this.burgerButton.addEventListener('click', () => this.toggle());
        window.addEventListener('resize', () => this.applyResponsiveState());
        this.applyResponsiveState();
    }

    createBurgerButton() {
        const button = document.createElement('button');
        button.classList.add('burger-button', 'burger-button--open');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        return button;
    }

    toggle() {
        if (!this.burgerButton) return;
        const opened = this.nav.classList.toggle('nav--open');
        this.burgerButton.classList.toggle('burger-button--open', !opened);
        this.burgerButton.classList.toggle('burger-button--close', opened);
        this.applyResponsiveState();
    }

    close() {
        if (!this.burgerButton) return;
        this.nav.classList.remove('nav--open');
        this.burgerButton.classList.add('burger-button--open');
        this.burgerButton.classList.remove('burger-button--close');
    }

    applyResponsiveState() {
        if (!this.burgerButton) return;
        const isMobile = window.innerWidth <= this.mobileWidth;

        this.navButtons.forEach((button) => {
            button.style.display = isMobile && !this.nav.classList.contains('nav--open') ? 'none' : 'block';
        });

        this.burgerButton.style.display = isMobile ? 'block' : 'none';
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
                    this.applyResponsiveState();
                }
            });
        });
    }
}
