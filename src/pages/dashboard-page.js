import { StorageService } from '../services/storage-service.js';
import { formatDateRu } from '../utils/date.js';
import { escapeHTML } from '../utils/dom.js';

export class DashboardPage {
    constructor() {
        this.storage = new StorageService('globe');
        this.currentUser = null;
        this.tripToDelete = null;
    }

    init() {
        this.currentUser = this.storage.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('navUsername').textContent = this.currentUser.name;
        document.getElementById('greeting').textContent = 'С возвращением, ' + this.currentUser.name + '!';

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.storage.clearCurrentUser();
            window.location.href = 'index.html';
        });

        this.bindModals();
        this.bindTripForm();
        this.bindDeleteModal();
        this.renderTrips();
    }

    getTrips() {
        return this.storage.getTrips(this.currentUser.email);
    }

    saveTrips(trips) {
        this.storage.setTrips(this.currentUser.email, trips);
    }

    renderTrips() {
        const trips = this.getTrips();
        const grid = document.getElementById('tripsGrid');
        const empty = document.getElementById('tripsEmpty');

        grid.innerHTML = '';

        if (trips.length === 0) {
            empty.classList.add('trips-empty--visible');
            return;
        }

        empty.classList.remove('trips-empty--visible');

        trips.forEach((trip) => {
            const card = document.createElement('div');
            card.className = 'trip-card';

            const budgetHTML = trip.budget
                ? '<div class="trip-card__budget">Бюджет: $' + Number(trip.budget).toLocaleString() + '</div>'
                : '';

            card.innerHTML =
                '<div class="trip-card__header">' +
                    '<div class="trip-card__destination">' + escapeHTML(trip.destination) + '</div>' +
                    '<button class="trip-card__delete" data-id="' + trip.id + '" title="Удалить поездку"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                '</div>' +
                '<div class="trip-card__name">' + escapeHTML(trip.name) + '</div>' +
                '<div class="trip-card__dates">' + formatDateRu(trip.startDate) + ' — ' + formatDateRu(trip.endDate) + '</div>' +
                budgetHTML +
                '<button class="login-button trip-card__open" data-id="' + trip.id + '">Открыть →</button>';

            grid.appendChild(card);
        });

        grid.querySelectorAll('.trip-card__delete').forEach((btn) => {
            btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id));
        });

        grid.querySelectorAll('.trip-card__open').forEach((btn) => {
            btn.addEventListener('click', () => {
                window.location.href = 'trip.html?id=' + btn.dataset.id;
            });
        });
    }

    bindModals() {
        const newTripModal = document.getElementById('newTripModal');

        const openNewTripModal = () => {
            newTripModal.classList.add('modal-overlay--visible');
        };

        const closeNewTripModal = () => {
            newTripModal.classList.remove('modal-overlay--visible');
            document.getElementById('newTripForm').reset();
            document.getElementById('newTripError').textContent = '';
        };

        document.getElementById('addTripBtn').addEventListener('click', openNewTripModal);
        document.getElementById('addTripBtnEmpty').addEventListener('click', openNewTripModal);
        document.getElementById('closeTripModal').addEventListener('click', closeNewTripModal);

        newTripModal.addEventListener('click', (event) => {
            if (event.target === newTripModal) {
                closeNewTripModal();
            }
        });

        this.closeNewTripModal = closeNewTripModal;
    }

    bindTripForm() {
        document.getElementById('newTripForm').addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('tripName').value.trim();
            const destination = document.getElementById('tripDestination').value.trim();
            const startDate = document.getElementById('tripStartDate').value;
            const endDate = document.getElementById('tripEndDate').value;
            const budget = document.getElementById('tripBudget').value;
            const error = document.getElementById('newTripError');

            if (startDate && endDate && endDate < startDate) {
                error.textContent = 'Дата окончания должна быть позже даты начала';
                return;
            }

            error.textContent = '';

            const trips = this.getTrips();
            trips.push({
                id: Date.now().toString(),
                name,
                destination,
                startDate,
                endDate,
                budget,
                checklist: [],
                notes: ''
            });

            this.saveTrips(trips);
            this.renderTrips();
            this.closeNewTripModal();
        });
    }

    bindDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');

        document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
            if (!this.tripToDelete) return;
            const trips = this.getTrips().filter((trip) => trip.id !== this.tripToDelete);
            this.saveTrips(trips);
            this.renderTrips();
            this.closeDeleteModal();
        });

        document.getElementById('deleteCancelBtn').addEventListener('click', () => this.closeDeleteModal());

        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) {
                this.closeDeleteModal();
            }
        });
    }

    openDeleteModal(id) {
        this.tripToDelete = id;
        document.getElementById('deleteModal').classList.add('modal-overlay--visible');
    }

    closeDeleteModal() {
        this.tripToDelete = null;
        document.getElementById('deleteModal').classList.remove('modal-overlay--visible');
    }
}
