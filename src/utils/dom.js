export function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str ?? '')));
    return div.innerHTML;
}

export function byId(id) {
    return document.getElementById(id);
}
