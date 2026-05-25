/**
 * Inputs dinâmicos para "Especificar divisões individualmente".
 * Cria/destrói os campos conforme o checkbox e a quantidade de vãos.
 */

import { $ } from '../utils/dom.js';
import { state, resetSpecifiedSegments } from '../state.js';

/**
 * @param {() => void} recalcularSeVisivel  Callback que dispara o cálculo se o preview já está visível.
 */
export function generateDynamicSegmentInputs(recalcularSeVisivel) {
    const container = $('segmentInputContainer');
    const checkbox = $('specifySegments');
    const numVaosH = parseInt($('vaosHorizontais').value) || 1;
    const numVaosV = parseInt($('vaosVerticais').value) || 1;

    if (!checkbox.checked || (numVaosH <= 1 && numVaosV <= 1)) {
        container.style.display = 'none';
        container.innerHTML = '';
        resetSpecifiedSegments();
        updateSegmentInputWarning('');
        if ($('captureContainer').style.display !== 'none') recalcularSeVisivel();
        return;
    }

    container.style.display = 'block';
    container.innerHTML =
        `<h3>Tamanhos Específicos (mm)</h3>` +
        `<p class="segment-input-warning" id="segmentInputWarning"></p>`;

    if (numVaosH > 1) {
        let html = '<div class="dynamic-input-group"><label>Larguras Vãos Horizontais:</label><div class="dynamic-inputs">';
        for (let j = 0; j < numVaosH; j++) {
            html += `<input type="number" min="0.1" step="0.1" data-dimension="width" data-index="${j}">`;
        }
        html += '</div></div>';
        container.innerHTML += html;
    }

    if (numVaosV > 1) {
        let html = '<div class="dynamic-input-group"><label>Alturas Vãos Verticais:</label><div class="dynamic-inputs">';
        for (let i = 0; i < numVaosV; i++) {
            html += `<input type="number" min="0.1" step="0.1" data-dimension="height" data-index="${i}">`;
        }
        html += '</div></div>';
        container.innerHTML += html;
    }

    container.querySelectorAll('input[type="number"]')
        .forEach((input) => input.addEventListener('input', handleDynamicInputChange));

    populateDynamicInputsWithCalculatedValues();
    if ($('captureContainer').style.display !== 'none') recalcularSeVisivel();
}

function handleDynamicInputChange(event) {
    const input = event.target;
    const dim = input.dataset.dimension;
    const idx = parseInt(input.dataset.index);
    const value = parseFloat(input.value) || 0;
    if (dim === 'width') state.specifiedSegmentWidths[idx] = value;
    else if (dim === 'height') state.specifiedSegmentHeights[idx] = value;
}

function populateDynamicInputsWithCalculatedValues() {
    const numVaosH = parseInt($('vaosHorizontais').value) || 1;
    const numVaosV = parseInt($('vaosVerticais').value) || 1;
    const largura = parseFloat($('largura').value) || 0;
    const altura = parseFloat($('altura').value) || 0;
    const larguraSeg = numVaosH > 0 ? largura / numVaosH : 0;
    const alturaSeg = numVaosV > 0 ? altura / numVaosV : 0;

    const arraysValidos =
        state.specifiedSegmentWidths.length === numVaosH &&
        state.specifiedSegmentHeights.length === numVaosV &&
        state.specifiedSegmentWidths.every((v) => typeof v === 'number') &&
        state.specifiedSegmentHeights.every((v) => typeof v === 'number');

    if (!arraysValidos) {
        state.specifiedSegmentWidths = Array(numVaosH).fill(larguraSeg);
        state.specifiedSegmentHeights = Array(numVaosV).fill(alturaSeg);
    }

    document.querySelectorAll('#segmentInputContainer input[data-dimension="width"]')
        .forEach((inp, idx) => {
            const val = state.specifiedSegmentWidths[idx];
            inp.value = (val >= 0 && !isNaN(val)) ? val.toFixed(2) : '';
            state.specifiedSegmentWidths[idx] = parseFloat(inp.value) || 0;
        });
    document.querySelectorAll('#segmentInputContainer input[data-dimension="height"]')
        .forEach((inp, idx) => {
            const val = state.specifiedSegmentHeights[idx];
            inp.value = (val >= 0 && !isNaN(val)) ? val.toFixed(2) : '';
            state.specifiedSegmentHeights[idx] = parseFloat(inp.value) || 0;
        });
}

export function updateSegmentInputWarning(message) {
    const el = document.getElementById('segmentInputWarning');
    if (el) el.textContent = message;
}
