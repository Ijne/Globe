document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector(".nav");
    const navButtons = document.querySelectorAll(".nav__button")
    const burgerButton = document.createElement('button');
    burgerButton.classList.add('burger-button');
    burgerButton.classList.add('burger-button--open');
    burgerButton.innerHTML = '☰';
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