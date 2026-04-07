import { Nav } from '../blocks/nav/nav.js';
import { FeedbackTabs } from '../blocks/feedback/feedback.js';
import { AuthModal } from '../blocks/auth/auth-modal.js';
import { StorageService } from '../services/storage-service.js';

export class MainPage {
    constructor() {
        this.storage = new StorageService('globe');
    }

    init() {
        const currentUser = this.storage.getCurrentUser();
        if (currentUser) {
            window.location.href = 'dashboard.html';
            return;
        }

        const nav = new Nav({ navSelector: '.nav' });
        nav.init();
        nav.bindAnchors();

        const feedback = new FeedbackTabs();
        feedback.init();

        const authModal = new AuthModal();
        authModal.init();
    }
}
