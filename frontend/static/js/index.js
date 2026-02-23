document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector(".nav");
    const navButtons = document.querySelectorAll(".nav__button")

    // Burger button
    const burgerButton = document.createElement("button");
    burgerButton.classList.add("burger-button");
    burgerButton.classList.add("burger-button--open");
    burgerButton.innerHTML = "☰";
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

    // Feedback table buttons
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
});