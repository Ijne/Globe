document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector(".nav");
    const navButtons = document.querySelectorAll(".nav__button")
    const burgerButton = document.createElement('button');
    burgerButton.classList.add('burger-button');
    burgerButton.innerHTML = '☰';
    nav.prepend(burgerButton);
    console.log(nav, burgerButton);

    function checkMenuWidth() {
        if (screen.width <= 800) {
            console.log(screen.width);
            
            navButtons.forEach(button => {
                button.style.display = "none";
            });

            burgerButton.style.display = "block";

            console.log(nav);
        }
        else {
            navButtons.forEach(button => {
                button.style.display = "block";
            });
            burgerButton.style.display = "none";
        }
    }

    checkMenuWidth();
    window.addEventListener("resize", function() {
        checkMenuWidth();
    })
});