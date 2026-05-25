/**
 * Entry point — popula o select de calculadoras, amarra os event listeners
 * e expõe a função `calcular` que orquestra:
 *
 *   form → calculadora → state → preview + results
 */

import { $ } from './utils/dom.js';
import { state } from './state.js';
import { listCalculators, getCalculator, DEFAULT_CALCULATOR_ID } from './calculators/index.js';
import { lerFormulario } from './ui/form.js';
import { showError, renderResultados } from './ui/results.js';
import { limparPreview, desenharPreview } from './ui/preview.js';
import { generateDynamicSegmentInputs, updateSegmentInputWarning } from './ui/segmentInputs.js';
import { adicionarPecaAoPedido, updatePedidoPecasList } from './ui/pedido.js';
import { handleDownloadImage, handleDownloadPDF } from './export/download.js';

/**
 * Orquestra o ciclo de cálculo:
 *   1. lê o form;
 *   2. seleciona a calculadora;
 *   3. processa o resultado e atualiza state, results, preview.
 */
function calcular() {
    const leitura = lerFormulario();
    if (!leitura.ok) {
        showError(leitura.erro);
        limparPreview();
        $('previewTitleAmbiente').textContent = '';
        $('downloadImageButton').style.display = 'none';
        $('captureContainer').style.display = 'none';
        $('resultadoQuantidade').textContent = '';
        state.lastCalculatedPieceSummary = null;
        return;
    }

    const input = leitura.input;
    const calculadora = getCalculator(input.tipoCalculadora);
    const resultado = calculadora.calcular(input);

    if (!resultado.ok) {
        showError(resultado.erro);
        limparPreview();
        $('previewTitleAmbiente').textContent = '';
        $('downloadImageButton').style.display = 'none';
        $('captureContainer').style.display = 'none';
        $('resultadoQuantidade').textContent = '';
        state.lastCalculatedPieceSummary = null;
        return;
    }

    updateSegmentInputWarning('');

    // ── Atualiza state ─────────────────────────────────────────────────
    state.lastCalculatedPieceSummary = {
        ambiente: input.ambienteNome,
        obs: input.obsTexto,
        tipoCalculadora: input.tipoCalculadora,
        barrasVerticais: resultado.barrasVerticais,
        barrasHorizontais: resultado.barrasHorizontais,
        conectores: resultado.conectores,
        cores: { camaraNome: input.corCamaraNome, pinazioNome: input.corPinazioNome },
        breakdown: resultado.breakdown,
        previewParams: {
            larguraTotal: input.largura,
            alturaTotal: input.altura,
            numVaosHorizontais: input.numVaosHorizontais,
            numVaosVerticais: input.numVaosVerticais,
            numBarrasVerticais: input.numVaosHorizontais - 1,
            numBarrasHorizontais: input.numVaosVerticais - 1,
            larguraPinazio: calculadora.larguraPinazio,
            realSegmentWidths: [...resultado.realSegmentWidths],
            realSegmentHeights: [...resultado.realSegmentHeights],
            specifySegmentsChecked: input.specifySegmentsChecked,
            specifiedSegmentWidths: [...input.specifiedSegmentWidths],
            specifiedSegmentHeights: [...input.specifiedSegmentHeights],
            // Modelo do pinázio — afeta o render (inteiras vs conectadas, com/sem conectores X).
            modelo: input.tipoCalculadora,                  // 'antigo' | 'novo'
            direcaoInteira: resultado.direcaoInteira || null, // 'vertical' (novo) ou null (antigo)
        },
    };

    // ── UI: results + preview + cores info ─────────────────────────────
    renderResultados({
        resultado,
        quantidade: input.quantidade,
        obsTexto: input.obsTexto,
    });

    $('previewTitleAmbiente').textContent = `Ambiente: ${input.ambienteNome}`;
    desenharPreview(state.lastCalculatedPieceSummary.previewParams);

    const coresInfoEl = $('previewCoresInfo');
    coresInfoEl.innerHTML =
        `<strong>Câmara:</strong> ${input.corCamaraNome} &nbsp;|&nbsp; ` +
        `<strong>Pinázio:</strong> ${input.corPinazioNome}`;
    coresInfoEl.style.display = 'block';

    $('captureContainer').style.display = 'grid';
    $('downloadImageButton').style.display = 'inline-block';
}

/**
 * Popula o <select id="tipoCalculadora"> a partir do registry.
 */
function popularSelectTipos() {
    const select = $('tipoCalculadora');
    select.innerHTML = '';
    listCalculators().forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.label;
        if (c.id === DEFAULT_CALCULATOR_ID) opt.selected = true;
        select.appendChild(opt);
    });
}

// ─── Inicialização ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    popularSelectTipos();

    $('specifySegments').addEventListener('change', () => generateDynamicSegmentInputs(calcular));

    $('vaosHorizontais').addEventListener('input', function () {
        const n = parseInt(this.value) || 1;
        if (state.specifiedSegmentWidths.length !== n) state.specifiedSegmentWidths = [];
        if ($('specifySegments').checked) generateDynamicSegmentInputs(calcular);
        else if ($('captureContainer').style.display !== 'none') calcular();
    });
    $('vaosVerticais').addEventListener('input', function () {
        const n = parseInt(this.value) || 1;
        if (state.specifiedSegmentHeights.length !== n) state.specifiedSegmentHeights = [];
        if ($('specifySegments').checked) generateDynamicSegmentInputs(calcular);
        else if ($('captureContainer').style.display !== 'none') calcular();
    });

    $('calculateButton').addEventListener('click', calcular);

    $('addPieceButton').addEventListener('click', () => {
        const r = adicionarPecaAoPedido();
        if (!r.ok || r.mensagem) alert(r.mensagem);
    });

    $('downloadImageButton').addEventListener('click', handleDownloadImage);
    $('downloadPdfButton').addEventListener('click', handleDownloadPDF);

    updatePedidoPecasList();
    $('captureContainer').style.display = 'none';
});
