/**
 * Renderiza o painel "Resultados" (tabela de barras + conectores + OBS)
 * e exibe mensagens de erro.
 */

import { $ } from '../utils/dom.js';
import { renderBreakdownHTML } from './breakdown.js';
import { updateSegmentInputWarning } from './segmentInputs.js';

export function showError(message) {
    $('resultado').innerHTML = `<p style="color: var(--accent); font-weight: 600;">${escapeHtml(message)}</p>`;
    if ($('specifySegments').checked) updateSegmentInputWarning(message);
}

/**
 * Renderiza a tabela de resultados + o painel de breakdown.
 */
export function renderResultados({
    resultado,        // retorno da calculadora
    quantidade,
    obsTexto,
}) {
    $('resultadoQuantidade').textContent = `Quantidade de peças: ${quantidade}`;

    const temCategoria = [...(resultado.barrasVerticais || []), ...(resultado.barrasHorizontais || [])]
        .some((b) => b.categoria);

    let html = `<h3 style="font-weight:600; margin-top:0.5rem; color: var(--primary-mid);">Resumo das barras:</h3>`;
    html += `<table class="results-table"><thead><tr><th>Tipo</th>${temCategoria ? '<th>Categoria</th>' : ''}<th>Medida (mm)</th><th>Qtd Total</th></tr></thead><tbody>`;
    resultado.barrasVerticais.forEach((b) => {
        const cat = b.categoria ? `<td>${capitalize(b.categoria)}</td>` : '';
        html += `<tr><td>Vertical</td>${temCategoria ? cat || '<td>—</td>' : ''}<td>${b.medida}</td><td>${b.quantidade}</td></tr>`;
    });
    resultado.barrasHorizontais.forEach((b) => {
        const cat = b.categoria ? `<td>${capitalize(b.categoria)}</td>` : '';
        html += `<tr><td>Horizontal</td>${temCategoria ? cat || '<td>—</td>' : ''}<td>${b.medida}</td><td>${b.quantidade}</td></tr>`;
    });
    html += `</tbody></table>`;

    if (resultado.conectores > 0) {
        html += `<p style="font-weight:600; margin-top:0.75rem; color: var(--primary-mid);">Conectores:</p>${resultado.conectores} unidades`;
    }

    if (obsTexto) {
        html += `<div class="obs-display" style="margin-top:0.75rem;"><strong>OBS:</strong> ${escapeHtml(obsTexto)}</div>`;
    }

    html += renderBreakdownHTML(resultado.breakdown);

    $('resultado').innerHTML = html;
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
