/**
 * Renderiza o painel "Cálculo" — mostra cada subtração e divisão passo a passo,
 * a partir do objeto `breakdown` produzido pelas calculadoras.
 *
 * Estrutura esperada de `breakdown`:
 *   {
 *     calculadora: string,
 *     largura: { eixo, steps: [{op, label, valor, total?}], divisao: {modo, segmentos:[]} },
 *     altura:  { ...mesmo formato... },
 *     conectores: { formula: string, total: number }
 *   }
 */

import { fmtNum, fmt2 } from '../utils/format.js';

export function renderBreakdownHTML(breakdown) {
    if (!breakdown) return '';
    return (
        `<div class="breakdown-panel">` +
            `<h3>Cálculo — ${escapeHtml(breakdown.calculadora)}</h3>` +
            renderDimensao(breakdown.largura) +
            renderDimensao(breakdown.altura) +
            renderConectores(breakdown.conectores) +
        `</div>`
    );
}

function renderDimensao(dim) {
    if (!dim) return '';
    const linhas = dim.steps.map((s) => {
        const cls = s.total ? 'breakdown-row total' : 'breakdown-row';
        return (
            `<div class="${cls}">` +
                `<span class="op">${s.op || ''}</span>` +
                `<span class="label">${escapeHtml(s.label)}</span>` +
                `<span class="value">${fmtNum(s.valor)} mm</span>` +
            `</div>`
        );
    }).join('');

    const segs = (dim.divisao?.segmentos || [])
        .map((s) => `Vão ${s.idx}: <strong>${fmt2(s.real)} mm</strong>${
            s.especificado !== undefined ? ` (especificado ${fmt2(s.especificado)})` : ''
        }`)
        .join(' &nbsp;·&nbsp; ');

    return (
        `<div class="breakdown-group">` +
            `<h4>${escapeHtml(dim.eixo)}</h4>` +
            linhas +
            (dim.divisao
                ? `<div class="breakdown-row"><span class="label">${escapeHtml(dim.divisao.modo)}</span></div>` +
                  (segs ? `<div class="breakdown-row"><span class="label">${segs}</span></div>` : '')
                : '') +
        `</div>`
    );
}

function renderConectores(c) {
    if (!c) return '';
    return (
        `<div class="breakdown-group">` +
            `<h4>Conectores</h4>` +
            `<div class="breakdown-row">` +
                `<span class="label">${escapeHtml(c.formula)}</span>` +
                `<span class="value">${c.total} un</span>` +
            `</div>` +
        `</div>`
    );
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
