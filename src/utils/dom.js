export function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str ?? '')));
    return div.innerHTML;
}

export function byId(id) {
    return document.getElementById(id);
}

// Блокирует прокрутку страницы, пока открыт хотя бы один оверлей
// (модальное окно или мобильное меню). Идемпотентна — её можно
// безопасно вызывать после любого открытия/закрытия.
export function syncScrollLock() {
    const locked = Boolean(document.querySelector('.modal-overlay--visible, .nav--open'));
    // Блокируем прокрутку и на <html>, и на <body>: на мобильном вьюпорте
    // скроллится корневой элемент, и overflow:hidden только на body его не держит.
    document.documentElement.classList.toggle('no-scroll', locked);
    document.body.classList.toggle('no-scroll', locked);
}
