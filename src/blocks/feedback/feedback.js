export class FeedbackTabs {
    constructor(buttonSelector = '.feedback-table-element', reviewSelector = '.feedback-review') {
        this.buttons = document.querySelectorAll(buttonSelector);
        this.reviews = document.querySelectorAll(reviewSelector);
    }

    init() {
        this.buttons.forEach((button) => {
            button.addEventListener('click', () => this.activate(button.id));
        });
    }

    activate(id) {
        this.buttons.forEach((button) => {
            button.classList.toggle('feedback-table-element--active', button.id === id);
        });

        this.reviews.forEach((review) => {
            review.classList.toggle('feedback-review--active', review.id === id);
        });
    }
}
