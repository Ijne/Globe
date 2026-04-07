import { StorageService } from '../services/storage-service.js';
import { WeatherService } from '../services/weather-service.js';
import { escapeHTML } from '../utils/dom.js';
import { formatDateRu, tripDaysCount } from '../utils/date.js';

export class TripPage {
    constructor() {
        this.storage = new StorageService('globe');
        this.weather = new WeatherService();
        this.currentUser = null;
        this.tripId = null;
        this.saveTimeout = null;
    }

    async init() {
        this.currentUser = this.storage.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('navUsername').textContent = this.currentUser.name;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.storage.clearCurrentUser();
            window.location.href = 'index.html';
        });

        const params = new URLSearchParams(window.location.search);
        this.tripId = params.get('id');

        if (!this.tripId) {
            window.location.href = 'dashboard.html';
            return;
        }

        const trip = this.getTrip();
        if (!trip) {
            window.location.href = 'dashboard.html';
            return;
        }

        this.renderHero(trip);
        this.ensureTripCollections(trip);
        this.bindBudgetEvents();
        this.bindChecklistEvents();
        this.bindNotesEvents();

        this.renderBudget();
        this.renderChecklist();
        this.renderNotes();
        await this.loadWeather();
    }

    getTrips() {
        return this.storage.getTrips(this.currentUser.email);
    }

    saveTrips(trips) {
        this.storage.setTrips(this.currentUser.email, trips);
    }

    getTrip() {
        return this.getTrips().find((trip) => trip.id === this.tripId) || null;
    }

    saveTrip(updatedTrip) {
        const trips = this.getTrips().map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip));
        this.saveTrips(trips);
    }

    renderHero(trip) {
        document.title = 'Globe — ' + trip.name;
        document.getElementById('heroDestination').textContent = trip.destination;
        document.getElementById('heroName').textContent = trip.name;

        const meta = document.getElementById('heroMeta');
        meta.innerHTML = '';

        if (trip.startDate && trip.endDate) {
            const dateBadge = document.createElement('span');
            dateBadge.className = 'trip-hero__meta-badge';
            dateBadge.textContent = formatDateRu(trip.startDate) + ' — ' + formatDateRu(trip.endDate);
            meta.appendChild(dateBadge);

            const days = tripDaysCount(trip.startDate, trip.endDate);
            if (days > 0) {
                const daysBadge = document.createElement('span');
                daysBadge.className = 'trip-hero__meta-badge';
                daysBadge.textContent = days + (days === 1 ? ' день' : ' дней');
                meta.appendChild(daysBadge);
            }
        }

        if (trip.budget) {
            document.getElementById('budgetSection').style.display = 'block';
        }
    }

    ensureTripCollections(trip) {
        let changed = false;
        if (!trip.expenses) {
            trip.expenses = [];
            changed = true;
        }
        if (!trip.checklist) {
            trip.checklist = [];
            changed = true;
        }
        if (!trip.notes) {
            trip.notes = '';
            changed = true;
        }

        if (changed) {
            this.saveTrip(trip);
        }
    }

    async loadWeather() {
        const trip = this.getTrip();
        if (!trip || !trip.destination) return;

        const weatherRoot = document.getElementById('tripWeather');
        weatherRoot.innerHTML = '<div class="trip-weather__status">Загрузка погоды...</div>';

        try {
            const data = await this.weather.getCurrentWeather(trip.destination);
            weatherRoot.innerHTML =
                `<div class="trip-weather__temp">${Math.round(data.temperature)}°C</div>` +
                `<div class="trip-weather__description">${this.weather.getDescription(data.weatherCode)}</div>` +
                `<div class="trip-weather__details">` +
                    `<span>Ветер: ${Math.round(data.windSpeed)} км/ч</span>` +
                    `<span>${data.city}, ${data.country}</span>` +
                `</div>`;
        } catch (error) {
            weatherRoot.innerHTML = '<div class="trip-weather__status">Не удалось загрузить погоду</div>';
        }
    }

    bindBudgetEvents() {
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        const expenseAmount = document.getElementById('expenseAmount');
        if (!addExpenseBtn || !expenseAmount) return;

        addExpenseBtn.addEventListener('click', () => {
            const label = document.getElementById('expenseLabel').value.trim();
            const amount = document.getElementById('expenseAmount').value;
            if (!label || !amount || Number(amount) <= 0) return;

            const trip = this.getTrip();
            if (!trip.expenses) trip.expenses = [];
            trip.expenses.push({ label, amount: Number(amount) });
            this.saveTrip(trip);

            document.getElementById('expenseLabel').value = '';
            document.getElementById('expenseAmount').value = '';
            this.renderBudget();
        });

        expenseAmount.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                addExpenseBtn.click();
            }
        });
    }

    renderBudget() {
        const trip = this.getTrip();
        if (!trip || !trip.budget) return;

        const total = Number(trip.budget);
        const expenses = trip.expenses || [];
        const spent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const remaining = total - spent;
        const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

        document.getElementById('budgetTotal').textContent = '$' + total.toLocaleString();
        document.getElementById('budgetSpent').textContent = '$' + spent.toLocaleString();

        const bar = document.getElementById('budgetBar');
        bar.style.width = percent + '%';
        bar.classList.toggle('trip-budget__bar--over', spent > total);

        const remainEl = document.getElementById('budgetRemaining');
        if (remaining < 0) {
            remainEl.textContent = 'Превышение бюджета на $' + Math.abs(remaining).toLocaleString();
            remainEl.classList.add('trip-budget__remaining--over');
        } else {
            remainEl.textContent = 'Осталось: $' + remaining.toLocaleString();
            remainEl.classList.remove('trip-budget__remaining--over');
        }

        const list = document.getElementById('expensesList');
        list.innerHTML = '';

        expenses.forEach((expense, idx) => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML =
                '<span class="expense-item__label">' + escapeHTML(expense.label) + '</span>' +
                '<div class="expense-item__right">' +
                    '<span class="expense-item__amount">$' + Number(expense.amount).toLocaleString() + '</span>' +
                    '<button class="expense-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                '</div>';
            list.appendChild(item);
        });

        list.querySelectorAll('.expense-item__delete').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.idx);
                const current = this.getTrip();
                current.expenses.splice(index, 1);
                this.saveTrip(current);
                this.renderBudget();
            });
        });
    }

    bindChecklistEvents() {
        const addChecklistBtn = document.getElementById('addChecklistBtn');
        const checklistInput = document.getElementById('checklistInput');
        if (!addChecklistBtn || !checklistInput) return;

        const addChecklistItem = () => {
            const text = checklistInput.value.trim();
            if (!text) return;

            const trip = this.getTrip();
            if (!trip.checklist) trip.checklist = [];
            trip.checklist.push({ text, done: false });
            this.saveTrip(trip);
            checklistInput.value = '';
            this.renderChecklist();
        };

        addChecklistBtn.addEventListener('click', addChecklistItem);
        checklistInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                addChecklistItem();
            }
        });
    }

    renderChecklist() {
        const trip = this.getTrip();
        const items = trip.checklist || [];
        const container = document.getElementById('checklistItems');
        container.innerHTML = '';

        items.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'checklist-item' + (item.done ? ' checklist-item--done' : '');

            el.innerHTML =
                '<div class="checklist-item__checkbox">' +
                    (item.done
                        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                        : '') +
                '</div>' +
                '<span class="checklist-item__text">' + escapeHTML(item.text) + '</span>' +
                '<button class="checklist-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

            el.addEventListener('click', (event) => {
                if (event.target.closest('.checklist-item__delete')) return;
                const current = this.getTrip();
                current.checklist[idx].done = !current.checklist[idx].done;
                this.saveTrip(current);
                this.renderChecklist();
            });

            container.appendChild(el);
        });

        container.querySelectorAll('.checklist-item__delete').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const index = Number(btn.dataset.idx);
                const current = this.getTrip();
                current.checklist.splice(index, 1);
                this.saveTrip(current);
                this.renderChecklist();
            });
        });

        const progress = document.getElementById('checklistProgress');
        if (items.length === 0) {
            progress.textContent = '';
        } else {
            const done = items.filter((item) => item.done).length;
            progress.textContent = done + ' / ' + items.length + ' вещей собрано';
        }
    }

    bindNotesEvents() {
        const notesArea = document.getElementById('tripNotes');
        const savedLabel = document.getElementById('notesSaved');
        if (!notesArea || !savedLabel) return;

        notesArea.addEventListener('input', () => {
            clearTimeout(this.saveTimeout);
            savedLabel.classList.remove('trip-notes__saved--visible');

            this.saveTimeout = setTimeout(() => {
                const trip = this.getTrip();
                trip.notes = notesArea.value;
                this.saveTrip(trip);

                savedLabel.textContent = 'Сохранено ✓';
                savedLabel.classList.add('trip-notes__saved--visible');

                setTimeout(() => {
                    savedLabel.classList.remove('trip-notes__saved--visible');
                }, 2000);
            }, 800);
        });
    }

    renderNotes() {
        const trip = this.getTrip();
        document.getElementById('tripNotes').value = trip.notes || '';
    }
}
