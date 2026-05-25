/**
 * Formata um número para exibição: inteiro se for inteiro, senão 1 casa decimal.
 */
export function fmtNum(v) {
    if (typeof v !== 'number' || isNaN(v)) return String(v);
    return Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : v.toFixed(1);
}

/**
 * Formata para 2 casas decimais (usado em medidas de barras).
 */
export function fmt2(v) {
    return (typeof v === 'number' && !isNaN(v)) ? v.toFixed(2) : '0.00';
}
