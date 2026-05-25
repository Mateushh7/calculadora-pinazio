/**
 * Handlers de download — imagem PNG da peça atual e PDF do pedido completo.
 *
 * Ambos usam gerarCanvasPeca (mesmo renderer) para garantir consistência visual
 * e legibilidade no impresso.
 *
 * Depende globalmente de:
 *   - window.jspdf (CDN no index.html)
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
 * Gera um PDF do pedido completo. Cada peça é renderizada via gerarCanvasPeca
 * (mesmo motor do download de imagem), o que dá texto nítido e legível ao imprimir.
 *
 * Layout: A4 retrato, várias peças por página (empilhadas verticalmente).
 * Cada peça é escalada para ocupar a largura útil da página.
 */
export async function handleDownloadPDF() {
    const { jsPDF } = window.jspdf;
    const pedidoNum = $('pedidoNumero').value.trim() || 'sP';
    const btn = $('downloadPdfButton');
    const pecas = state.currentPedido.pecas;

    if (!pecas || pecas.length === 0) {
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
    const margin = 12;
    const availW = pageW - margin * 2;
    const gap = 5;
    // Largura fixa por peça (mm) — escolhida para caber 3 peças por página A4
    // mantendo fontes legíveis. Se a proporção do canvas for muito alta, mais
    // peças podem caber automaticamente via o teste de overflow abaixo.
    const itemWidth = 140;
    const itemX = margin + (availW - itemWidth) / 2;
    let y = margin;

    const headerText = $('pedidoHeader').innerText;
    pdf.setFontSize(14);
    pdf.text(headerText, margin, y);
    y += 8;

    try {
        for (let i = 0; i < pecas.length; i++) {
            const peca = pecas[i];
            try {
                const resumo = resumoDoPeca(peca);
                const canvas = gerarCanvasPeca(
                    peca.previewParams,
                    resumo,
                    peca.ambiente,
                    peca.cores?.camaraNome || 'PRATA',
                    peca.cores?.pinazioNome || 'BRANCO',
                );

                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                const finalW = itemWidth;
                const finalH = (canvas.height / canvas.width) * finalW;

                if (y + finalH > pageH - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.addImage(imgData, 'JPEG', itemX, y, finalW, finalH);
                y += finalH + gap;
            } catch (e) {
                console.error(`Erro ao gerar peça ${i + 1} do PDF:`, e);
            }
        }
    } finally {
        if (btn) {
            btn.textContent = '↓ Download PDF';
            btn.disabled = false;
        }
    }

    pdf.save(`PINAZIOS ${pedidoNum}.pdf`);
}

/**
 * Constrói o objeto `resumo` que gerarCanvasPeca espera a partir de uma peça
 * armazenada em state.currentPedido.pecas[*].
 */
function resumoDoPeca(peca) {
    const verticais = (peca.resumoBarras || [])
        .filter((b) => b.tipo === 'Vertical')
        .map((b) => ({ tipo: 'Vertical', medida: b.medida, quantidade: b.quantidade }));
    const horizontais = (peca.resumoBarras || [])
        .filter((b) => b.tipo === 'Horizontal')
        .map((b) => ({ tipo: 'Horizontal', medida: b.medida, quantidade: b.quantidade }));

    return {
        quantidade: peca.dimensoes?.quantidade || 1,
        barrasVerticais: verticais,
        barrasHorizontais: horizontais,
        conectores: peca.conectores || 0,
        obs: peca.obs || '',
    };
}
