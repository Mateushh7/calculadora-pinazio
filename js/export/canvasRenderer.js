/**
 * Renderiza a peça + painel de resultados em um <canvas>, usado para download de imagem.
 * Preserva o layout original (cotas + painel direito).
 */

import { fmtNum } from '../utils/format.js';
import { roundRect } from '../utils/dom.js';

/**
 * Gera um canvas com o desenho da peça e o painel "Resultados" à direita.
 */
export function gerarCanvasPeca(params, resumo, ambienteNome, corCamaraNome, corPinazioNome) {
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

    const maxDim = 500;
    const cotaTotal = 36;
    const cotaSeg = 10;
    const DPR = 2;

    let scale = Math.min(maxDim / larguraTotal, maxDim / alturaTotal);
    const sW = larguraTotal * scale;
    const sH = alturaTotal * scale;
    if (Math.max(sW, sH) > maxDim) scale = maxDim / Math.max(larguraTotal, alturaTotal);

    const scaledW = larguraTotal * scale;
    const scaledH = alturaTotal * scale;
    const scaledLP = Math.max(0.5, larguraPinazio * scale);

    const hasSegH = numVaosHorizontais > 1;
    const hasSegV = numVaosVerticais > 1;

    // ── Painel Resultados ──────────────────────────────────────────────
    const panelW = 320;
    const panelPad = 14;
    const lineH = 22;
    const titleH = 28;
    const barras = (resumo.barrasVerticais || []).concat(resumo.barrasHorizontais || []);
    const panelLines = [];
    panelLines.push({ type: 'title', text: 'Resultados' });
    if (resumo.tipoLabel) {
        panelLines.push({ type: 'label', text: `Tipo: ${resumo.tipoLabel}` });
    }
    panelLines.push({ type: 'label', text: `Quantidade: ${resumo.quantidade || 1} peça(s)` });
    if (barras.length > 0) {
        panelLines.push({ type: 'section', text: 'Barras:' });
        panelLines.push({ type: 'header', cols: ['Tipo', 'Medida', 'Qtd'] });
        barras.forEach((b) => panelLines.push({ type: 'row', cols: [b.tipo, b.medida + ' mm', String(b.quantidade)] }));
    } else {
        panelLines.push({ type: 'label', text: 'Nenhuma barra.' });
    }
    if (resumo.conectores > 0) {
        panelLines.push({ type: 'section', text: 'Conectores:' });
        panelLines.push({ type: 'label', text: `${resumo.conectores} unidades` });
    }
    panelLines.push({ type: 'section', text: 'Cores:' });
    panelLines.push({ type: 'label', text: `Câmara: ${corCamaraNome}` });
    panelLines.push({ type: 'label', text: `Pinázio: ${corPinazioNome}` });
    if (resumo.obs) {
        panelLines.push({ type: 'section', text: 'OBS:' });
        panelLines.push({ type: 'obs', text: resumo.obs });
    }

    // Altura extra para o diagrama de furos (quando aplicável).
    const FUROS_DIAG_HEIGHT = resumo.furos ? 200 : 0;

    const panelContentH = panelLines.reduce(
        (a, l) => a + (l.type === 'title' ? titleH : lineH),
        panelPad * 2,
    ) + FUROS_DIAG_HEIGHT;

    const marginLeft = cotaTotal + (hasSegV ? 36 : 10);
    const marginTop = cotaTotal + 16;
    const gapPanel = 50;
    const marginRight = gapPanel + panelW + 16;
    const marginBottom = cotaTotal + (hasSegH ? 26 : 10);

    const cvW = marginLeft + scaledW + marginRight;
    const cvH = Math.max(marginTop + scaledH + marginBottom, marginTop + panelContentH + 14);

    const canvas = document.createElement('canvas');
    canvas.width = cvW * DPR;
    canvas.height = cvH * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    // Fundo geral
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, cvW, cvH);

    // Área do preview
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(marginLeft, marginTop, scaledW, scaledH);

    // Borda externa
    ctx.strokeStyle = '#3a5a6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(marginLeft, marginTop, scaledW, scaledH);

    // ── Cálculos geométricos para vãos ─────────────────────────────────
    const larguraRealSum = realSegmentWidths.reduce((s, w) => s + w, 0);
    const alturaRealSum = realSegmentHeights.reduce((s, h) => s + h, 0);
    const visEspacoW = Math.max(0, scaledW - numBarrasVerticais * scaledLP);
    const visEspacoH = Math.max(0, scaledH - numBarrasHorizontais * scaledLP);
    const visW = realSegmentWidths.map((w) => Math.max(0, (w / (larguraRealSum || larguraTotal || 1)) * visEspacoW));
    const visH = realSegmentHeights.map((h) => Math.max(0, (h / (alturaRealSum || alturaTotal || 1)) * visEspacoH));

    const ox = marginLeft;
    const oy = marginTop;

    // Vãos
    ctx.fillStyle = 'rgba(136, 198, 219, 0.7)';
    let cTSD = 0;
    for (let i = 0; i < numVaosVerticais; i++) {
        let cLSD = 0;
        for (let j = 0; j < numVaosHorizontais; j++) {
            if (visW[j] > 0 && visH[i] > 0) {
                ctx.fillRect(ox + cLSD, oy + cTSD, visW[j], visH[i]);
            }
            cLSD += visW[j] + (j < numBarrasVerticais ? scaledLP : 0);
        }
        cTSD += visH[i] + (i < numBarrasHorizontais ? scaledLP : 0);
    }

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#889ca4';
    ctx.lineWidth = 0.5;

    if (isNovo && direcaoInteira === 'vertical') {
        // Pinázio Novo: horizontais (conectadas) primeiro, depois verticais inteiras por cima.
        if (numBarrasHorizontais > 0) {
            let bT = 0;
            for (let i = 0; i < numBarrasHorizontais; i++) {
                bT += visH[i];
                let bL = 0;
                for (let j = 0; j < numVaosHorizontais; j++) {
                    if (visW[j] > 0 && scaledLP > 0) {
                        ctx.fillRect(ox + bL, oy + bT, visW[j], scaledLP);
                        ctx.strokeRect(ox + bL, oy + bT, visW[j], scaledLP);
                    }
                    bL += visW[j] + (j < numBarrasVerticais ? scaledLP : 0);
                }
                bT += scaledLP;
            }
        }
        if (numBarrasVerticais > 0) {
            let bL = 0;
            for (let j = 0; j < numBarrasVerticais; j++) {
                bL += visW[j];
                ctx.fillRect(ox + bL, oy, scaledLP, scaledH);
                ctx.strokeRect(ox + bL, oy, scaledLP, scaledH);
                bL += scaledLP;
            }
        }
    } else {
        // Pinázio Antigo — barras segmentadas + conectores X.
        if (numBarrasVerticais > 0) {
            let bL = 0;
            for (let j = 0; j < numBarrasVerticais; j++) {
                bL += visW[j];
                let bT = 0;
                for (let i = 0; i < numVaosVerticais; i++) {
                    if (visH[i] > 0 && scaledLP > 0) {
                        ctx.fillRect(ox + bL, oy + bT, scaledLP, visH[i]);
                        ctx.strokeRect(ox + bL, oy + bT, scaledLP, visH[i]);
                    }
                    bT += visH[i] + (i < numBarrasHorizontais ? scaledLP : 0);
                }
                bL += scaledLP;
            }
        }
        if (numBarrasHorizontais > 0) {
            let bT = 0;
            for (let i = 0; i < numBarrasHorizontais; i++) {
                bT += visH[i];
                let bL = 0;
                for (let j = 0; j < numVaosHorizontais; j++) {
                    if (visW[j] > 0 && scaledLP > 0) {
                        ctx.fillRect(ox + bL, oy + bT, visW[j], scaledLP);
                        ctx.strokeRect(ox + bL, oy + bT, visW[j], scaledLP);
                    }
                    bL += visW[j] + (j < numBarrasVerticais ? scaledLP : 0);
                }
                bT += scaledLP;
            }
        }
        if (numBarrasVerticais > 0 && numBarrasHorizontais > 0 && scaledLP > 0) {
            ctx.strokeStyle = '#889ca4';
            ctx.lineWidth = 1;
            let cL = 0;
            for (let i = 0; i < numBarrasVerticais; i++) {
                cL += visW[i];
                let cT = 0;
                for (let j = 0; j < numBarrasHorizontais; j++) {
                    cT += visH[j];
                    ctx.beginPath();
                    ctx.moveTo(ox + cL, oy + cT);
                    ctx.lineTo(ox + cL + scaledLP, oy + cT + scaledLP);
                    ctx.moveTo(ox + cL + scaledLP, oy + cT);
                    ctx.lineTo(ox + cL, oy + cT + scaledLP);
                    ctx.stroke();
                    cT += scaledLP;
                }
                cL += scaledLP;
            }
        }
    }

    // ── Cotas (apenas texto) ───────────────────────────────────────────
    const lc = '#3a5a6b';

    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = lc;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(fmtNum(larguraTotal), ox + scaledW / 2, oy - 5);

    ctx.save();
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = lc;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.translate(ox + scaledW + 18, oy + scaledH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(fmtNum(alturaTotal), 0, 0);
    ctx.restore();

    // Cotas dos vãos (valor nominal — largura/numVaos — para dar uma noção simétrica)
    if (hasSegH) {
        ctx.font = '12px sans-serif'; ctx.fillStyle = lc;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        let cLS = 0;
        for (let j = 0; j < numVaosHorizontais; j++) {
            const wS = specifySegmentsChecked && specifiedSegmentWidths[j] !== undefined
                ? specifiedSegmentWidths[j]
                : (larguraTotal / numVaosHorizontais);
            if (!isNaN(wS)) ctx.fillText(fmtNum(wS), ox + cLS + visW[j] / 2, oy + scaledH + cotaSeg);
            cLS += visW[j] + (j < numBarrasVerticais ? scaledLP : 0);
        }
    }

    if (hasSegV) {
        ctx.font = '12px sans-serif'; ctx.fillStyle = lc;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        let cTS = 0;
        for (let i = 0; i < numVaosVerticais; i++) {
            const hS = specifySegmentsChecked && specifiedSegmentHeights[i] !== undefined
                ? specifiedSegmentHeights[i]
                : (alturaTotal / numVaosVerticais);
            if (!isNaN(hS)) ctx.fillText(fmtNum(hS), ox - cotaSeg, oy + cTS + visH[i] / 2);
            cTS += visH[i] + (i < numBarrasHorizontais ? scaledLP : 0);
        }
    }

    // Título Ambiente
    ctx.font = 'bold 17px sans-serif'; ctx.fillStyle = '#3a5a6b';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Ambiente: ' + ambienteNome, marginLeft, marginTop / 2);

    // ── Painel Resultados (direita) ────────────────────────────────────
    const px = ox + scaledW + gapPanel;
    const py = oy;
    const panelH = Math.max(panelContentH, scaledH);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, px, py, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    roundRect(ctx, px, py, panelW, panelH, 6);
    ctx.stroke();

    let curY = py + panelPad;
    const colWs = [155, 105, 40];
    panelLines.forEach((line) => {
        const textX = px + panelPad;
        switch (line.type) {
            case 'title':
                ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#3a5a6b';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText(line.text, textX, curY);
                curY += titleH;
                ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(textX, curY - 6);
                ctx.lineTo(px + panelW - panelPad, curY - 6);
                ctx.stroke();
                break;
            case 'section':
                ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#3a5a6b';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText(line.text, textX, curY + 2);
                curY += lineH;
                break;
            case 'label':
                ctx.font = '13px sans-serif'; ctx.fillStyle = '#334155';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText(line.text, textX + 4, curY);
                curY += lineH;
                break;
            case 'header': {
                ctx.fillStyle = '#f1f5f9';
                ctx.fillRect(textX, curY - 1, panelW - panelPad * 2, lineH + 1);
                ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#64748b';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                let cx = textX + 4;
                line.cols.forEach((c, i) => { ctx.fillText(c, cx, curY + 3); cx += colWs[i]; });
                curY += lineH;
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(textX, curY); ctx.lineTo(px + panelW - panelPad, curY); ctx.stroke();
                break;
            }
            case 'obs': {
                const obsW = panelW - panelPad * 2;
                ctx.fillStyle = '#fefce8';
                ctx.fillRect(textX, curY - 1, obsW, lineH + 4);
                ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 0.5;
                ctx.strokeRect(textX, curY - 1, obsW, lineH + 4);
                ctx.font = '13px sans-serif'; ctx.fillStyle = '#334155';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText(line.text, textX + 4, curY + 2);
                curY += lineH + 6;
                break;
            }
            case 'row': {
                ctx.font = '13px sans-serif'; ctx.fillStyle = '#334155';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                let cx = textX + 4;
                line.cols.forEach((c, i) => { ctx.fillText(c, cx, curY + 3); cx += colWs[i]; });
                curY += lineH;
                ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(textX, curY); ctx.lineTo(px + panelW - panelPad, curY); ctx.stroke();
                break;
            }
        }
    });

    // ── Diagrama de furos (Pinázio Novo) ───────────────────────────────
    if (resumo.furos) {
        desenharFurosNoCanvas(ctx, px + panelPad, curY + 6, panelW - panelPad * 2, FUROS_DIAG_HEIGHT - 6, resumo.furos);
    }

    return canvas;
}

/**
 * Desenha o diagrama de furos (barra inteira vertical com marcadores e cotas)
 * dentro do retângulo (x, y, w, h) no canvas.
 */
function desenharFurosNoCanvas(ctx, x, y, w, h, furos) {
    const { comprimentoBarra, posicoes, quantidadeBarrasIguais } = furos;

    // Título
    const titulo = quantidadeBarrasIguais > 1
        ? `Furos nas ${quantidadeBarrasIguais} inteiras (todas iguais)`
        : 'Furos na barra inteira';
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#3a5a6b';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(titulo, x, y);

    const barW = 22;
    const barX = x + 6;
    const barTop = y + 22;
    const barBottom = y + h - 14;
    const barH = Math.max(60, barBottom - barTop);

    // Barra
    ctx.fillStyle = '#e8f5f7';
    ctx.fillRect(barX, barTop, barW, barH);
    ctx.strokeStyle = '#2C6E7A'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barTop, barW, barH);

    // Linha central (tracejada)
    const cx = barX + barW / 2;
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#9ecdd4'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, barTop); ctx.lineTo(cx, barTop + barH);
    ctx.stroke();
    ctx.restore();

    // "topo"
    ctx.font = '9px sans-serif'; ctx.fillStyle = '#4a7a87';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('topo', cx, barTop - 2);

    // Comprimento total
    ctx.textBaseline = 'top';
    ctx.fillText(`${comprimentoBarra.toFixed(2)} mm`, cx, barTop + barH + 3);

    // Furos
    posicoes.forEach((mm) => {
        const fy = barTop + (mm / comprimentoBarra) * barH;
        ctx.fillStyle = '#C63832';
        ctx.beginPath();
        ctx.arc(cx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a201d'; ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.strokeStyle = '#163A4A'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(barX + barW, fy);
        ctx.lineTo(barX + barW + 6, fy);
        ctx.stroke();

        ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#163A4A';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(`${mm.toFixed(2)} mm`, barX + barW + 8, fy);
    });
}
