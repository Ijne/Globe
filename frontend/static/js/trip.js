document.addEventListener('DOMContentLoaded', function() {

    var currentUser = JSON.parse(localStorage.getItem('globe_current_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('navUsername').textContent = currentUser.name;

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('globe_current_user');
        window.location.href = 'index.html';
    });

    var params = new URLSearchParams(window.location.search);
    var tripId = params.get('id');

    if (!tripId) {
        window.location.href = 'dashboard.html';
        return;
    }

    function getTrips() {
        return JSON.parse(localStorage.getItem('globe_trips_' + currentUser.email)) || [];
    }

    function saveTrips(trips) {
        localStorage.setItem('globe_trips_' + currentUser.email, JSON.stringify(trips));
    }

    function getTrip() {
        return getTrips().find(function(t) { return t.id === tripId; }) || null;
    }

    function saveTrip(updatedTrip) {
        var trips = getTrips().map(function(t) {
            return t.id === updatedTrip.id ? updatedTrip : t;
        });
        saveTrips(trips);
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    var trip = getTrip();
    if (!trip) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.title = 'Globe — ' + trip.name;
    document.getElementById('heroDestination').textContent = trip.destination;
    document.getElementById('heroName').textContent = trip.name;

    function loadWeather() {
        if (!trip.destination) return;
        
        var weatherEl = document.getElementById('tripWeather');
        weatherEl.innerHTML = '<div class="trip-weather__status">Загрузка погоды...</div>';
        
        fetch('/api/weather?city=' + encodeURIComponent(trip.destination))
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var desc = getWeatherDescription(data.weatherCode);
                weatherEl.innerHTML = 
                    '<div class="trip-weather__temp">' + Math.round(data.temperature) + '°C</div>' +
                    '<div class="trip-weather__description">' + desc + '</div>' +
                    '<div class="trip-weather__details">' +
                        '<span>Ветер: ' + Math.round(data.windSpeed) + ' км/ч</span>' +
                        '<span>' + data.city + ', ' + data.country + '</span>' +
                    '</div>';
            })
            .catch(function(e) {
                    weatherEl.innerHTML = '<div class="trip-weather__status">Не удалось загрузить погоду</div>';
            });
    }
    
    function getWeatherDescription(code) {
        var descriptions = {
            0: 'Ясно',
            1: 'Преимущественно ясно',
            2: 'Переменная облачность',
            3: 'Пасмурно',
            45: 'Туман',
            48: 'Туман',
            51: 'Небольшой дождь',
            53: 'Умеренный дождь',
            55: 'Сильный дождь',
            80: 'Ливневый дождь',
            81: 'Сильный ливень',
            99: 'Гроза'
        };
        return descriptions[code] || 'Погода';
    }
    
    loadWeather();

    var meta = document.getElementById('heroMeta');
    if (trip.startDate && trip.endDate) {
        var dateBadge = document.createElement('span');
        dateBadge.className = 'trip-hero__meta-badge';
        dateBadge.textContent = formatDate(trip.startDate) + ' — ' + formatDate(trip.endDate);
        meta.appendChild(dateBadge);

        var start = new Date(trip.startDate + 'T00:00:00');
        var end = new Date(trip.endDate + 'T00:00:00');
        var days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (days > 0) {
            var daysBadge = document.createElement('span');
            daysBadge.className = 'trip-hero__meta-badge';
            daysBadge.textContent = days + (days === 1 ? ' день' : ' дней');
            meta.appendChild(daysBadge);
        }
    }

    if (trip.budget) {
        document.getElementById('budgetSection').style.display = 'block';
    }

    if (!trip.expenses) {
        trip.expenses = [];
        saveTrip(trip);
    }

    function renderBudget() {
        trip = getTrip();
        if (!trip.budget) return;

        var total = Number(trip.budget);
        var expenses = trip.expenses || [];
        var spent = expenses.reduce(function(sum, e) { return sum + Number(e.amount); }, 0);
        var remaining = total - spent;
        var percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

        document.getElementById('budgetTotal').textContent = '$' + total.toLocaleString();
        document.getElementById('budgetSpent').textContent = '$' + spent.toLocaleString();

        var bar = document.getElementById('budgetBar');
        bar.style.width = percent + '%';
        if (spent > total) {
            bar.classList.add('trip-budget__bar--over');
        } else {
            bar.classList.remove('trip-budget__bar--over');
        }

        var remainEl = document.getElementById('budgetRemaining');
        if (remaining < 0) {
            remainEl.textContent = 'Превышение бюджета на $' + Math.abs(remaining).toLocaleString();
            remainEl.classList.add('trip-budget__remaining--over');
        } else {
            remainEl.textContent = 'Осталось: $' + remaining.toLocaleString();
            remainEl.classList.remove('trip-budget__remaining--over');
        }

        var list = document.getElementById('expensesList');
        list.innerHTML = '';
        expenses.forEach(function(exp, idx) {
            var item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML =
                '<span class="expense-item__label">' + escapeHTML(exp.label) + '</span>' +
                '<div class="expense-item__right">' +
                    '<span class="expense-item__amount">$' + Number(exp.amount).toLocaleString() + '</span>' +
                    '<button class="expense-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                '</div>';
            list.appendChild(item);
        });

        list.querySelectorAll('.expense-item__delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var i = Number(this.dataset.idx);
                trip = getTrip();
                trip.expenses.splice(i, 1);
                saveTrip(trip);
                renderBudget();
            });
        });
    }

    renderBudget();

    document.getElementById('addExpenseBtn').addEventListener('click', function() {
        var label = document.getElementById('expenseLabel').value.trim();
        var amount = document.getElementById('expenseAmount').value;
        if (!label || !amount || Number(amount) <= 0) return;
        trip = getTrip();
        if (!trip.expenses) trip.expenses = [];
        trip.expenses.push({ label: label, amount: Number(amount) });
        saveTrip(trip);
        document.getElementById('expenseLabel').value = '';
        document.getElementById('expenseAmount').value = '';
        renderBudget();
    });

    document.getElementById('expenseAmount').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('addExpenseBtn').click();
    });

    function renderChecklist() {
        trip = getTrip();
        var items = trip.checklist || [];
        var container = document.getElementById('checklistItems');
        container.innerHTML = '';

        items.forEach(function(item, idx) {
            var el = document.createElement('div');
            el.className = 'checklist-item' + (item.done ? ' checklist-item--done' : '');

            el.innerHTML =
                '<div class="checklist-item__checkbox">' + (item.done ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>' +
                '<span class="checklist-item__text">' + escapeHTML(item.text) + '</span>' +
                '<button class="checklist-item__delete" data-idx="' + idx + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

            el.addEventListener('click', function(e) {
                if (e.target.classList.contains('checklist-item__delete')) return;
                trip = getTrip();
                trip.checklist[idx].done = !trip.checklist[idx].done;
                saveTrip(trip);
                renderChecklist();
            });

            container.appendChild(el);
        });

        container.querySelectorAll('.checklist-item__delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var i = Number(this.dataset.idx);
                trip = getTrip();
                trip.checklist.splice(i, 1);
                saveTrip(trip);
                renderChecklist();
            });
        });

        var progress = document.getElementById('checklistProgress');
        if (items.length === 0) {
            progress.textContent = '';
        } else {
            var done = items.filter(function(i) { return i.done; }).length;
            progress.textContent = done + ' / ' + items.length + ' вещей собрано';
        }
    }

    renderChecklist();

    function addChecklistItem() {
        var input = document.getElementById('checklistInput');
        var text = input.value.trim();
        if (!text) return;
        trip = getTrip();
        if (!trip.checklist) trip.checklist = [];
        trip.checklist.push({ text: text, done: false });
        saveTrip(trip);
        input.value = '';
        renderChecklist();
    }

    document.getElementById('addChecklistBtn').addEventListener('click', addChecklistItem);
    document.getElementById('checklistInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addChecklistItem();
    });

    var notesArea = document.getElementById('tripNotes');
    var savedLabel = document.getElementById('notesSaved');
    var saveTimeout = null;

    trip = getTrip();
    notesArea.value = trip.notes || '';

    notesArea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        savedLabel.classList.remove('trip-notes__saved--visible');
        saveTimeout = setTimeout(function() {
            trip = getTrip();
            trip.notes = notesArea.value;
            saveTrip(trip);
            savedLabel.textContent = 'Сохранено ✓';
            savedLabel.classList.add('trip-notes__saved--visible');
            setTimeout(function() {
                savedLabel.classList.remove('trip-notes__saved--visible');
            }, 2000);
        }, 800);
    });

});
