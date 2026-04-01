document.addEventListener('DOMContentLoaded', function() {

    var currentUser = JSON.parse(localStorage.getItem('globe_current_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('navUsername').textContent = currentUser.name;
    document.getElementById('greeting').textContent = 'С возвращением, ' + currentUser.name + '!';

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('globe_current_user');
        window.location.href = 'index.html';
    });

    function getTrips() {
        return JSON.parse(localStorage.getItem('globe_trips_' + currentUser.email)) || [];
    }

    function saveTrips(trips) {
        localStorage.setItem('globe_trips_' + currentUser.email, JSON.stringify(trips));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function renderTrips() {
        var trips = getTrips();
        var grid = document.getElementById('tripsGrid');
        var empty = document.getElementById('tripsEmpty');

        grid.innerHTML = '';

        if (trips.length === 0) {
            empty.classList.add('trips-empty--visible');
            return;
        }

        empty.classList.remove('trips-empty--visible');

        trips.forEach(function(trip) {
            var card = document.createElement('div');
            card.className = 'trip-card';

            var budgetHTML = trip.budget
                ? '<div class="trip-card__budget">Бюджет: $' + Number(trip.budget).toLocaleString() + '</div>'
                : '';

            card.innerHTML =
                '<div class="trip-card__header">' +
                    '<div class="trip-card__destination">' + escapeHTML(trip.destination) + '</div>' +
                    '<button class="trip-card__delete" data-id="' + trip.id + '" title="Удалить поездку"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                '</div>' +
                '<div class="trip-card__name">' + escapeHTML(trip.name) + '</div>' +
                '<div class="trip-card__dates">' + formatDate(trip.startDate) + ' — ' + formatDate(trip.endDate) + '</div>' +
                budgetHTML +
                '<button class="login-button trip-card__open" data-id="' + trip.id + '">Открыть →</button>';

            grid.appendChild(card);
        });

        grid.querySelectorAll('.trip-card__delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openDeleteModal(this.dataset.id);
            });
        });

        grid.querySelectorAll('.trip-card__open').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.location.href = 'trip.html?id=' + this.dataset.id;
            });
        });
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    renderTrips();

    document.getElementById('addTripBtnEmpty').addEventListener('click', openNewTripModal);

    var newTripModal = document.getElementById('newTripModal');

    function openNewTripModal() {
        newTripModal.classList.add('modal-overlay--visible');
    }

    function closeNewTripModal() {
        newTripModal.classList.remove('modal-overlay--visible');
        document.getElementById('newTripForm').reset();
        document.getElementById('newTripError').textContent = '';
    }

    document.getElementById('addTripBtn').addEventListener('click', openNewTripModal);
    document.getElementById('closeTripModal').addEventListener('click', closeNewTripModal);
    newTripModal.addEventListener('click', function(e) {
        if (e.target === newTripModal) closeNewTripModal();
    });

    document.getElementById('newTripForm').addEventListener('submit', function(e) {
        e.preventDefault();

        var name = document.getElementById('tripName').value.trim();
        var destination = document.getElementById('tripDestination').value.trim();
        var startDate = document.getElementById('tripStartDate').value;
        var endDate = document.getElementById('tripEndDate').value;
        var budget = document.getElementById('tripBudget').value;
        var error = document.getElementById('newTripError');

        if (startDate && endDate && endDate < startDate) {
            error.textContent = 'Дата окончания должна быть позже даты начала';
            return;
        }

        error.textContent = '';

        var trips = getTrips();
        var newTrip = {
            id: Date.now().toString(),
            name: name,
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            budget: budget,
            checklist: [],
            notes: ''
        };
        trips.push(newTrip);
        saveTrips(trips);
        renderTrips();
        closeNewTripModal();
    });

    var deleteModal = document.getElementById('deleteModal');
    var tripToDelete = null;

    function openDeleteModal(id) {
        tripToDelete = id;
        deleteModal.classList.add('modal-overlay--visible');
    }

    function closeDeleteModal() {
        tripToDelete = null;
        deleteModal.classList.remove('modal-overlay--visible');
    }

    document.getElementById('deleteConfirmBtn').addEventListener('click', function() {
        if (!tripToDelete) return;
        var trips = getTrips().filter(function(t) { return t.id !== tripToDelete; });
        saveTrips(trips);
        renderTrips();
        closeDeleteModal();
    });

    document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) closeDeleteModal();
    });

});
