/**
 * Handlers de download — imagem PNG da peça atual e PDF do pedido completo.
 *
 * Depende globalmente de:
 *   - window.html2canvas (CDN no index.html)
 *   - window.jspdf       (CDN no index.html)
 */

import { $ } from '../utils/dom.js';
import { state } from '../state.js';
import { gerarCanvasPeca } from './canvasRenderer.js';

/**
 * Baixa a imagem PNG da peça atualmente calculada (preview + painel resultados).
 */
export function handleDownloadImage() {
    if (!state.lastCalculatedPieceSummary || !state.lastCalculatedPieceSummary.previewParams) {
        alert('Calcule uma peça antes de baixar a imagem.');
        return;
    }

    const summary = state.lastCalculatedPieceSummary;
    const pedidoNum = $('pedidoNumero').value.trim() || 'sN';
    const ambienteNome = $('ambienteNome').value.trim() || summary.ambiente || 'sA';
    const corCamara = summary.cores?.camaraNome || 'PRATA';
    const corPinazio = summary.cores?.pinazioNome || 'BRANCO';

    const resumo = {
        quantidade: parseInt($('quantidade').value) || 1,
        barrasVerticais: (summary.barrasVerticais || []).map((b) => ({ tipo: 'Vertical', medida: b.medida, quantidade: b.quantidade })),
        barrasHorizontais: (summary.barrasHorizontais || []).map((b) => ({ tipo: 'Horizontal', medida: b.medida, quantidade: b.quantidade })),
        conectores: summary.conectores || 0,
        obs: summary.obs || '',
    };

    const canvas = gerarCanvasPeca(summary.previewParams, resumo, summary.ambiente || ambienteNome, corCamara, corPinazio);
    const dataUrl = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${ambienteNome} - ${pedidoNum}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Gera um PDF com cada item do pedido em sequência, usando html2canvas para capturar
 * cada .pedido-peca-item como imagem.
 */
export async function handleDownloadPDF() {
    const { jsPDF } = window.jspdf;
    const pedidoNum = $('pedidoNumero').value.trim() || 'sP';
    const lista = $('pedidoPecasList');
    const items = lista.querySelectorAll('.pedido-peca-item');
    const btn = $('downloadPdfButton');

    if (items.length === 0) {
        alert('Nenhuma peça para gerar PDF.');
        return;
    }

    if (btn) {
        btn.textContent = 'Gerando...';
        btn.disabled = true;
    }

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const availW = pageW - margin * 2;
    let y = margin;

    const headerText = $('pedidoHeader').innerText;
    pdf.setFontSize(14);
    pdf.text(headerText, margin, y);
    y += 10;

    // Esconde temporariamente os botões de excluir para não aparecerem no PDF
    const deleteButtons = lista.querySelectorAll('.delete-button');
    deleteButtons.forEach((b) => { b.style.visibility = 'hidden'; });

    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                const canvas = await window.html2canvas(item, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: window.getComputedStyle(item).backgroundColor || '#ffffff',
                });
                const imgData = canvas.toDataURL('image/png');
                const scaleFactor = availW / canvas.width;
                const finalW = canvas.width * scaleFactor;
                const finalH = canvas.height * scaleFactor;

                if (y + finalH > pageH - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.addImage(imgData, 'PNG', margin, y, finalW, finalH);
                y += finalH + 5;
            } catch (e) {
                console.error(`Erro ao gerar item ${i + 1} do PDF:`, e);
            }
        }
    } finally {
        deleteButtons.forEach((b) => { b.style.visibility = 'visible'; });
        if (btn) {
            btn.textContent = '↓ Download PDF';
            btn.disabled = false;
        }
    }

    pdf.save(`PINAZIOS ${pedidoNum}.pdf`);
}
