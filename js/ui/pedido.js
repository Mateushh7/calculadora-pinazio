/**
 * Gerencia a lista de peças do pedido (renderização, add, delete).
 */

import { $ } from '../utils/dom.js';
import { state } from '../state.js';
import { desenharMiniPreview, limparPreview } from './preview.js';

/**
 * Adiciona a última peça calculada ao pedido. Retorna { ok, mensagem }.
 */
export function adicionarPecaAoPedido() {
    if (!state.lastCalculatedPieceSummary || !state.lastCalculatedPieceSummary.previewParams) {
        return { ok: false, mensagem: 'Calcule uma peça antes de adicionar.' };
    }
    const pedidoNum = $('pedidoNumero').value.trim();
    const ambienteNome = $('ambienteNome').value.trim();
    if (pedidoNum === '') {
        $('pedidoNumero').focus();
        return { ok: false, mensagem: 'Preencha o Número do Pedido.' };
    }
    if (ambienteNome === '') {
        $('ambienteNome').focus();
        return { ok: false, mensagem: 'Preencha o Nome do Ambiente.' };
    }

    if (state.currentPedido.numero === '' || state.currentPedido.numero !== pedidoNum) {
        state.currentPedido.numero = pedidoNum;
        state.currentPedido.pecas = [];
    }

    const summary = state.lastCalculatedPieceSummary;
    const previewParamsCopy = JSON.parse(JSON.stringify(summary.previewParams));
    const cores = summary.cores || {
        camaraNome: $('corCamara').value || 'PRATA',
        pinazioNome: $('corPinazio').value || 'BRANCO',
    };

    const novaPeca = {
        ambiente: ambienteNome,
        obs: summary.obs || '',
        tipoCalculadora: summary.tipoCalculadora,
        resumoBarras: [
            ...summary.barrasVerticais.map((b) => ({ ...b, tipo: 'Vertical' })),
            ...summary.barrasHorizontais.map((b) => ({ ...b, tipo: 'Horizontal' })),
        ],
        conectores: summary.conectores,
        cores,
        dimensoes: {
            quantidade: parseInt($('quantidade').value) || 1,
            largura: parseFloat($('largura').value) || 0,
            altura: parseFloat($('altura').value) || 0,
            vaosHorizontais: parseInt($('vaosHorizontais').value) || 1,
            vaosVerticais: parseInt($('vaosVerticais').value) || 1,
            especificarSegmentos: $('specifySegments').checked,
        },
        previewParams: previewParamsCopy,
    };

    state.currentPedido.pecas.push(novaPeca);
    updatePedidoPecasList();

    $('ambienteNome').value = '';
    $('obsTexto').value = '';
    state.lastCalculatedPieceSummary = null;
    $('resultado').innerHTML = `<p>Peça <strong>"${escapeHtml(ambienteNome)}"</strong> adicionada ao Pedido <strong>${escapeHtml(pedidoNum)}</strong>.</p>`;
    limparPreview();
    $('captureContainer').style.display = 'none';
    $('ambienteNome').focus();

    return { ok: true, mensagem: `Peça "${ambienteNome}" adicionada ao Pedido ${pedidoNum}!` };
}

export function excluirPecaDoPedido(index) {
    if (index < 0 || index >= state.currentPedido.pecas.length) return;
    const nome = state.currentPedido.pecas[index].ambiente;
    if (confirm(`Excluir peça "${nome}"?`)) {
        state.currentPedido.pecas.splice(index, 1);
        updatePedidoPecasList();
    }
}

export function updatePedidoPecasList() {
    const lista = $('pedidoPecasList');
    const header = $('pedidoHeader');
    lista.innerHTML = '';

    const totalPecas = state.currentPedido.pecas.reduce((sum, p) => sum + p.dimensoes.quantidade, 0);
    if (header) {
        header.innerHTML =
            `Pedido: <span id="pedidoNumeroDisplay">${escapeHtml(state.currentPedido.numero || 'N/A')}</span> ` +
            `(<span id="pedidoTotalPecas">${totalPecas}</span> peças)`;
    }

    if (state.currentPedido.pecas.length === 0) {
        lista.innerHTML = '<div class="empty-state">Nenhuma peça adicionada ainda.</div>';
        return;
    }

    state.currentPedido.pecas.forEach((peca, index) => {
        const item = document.createElement('div');
        item.classList.add('pedido-peca-item');

        const details = document.createElement('div');
        details.classList.add('peca-item-details');

        let html =
            `<h4>Ambiente: ${escapeHtml(peca.ambiente)}</h4>` +
            `<p class="peca-dims">(${peca.dimensoes.quantidade}x ${peca.dimensoes.largura}mm x ${peca.dimensoes.altura}mm` +
            `${peca.dimensoes.especificarSegmentos ? ', Seg. Espec.' : ''})</p>`;

        if (peca.resumoBarras.length > 0) {
            html += `<h5 style="font-weight:600; font-size:0.8rem; color: var(--primary-mid); margin-top:0.5rem;">Barras:</h5>`;
            html += `<table class="results-table"><thead><tr><th>Tipo</th><th>Medida (mm)</th><th>Qtd Total</th></tr></thead><tbody>`;
            peca.resumoBarras.forEach((b) => {
                html += `<tr><td>${escapeHtml(b.tipo)}</td><td>${escapeHtml(b.medida)}</td><td>${b.quantidade}</td></tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-size:0.75rem; margin-top:0.5rem;">Nenhuma barra.</p>`;
        }

        if (peca.conectores > 0) {
            html += `<p style="font-size:0.85rem; margin-top:0.5rem;">Conectores: ${peca.conectores} unidades</p>`;
        }

        const corCam = peca.cores?.camaraNome || 'PRATA';
        const corPin = peca.cores?.pinazioNome || 'BRANCO';
        html +=
            `<h5 style="font-weight:600; font-size:0.8rem; color: var(--primary-mid); margin-top:0.5rem;">Cores:</h5>` +
            `<div style="font-size:0.8rem;">` +
                `<div>Câmara: <strong>${escapeHtml(corCam)}</strong></div>` +
                `<div style="margin-top:0.25rem;">Pinázio: <strong>${escapeHtml(corPin)}</strong></div>` +
            `</div>`;

        if (peca.obs) {
            html += `<div class="obs-display" style="margin-top:0.5rem; display:inline-block;"><strong>OBS:</strong> ${escapeHtml(peca.obs)}</div>`;
        }

        details.innerHTML = html;

        const miniPreview = document.createElement('div');
        miniPreview.classList.add('mini-preview-container');

        item.appendChild(details);
        item.appendChild(miniPreview);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-button');
        deleteBtn.textContent = 'Excluir';
        deleteBtn.addEventListener('click', () => excluirPecaDoPedido(index));
        item.appendChild(deleteBtn);

        lista.appendChild(item);

        requestAnimationFrame(() => {
            if (document.body.contains(miniPreview)) {
                desenharMiniPreview(miniPreview, peca.previewParams);
            }
        });
    });
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
