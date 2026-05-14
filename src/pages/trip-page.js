import { StorageService } from '../services/storage-service.js';
import { WeatherService } from '../services/weather-service.js';
import { escapeHTML } from '../utils/dom.js';
import { formatDateRu, tripDaysCount } from '../utils/date.js';
import { formatCurrency, normalizeCurrency } from '../utils/currency.js';

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
        this.bindCompletionEvents();
        this.bindCurrencyEvents();
        this.bindBudgetEvents();
        this.bindChecklistEvents();
        this.bindNotesEvents();

        this.renderCompletionState();
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
        if (typeof trip.isCompleted !== 'boolean') {
            trip.isCompleted = false;
            changed = true;
        }
        if (!trip.currency) {
            trip.currency = 'USD';
            changed = true;
        }
        if (!trip.completedAt) {
            trip.completedAt = '';
            changed = true;
        }

        if (changed) {
            this.saveTrip(trip);
        }
    }

    isTripCompleted() {
        const trip = this.getTrip();
        return Boolean(trip && trip.isCompleted);
    }

    getTripCurrency() {
        const trip = this.getTrip();
        return normalizeCurrency(trip?.currency || 'USD');
    }

    bindCurrencyEvents() {
        const currencySelect = document.getElementById('currencySelect');
        if (!currencySelect) return;

        currencySelect.value = this.getTripCurrency();

        currencySelect.addEventListener('change', () => {
            if (this.isTripCompleted()) return;

            const trip = this.getTrip();
            if (!trip) return;
            trip.currency = normalizeCurrency(currencySelect.value);
            this.saveTrip(trip);
            this.renderBudget();
            this.renderCompletionState();
        });
    }

    bindCompletionEvents() {
        const finishButton = document.getElementById('finishTripBtn');
        if (!finishButton) return;

        finishButton.addEventListener('click', () => {
            const trip = this.getTrip();
            if (!trip || trip.isCompleted) return;

            const ok = window.confirm('Завершить поездку и зафиксировать итоги?');
            if (!ok) return;

            trip.isCompleted = true;
            trip.completedAt = new Date().toISOString();
            this.saveTrip(trip);

            this.renderCompletionState();
            this.renderBudget();
            this.renderChecklist();
            this.renderNotes();
        });
    }

    renderCompletionState() {
        const trip = this.getTrip();
        if (!trip) return;

        const statusEl = document.getElementById('tripSummaryStatus');
        const finishButton = document.getElementById('finishTripBtn');
        const compactEl = document.getElementById('tripSummaryCompact');
        const datesEl = document.getElementById('summaryDates');
        const daysEl = document.getElementById('summaryDays');
        const spentEl = document.getElementById('summarySpent');
        const budgetEl = document.getElementById('summaryBudget');
        const currencySelect = document.getElementById('currencySelect');

        const expenses = trip.expenses || [];
        const spent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalBudget = Number(trip.budget || 0);
        const days = tripDaysCount(trip.startDate, trip.endDate);
        const currency = this.getTripCurrency();

        datesEl.textContent = trip.startDate && trip.endDate
            ? formatDateRu(trip.startDate) + ' — ' + formatDateRu(trip.endDate)
            : '—';
        daysEl.textContent = days > 0 ? String(days) : '—';
        spentEl.textContent = formatCurrency(spent, currency);
        budgetEl.textContent = trip.budget ? formatCurrency(totalBudget, currency) : 'Не задан';
        if (currencySelect) {
            currencySelect.value = currency;
        }

        if (trip.isCompleted) {
            statusEl.textContent = 'Поездка завершена';
            finishButton.style.display = 'none';
            compactEl.style.display = 'grid';
        } else {
            statusEl.textContent = 'Поездка в процессе';
            finishButton.style.display = 'inline-flex';
            compactEl.style.display = 'none';
        }

        this.applyCompletionLock(trip.isCompleted);
    }

    applyCompletionLock(isCompleted) {
        const expenseLabel = document.getElementById('expenseLabel');
        const expenseAmount = document.getElementById('expenseAmount');
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        const checklistInput = document.getElementById('checklistInput');
        const addChecklistBtn = document.getElementById('addChecklistBtn');
        const notes = document.getElementById('tripNotes');
        const currencySelect = document.getElementById('currencySelect');
        const budgetSection = document.getElementById('budgetSection');
        const checklistSection = document.getElementById('checklistSection');
        const notesSection = document.getElementById('notesSection');

        if (expenseLabel) expenseLabel.disabled = isCompleted;
        if (expenseAmount) expenseAmount.disabled = isCompleted;
        if (addExpenseBtn) addExpenseBtn.disabled = isCompleted;
        if (checklistInput) checklistInput.disabled = isCompleted;
        if (addChecklistBtn) addChecklistBtn.disabled = isCompleted;
        if (notes) notes.readOnly = isCompleted;
        if (currencySelect) currencySelect.disabled = isCompleted;

        if (budgetSection) {
            budgetSection.style.display = isCompleted ? 'none' : (this.getTrip()?.budget ? 'block' : 'none');
        }
        if (checklistSection) {
            checklistSection.style.display = isCompleted ? 'none' : 'block';
        }
        if (notesSection) {
            notesSection.style.display = isCompleted ? 'none' : 'block';
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
            if (this.isTripCompleted()) return;
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
            this.renderCompletionState();
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
        const currency = this.getTripCurrency();

        document.getElementById('budgetTotal').textContent = formatCurrency(total, currency);
        document.getElementById('budgetSpent').textContent = formatCurrency(spent, currency);

        const bar = document.getElementById('budgetBar');
        bar.style.width = percent + '%';
        bar.classList.toggle('trip-budget__bar--over', spent > total);

        const remainEl = document.getElementById('budgetRemaining');
        if (remaining < 0) {
            remainEl.textContent = 'Превышение бюджета на ' + formatCurrency(Math.abs(remaining), currency);
            remainEl.classList.add('trip-budget__remaining--over');
        } else {
            remainEl.textContent = 'Осталось: ' + formatCurrency(remaining, currency);
            remainEl.classList.remove('trip-budget__remaining--over');
        }

        const list = document.getElementById('expensesList');
        list.innerHTML = '';

        expenses.forEach((expense, idx) => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            const deleteButton = this.isTripCompleted()
                ? ''
                : '<button class="expense-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
            item.innerHTML =
                '<span class="expense-item__label">' + escapeHTML(expense.label) + '</span>' +
                '<div class="expense-item__right">' +
                    '<span class="expense-item__amount">' + formatCurrency(expense.amount, currency) + '</span>' +
                    deleteButton +
                '</div>';
            list.appendChild(item);
        });

        if (!this.isTripCompleted()) {
            list.querySelectorAll('.expense-item__delete').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.idx);
                const current = this.getTrip();
                current.expenses.splice(index, 1);
                this.saveTrip(current);
                this.renderBudget();
                this.renderCompletionState();
            });
            });
        }
    }

    bindChecklistEvents() {
        const addChecklistBtn = document.getElementById('addChecklistBtn');
        const checklistInput = document.getElementById('checklistInput');
        if (!addChecklistBtn || !checklistInput) return;

        const addChecklistItem = () => {
            if (this.isTripCompleted()) return;
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

            const deleteButton = this.isTripCompleted()
                ? ''
                : '<button class="checklist-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

            el.innerHTML =
                '<div class="checklist-item__checkbox">' +
                    (item.done
                        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                        : '') +
                '</div>' +
                '<span class="checklist-item__text">' + escapeHTML(item.text) + '</span>' +
                deleteButton;

            el.addEventListener('click', (event) => {
                if (this.isTripCompleted()) return;
                if (event.target.closest('.checklist-item__delete')) return;
                const current = this.getTrip();
                current.checklist[idx].done = !current.checklist[idx].done;
                this.saveTrip(current);
                this.renderChecklist();
            });

            container.appendChild(el);
        });

        if (!this.isTripCompleted()) {
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
        }

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
            if (this.isTripCompleted()) return;
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
