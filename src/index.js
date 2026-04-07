import { MainPage } from './pages/main-page.js';
import { DashboardPage } from './pages/dashboard-page.js';
import { TripPage } from './pages/trip-page.js';
import { ThemeToggle } from './blocks/theme/theme-toggle.js';

ThemeToggle.applySavedThemeEarly();

document.addEventListener('DOMContentLoaded', async () => {
    const theme = new ThemeToggle();
    theme.init();

    const page = document.body.dataset.page || getPageFromPath();

    if (page === 'main') {
        new MainPage().init();
        return;
    }

    if (page === 'dashboard') {
        new DashboardPage().init();
        return;
    }

    if (page === 'trip') {
        await new TripPage().init();
    }
});

function getPageFromPath() {
    const pathname = window.location.pathname;
    if (pathname.endsWith('/dashboard.html')) return 'dashboard';
    if (pathname.endsWith('/trip.html')) return 'trip';
    return 'main';
}
