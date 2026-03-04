document.addEventListener('DOMContentLoaded', function() {

    const currentUser = JSON.parse(localStorage.getItem('globe_current_user'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    const nav = document.querySelector(".nav");
    const navButtons = document.querySelectorAll(".nav__button")

    const burgerButton = document.createElement("button");
    burgerButton.classList.add("burger-button");
    burgerButton.classList.add("burger-button--open");
    burgerButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    burgerButton.addEventListener("click", function() {
        if (burgerButton.classList.contains("burger-button--open")) {
            nav.classList.add("nav--open")
            burgerButton.classList.remove("burger-button--open")
            burgerButton.classList.add("burger-button--close")
            showNavButtons();
        } else {
            nav.classList.remove("nav--open")
            burgerButton.classList.add("burger-button--open")
            burgerButton.classList.remove("burger-button--close")
            hideNavButtons();
        }
    });
    nav.prepend(burgerButton);

    const feedbackButtons = document.querySelectorAll(".feedback-table-element");
    const feedbackReviews = document.querySelectorAll(".feedback-review");
    feedbackButtons.forEach(button => {
        button.addEventListener("click", function() {
        feedbackButtons.forEach(btn => {
            btn.classList.remove("feedback-table-element--active");
            feedbackReviews.forEach(review => {
                if (review.id == btn.id) {
                    review.classList.remove("feedback-review--active")
                };
            });
        });
        
        feedbackReviews.forEach(review => {
            if (review.id == this.id) {
                review.classList.add("feedback-review--active")
            };
        });
        this.classList.add("feedback-table-element--active");
        });
    });

    function hideNavButtons() {
        navButtons.forEach(button => {
            button.style.display = "none";
        });
    };

    function showNavButtons() {
        navButtons.forEach(button => {
            button.style.display = "block";
        });
    };

    function checkMenuWidth() {
        if (screen.width <= 800) {
            hideNavButtons();

            burgerButton.style.display = "block";
        }
        else {
            showNavButtons();
            burgerButton.style.display = "none";
        }
    }

    checkMenuWidth();
    window.addEventListener("resize", function() {
        checkMenuWidth();
    })

    const authModal = document.getElementById('authModal');

    function openModal() {
        authModal.classList.add('modal-overlay--visible');
    }

    function closeModal() {
        authModal.classList.remove('modal-overlay--visible');
        document.getElementById('loginError').textContent = '';
        document.getElementById('registerError').textContent = '';
    }

    document.querySelectorAll('.login-button').forEach(function(btn) {
        btn.addEventListener('click', openModal);
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) closeModal();
    });

    document.getElementById('tabLogin').addEventListener('click', function() {
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('tabLogin').classList.add('modal-tab--active');
        document.getElementById('tabRegister').classList.remove('modal-tab--active');
    });

    document.getElementById('tabRegister').addEventListener('click', function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'flex';
        document.getElementById('tabRegister').classList.add('modal-tab--active');
        document.getElementById('tabLogin').classList.remove('modal-tab--active');
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const users = JSON.parse(localStorage.getItem('globe_users')) || [];
        const user = users.find(function(u) { return u.email === email && u.password === password; });
        if (!user) {
            document.getElementById('loginError').textContent = 'Invalid email or password';
            return;
        }
        localStorage.setItem('globe_current_user', JSON.stringify({ name: user.name, email: user.email }));
        window.location.href = 'dashboard.html';
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const users = JSON.parse(localStorage.getItem('globe_users')) || [];
        if (users.find(function(u) { return u.email === email; })) {
            document.getElementById('registerError').textContent = 'This email is already registered';
            return;
        }
        users.push({ name: name, email: email, password: password });
        localStorage.setItem('globe_users', JSON.stringify(users));
        localStorage.setItem('globe_current_user', JSON.stringify({ name: name, email: email }));
        window.location.href = 'dashboard.html';
    });

});