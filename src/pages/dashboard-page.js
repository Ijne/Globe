import { StorageService } from '../services/storage-service.js';
import { formatDateRu } from '../utils/date.js';
import { escapeHTML, syncScrollLock } from '../utils/dom.js';
import { formatCurrency, normalizeCurrency } from '../utils/currency.js';

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
        const trips = this.getTrips()
            .slice()
            .sort((a, b) => {
                const aCompleted = a.isCompleted ? 1 : 0;
                const bCompleted = b.isCompleted ? 1 : 0;
                if (aCompleted !== bCompleted) {
                    return aCompleted - bCompleted;
                }
                return Number(b.id) - Number(a.id);
            });
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
            card.className = 'trip-card' + (trip.isCompleted ? ' trip-card--completed' : '');

            const budgetHTML = trip.budget
                ? '<div class="trip-card__budget">Бюджет: ' + formatCurrency(trip.budget, trip.currency) + '</div>'
                : '';

            card.innerHTML =
                '<div class="trip-card__header">' +
                    '<div class="trip-card__destination">' + escapeHTML(trip.destination) + '</div>' +
                    '<button class="trip-card__delete" data-id="' + trip.id + '" title="Удалить поездку"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                '</div>' +
                (trip.isCompleted ? '<div class="trip-card__status">Завершена</div>' : '') +
                '<div class="trip-card__name">' + escapeHTML(trip.name) + '</div>' +
                '<div class="trip-card__dates">' + formatDateRu(trip.startDate) + ' — ' + formatDateRu(trip.endDate) + '</div>' +
                budgetHTML +
                '<button class="login-button trip-card__open" data-id="' + trip.id + '">' + (trip.isCompleted ? 'Итоги →' : 'Открыть →') + '</button>';

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
            const startInput = document.getElementById('tripStartDate');
            const endInput = document.getElementById('tripEndDate');
            const today = this.getTodayISO();
            startInput.min = today;
            endInput.min = startInput.value || today;
            newTripModal.classList.add('modal-overlay--visible');
            syncScrollLock();
        };

        const closeNewTripModal = () => {
            newTripModal.classList.remove('modal-overlay--visible');
            document.getElementById('newTripForm').reset();
            document.getElementById('newTripError').textContent = '';
            syncScrollLock();
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
        const startInput = document.getElementById('tripStartDate');
        const endInput = document.getElementById('tripEndDate');
        const applyDateLimits = () => {
            const today = this.getTodayISO();
            startInput.min = today;
            endInput.min = startInput.value || today;
        };

        applyDateLimits();

        startInput.addEventListener('change', () => {
            const today = this.getTodayISO();
            const minEnd = startInput.value || today;
            endInput.min = minEnd;
            if (endInput.value && endInput.value < minEnd) {
                endInput.value = minEnd;
            }
        });

        endInput.addEventListener('change', () => {
            const today = this.getTodayISO();
            const minEnd = startInput.value || today;
            if (endInput.value && endInput.value < minEnd) {
                endInput.value = minEnd;
            }
        });

        document.getElementById('newTripForm').addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('tripName').value.trim();
            const destination = document.getElementById('tripDestination').value.trim();
            const startDate = document.getElementById('tripStartDate').value;
            const endDate = document.getElementById('tripEndDate').value;
            const budget = document.getElementById('tripBudget').value;
            const currency = normalizeCurrency(document.getElementById('tripCurrency').value);
            const error = document.getElementById('newTripError');

            const validationError = this.validateTripDates(startDate, endDate);
            if (validationError) {
                error.textContent = validationError;
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
                currency,
                checklist: [],
                notes: ''
            });

            this.saveTrips(trips);
            this.renderTrips();
            this.closeNewTripModal();
        });
    }

    getTodayISO() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    }

    validateTripDates(startDate, endDate) {
        const today = this.getTodayISO();
        const start = this.parseISODateStrict(startDate);
        const end = this.parseISODateStrict(endDate);
        const todayDate = this.parseISODateStrict(today);

        if (!startDate || !endDate) {
            return 'Укажите дату начала и дату окончания';
        }

        if (!start || !end || !todayDate) {
            return 'Некорректная дата. Используйте формат ГГГГ-ММ-ДД';
        }

        const startDay = this.toUtcDayNumber(start);
        const endDay = this.toUtcDayNumber(end);
        const todayDay = this.toUtcDayNumber(todayDate);

        if (startDay < todayDay) {
            return 'Дата начала не может быть в прошлом';
        }

        if (endDay < todayDay) {
            return 'Дата окончания не может быть в прошлом';
        }

        if (startDay > endDay) {
            return 'Дата начала не может быть позже даты окончания';
        }

        return '';
    }

    parseISODateStrict(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
            return null;
        }

        const [yearStr, monthStr, dayStr] = value.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        const parsed = new Date(Date.UTC(year, month - 1, day));

        if (
            parsed.getUTCFullYear() !== year ||
            parsed.getUTCMonth() !== month - 1 ||
            parsed.getUTCDate() !== day
        ) {
            return null;
        }

        return parsed;
    }

    toUtcDayNumber(date) {
        return Math.floor(date.getTime() / 86400000);
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
        syncScrollLock();
    }

    closeDeleteModal() {
        this.tripToDelete = null;
        document.getElementById('deleteModal').classList.remove('modal-overlay--visible');
        syncScrollLock();
    }
}
