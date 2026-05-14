export const CURRENCY_OPTIONS = ['USD', 'EUR', 'RUB', 'GBP'];

export function normalizeCurrency(code) {
    return CURRENCY_OPTIONS.includes(code) ? code : 'USD';
}

export function formatCurrency(value, currency = 'USD') {
    const normalized = normalizeCurrency(currency);
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: normalized,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}
