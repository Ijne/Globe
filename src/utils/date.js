export function formatDateRu(dateStr) {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function tripDaysCount(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
}
