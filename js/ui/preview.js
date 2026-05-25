/**
 * Renderização DOM da peça — preview principal e mini-preview do pedido.
 * Função genérica `desenharPecaGenerico` é parametrizada por escalas/margens
 * para servir aos dois casos.
 */

import { createDiv, createDimensionLabel } from '../utils/dom.js';

// Margens para cotas no preview principal e no mini
const TOTAL_LABEL_MARGIN = 30;
const TOTAL_LABEL_MARGIN_HORIZONTAL = 15;
const SEGMENT_LABEL_MARGIN = 8;
const MINI_TOTAL_LABEL_MARGIN = 25;
const MINI_TOTAL_LABEL_MARGIN_HORIZONTAL = 12;
const MINI_SEGMENT_LABEL_MARGIN = 3;

/**
 * Limpa o preview principal e oculta o container de captura.
 */
export function limparPreview() {
    const peca = document.getElementById('preview-peca');
    const previewDiv = document.querySelector('.preview');
    peca.innerHTML = '';
    peca.style.width = '0px';
    peca.style.height = '0px';
    previewDiv.querySelectorAll('.dimension-label').forEach((label) => label.remove());
    document.getElementById('captureContainer').style.display = 'none';
    document.getElementById('previewTitleAmbiente').textContent = '';
}

/**
 * Desenha o preview principal usando o container .preview e #preview-peca.
 */
export function desenharPreview(params) {
    const container = document.querySelector('.preview');
    const peca = document.getElementById('preview-peca');
    desenharPecaGenerico(
        container, peca, params, 450,
        TOTAL_LABEL_MARGIN, TOTAL_LABEL_MARGIN_HORIZONTAL, SEGMENT_LABEL_MARGIN,
    );
}

/**
 * Desenha um mini-preview dentro do container informado. Cria a <div .peca> dentro.
 */
export function desenharMiniPreview(targetContainer, params) {
    const peca = document.createElement('div');
    peca.classList.add('peca');
    targetContainer.innerHTML = '';
    targetContainer.appendChild(peca);
    desenharPecaGenerico(
        targetContainer, peca, params, 320,
        MINI_TOTAL_LABEL_MARGIN, MINI_TOTAL_LABEL_MARGIN_HORIZONTAL, MINI_SEGMENT_LABEL_MARGIN,
    );
}

function desenharPecaGenerico(
    containerElement, pecaElement, params, maxDimVisual,
    cotaTotalMargemVertical, cotaTotalMargemHorizontal, cotaSegmentoMargem,
) {
    const {
        larguraTotal, alturaTotal,
        numVaosHorizontais, numVaosVerticais,
        numBarrasVerticais, numBarrasHorizontais,
        larguraPinazio,
        realSegmentWidths, realSegmentHeights,
        specifySegmentsChecked, specifiedSegmentWidths, specifiedSegmentHeights,
        modelo, direcaoInteira,
    } = params;
    const isNovo = modelo === 'novo';

    pecaElement.innerHTML = '';
    containerElement.querySelectorAll('.dimension-label').forEach((l) => l.remove());

    const minDimVisual = maxDimVisual * 0.1;
    let scale = 0;

    if (larguraTotal > 0 && alturaTotal > 0) {
        scale = Math.min(maxDimVisual / larguraTotal, maxDimVisual / alturaTotal);
        const sWT = larguraTotal * scale;
        const sHT = alturaTotal * scale;
        if (sWT < minDimVisual && larguraTotal > 0) scale = Math.max(scale, minDimVisual / larguraTotal);
        if (sHT < minDimVisual && alturaTotal > 0) scale = Math.max(scale, minDimVisual / alturaTotal);
        const fSW = larguraTotal * scale;
        const fSH = alturaTotal * scale;
        if (Math.max(fSW, fSH) > maxDimVisual) scale = maxDimVisual / Math.max(larguraTotal, alturaTotal);
    } else {
        return;
    }

    const scaledLarguraTotal = larguraTotal * scale;
    const scaledAlturaTotal = alturaTotal * scale;
    const scaledLarguraPinazio = Math.max(0.5, larguraPinazio * scale);

    pecaElement.style.width = scaledLarguraTotal + 'px';
    pecaElement.style.height = scaledAlturaTotal + 'px';
    pecaElement.offsetWidth; // força reflow

    const larguraRealSum = realSegmentWidths.reduce((s, w) => s + w, 0);
    const alturaRealSum = realSegmentHeights.reduce((s, h) => s + h, 0);
    const visualEspacoW = Math.max(0, scaledLarguraTotal - numBarrasVerticais * scaledLarguraPinazio);
    const visualEspacoH = Math.max(0, scaledAlturaTotal - numBarrasHorizontais * scaledLarguraPinazio);
    const visualW = realSegmentWidths.map((w) => Math.max(0, (w / (larguraRealSum || larguraTotal || 1)) * visualEspacoW));
    const visualH = realSegmentHeights.map((h) => Math.max(0, (h / (alturaRealSum || alturaTotal || 1)) * visualEspacoH));

    if ((numVaosHorizontais > 0 || numVaosVerticais > 0) && scaledLarguraTotal >= 1 && scaledAlturaTotal >= 1) {
        if (visualW.some((w) => w < -0.01) || visualH.some((h) => h < -0.01)) return;

        // Vãos
        let cTSD = 0;
        for (let i = 0; i < numVaosVerticais; i++) {
            let cLSD = 0;
            for (let j = 0; j < numVaosHorizontais; j++) {
                if (visualW[j] > 0 && visualH[i] > 0) {
                    createDiv(pecaElement, ['divisao-segmento'], cLSD, cTSD, visualW[j], visualH[i]);
                }
                cLSD += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0);
            }
            cTSD += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0);
        }

        if (isNovo && direcaoInteira === 'vertical') {
            // Pinázio Novo: verticais inteiras (atravessam toda a altura),
            // horizontais conectadas (em pedaços entre as verticais).

            // Horizontais primeiro (ficam por baixo das inteiras)
            if (numBarrasHorizontais > 0) {
                let bT = 0;
                for (let i = 0; i < numBarrasHorizontais; i++) {
                    bT += visualH[i];
                    let bL = 0;
                    for (let j = 0; j < numVaosHorizontais; j++) {
                        if (visualW[j] > 0 && scaledLarguraPinazio > 0) {
                            createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-horizontal-peca'], bL, bT, visualW[j], scaledLarguraPinazio);
                        }
                        bL += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0);
                    }
                    bT += scaledLarguraPinazio;
                }
            }
            // Verticais como blocos contínuos cobrindo toda a altura — z-index maior
            if (numBarrasVerticais > 0) {
                let bL = 0;
                for (let j = 0; j < numBarrasVerticais; j++) {
                    bL += visualW[j];
                    createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-vertical-peca', 'pinazio-inteira'], bL, 0, scaledLarguraPinazio, scaledAlturaTotal);
                    bL += scaledLarguraPinazio;
                }
            }
        } else {
            // Pinázio Antigo — comportamento original.

            // Barras verticais (segmentadas pelas horizontais)
            if (numBarrasVerticais > 0) {
                let bL = 0;
                for (let j = 0; j < numBarrasVerticais; j++) {
                    bL += visualW[j];
                    let bT = 0;
                    for (let i = 0; i < numVaosVerticais; i++) {
                        if (visualH[i] > 0 && scaledLarguraPinazio > 0) {
                            createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-vertical-peca'], bL, bT, scaledLarguraPinazio, visualH[i]);
                        }
                        bT += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0);
                    }
                    bL += scaledLarguraPinazio;
                }
            }

            // Barras horizontais (segmentadas pelas verticais)
            if (numBarrasHorizontais > 0) {
                let bT = 0;
                for (let i = 0; i < numBarrasHorizontais; i++) {
                    bT += visualH[i];
                    let bL = 0;
                    for (let j = 0; j < numVaosHorizontais; j++) {
                        if (visualW[j] > 0 && scaledLarguraPinazio > 0) {
                            createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-horizontal-peca'], bL, bT, visualW[j], scaledLarguraPinazio);
                        }
                        bL += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0);
                    }
                    bT += scaledLarguraPinazio;
                }
            }

            // Conectores (X) nas interseções
            if (numBarrasVerticais > 0 && numBarrasHorizontais > 0 && scaledLarguraPinazio > 0) {
                let cL = 0;
                for (let i = 0; i < numBarrasVerticais; i++) {
                    cL += visualW[i];
                    let cT = 0;
                    for (let j = 0; j < numBarrasHorizontais; j++) {
                        cT += visualH[j];
                        createDiv(pecaElement, ['conector-visual'], cL, cT, scaledLarguraPinazio, scaledLarguraPinazio);
                        cT += scaledLarguraPinazio;
                    }
                    cL += scaledLarguraPinazio;
                }
            }
        }
    }

    // Cotas — após reflow
    requestAnimationFrame(() => {
        if (!document.body.contains(containerElement) || !document.body.contains(pecaElement)) return;
        const cR = containerElement.getBoundingClientRect();
        const pR = pecaElement.getBoundingClientRect();
        const pOX = pR.left - cR.left;
        const pOY = pR.top - cR.top;

        createDimensionLabel(containerElement, `${larguraTotal.toFixed(1)}`,
            pOX + scaledLarguraTotal / 2, pOY - cotaTotalMargemVertical, true, false);
        createDimensionLabel(containerElement, `${alturaTotal.toFixed(1)}`,
            pOX + scaledLarguraTotal + cotaTotalMargemHorizontal, pOY + scaledAlturaTotal / 2, true, true);

        if ((numVaosHorizontais > 0 || numVaosVerticais > 0) && scaledLarguraTotal >= 1 && scaledAlturaTotal >= 1) {
            let cTS = 0;
            for (let i = 0; i < numVaosVerticais; i++) {
                let cLS = 0;
                for (let j = 0; j < numVaosHorizontais; j++) {
                    if (i === numVaosVerticais - 1 && numVaosHorizontais > 0) {
                        // Cota exibida na peça é nominal (largura/numVaos) — dá uma noção
                        // simétrica da divisão. Os tamanhos reais com descontos / sobreposição
                        // aparecem na tabela de resultados e no breakdown.
                        const wS = specifySegmentsChecked && specifiedSegmentWidths[j] !== undefined
                            ? specifiedSegmentWidths[j]
                            : (larguraTotal / numVaosHorizontais);
                        if (!isNaN(wS)) {
                            createDimensionLabel(containerElement, `${wS.toFixed(1)}`,
                                pOX + cLS + visualW[j] / 2, pOY + scaledAlturaTotal + cotaSegmentoMargem, false, false);
                        }
                    }
                    if (j === 0 && numVaosVerticais > 0) {
                        const hS = specifySegmentsChecked && specifiedSegmentHeights[i] !== undefined
                            ? specifiedSegmentHeights[i]
                            : (alturaTotal / numVaosVerticais);
                        if (!isNaN(hS)) {
                            createDimensionLabel(containerElement, `${hS.toFixed(1)}`,
                                pOX - cotaSegmentoMargem, pOY + cTS + visualH[i] / 2, false, true);
                        }
                    }
                    cLS += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0);
                }
                cTS += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0);
            }
        }
    });
}
