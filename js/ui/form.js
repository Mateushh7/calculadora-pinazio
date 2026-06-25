/**
 * Leitura e validação dos campos do formulário.
 * Não toca em DOM além dos inputs — quem decide o que renderizar é o caller.
 */

import { $ } from '../utils/dom.js';
import { state } from '../state.js';

/**
 * Lê o formulário e retorna o objeto de input pronto para a calculadora.
 * Retorna { ok: false, erro } quando a validação inicial falha.
 */
export function lerFormulario() {
    const quantidadeStr = $('quantidade').value.trim();
    const larguraStr = $('largura').value.trim();
    const alturaStr = $('altura').value.trim();

    const quantidade = parseInt(quantidadeStr);
    const largura = parseFloat(larguraStr);
    const altura = parseFloat(alturaStr);
    const numVaosHorizontais = parseInt($('vaosHorizontais').value) || 1;
    const numVaosVerticais = parseInt($('vaosVerticais').value) || 1;

    const invalidoBase =
        quantidadeStr === '' || larguraStr === '' || alturaStr === '' ||
        isNaN(quantidade) || isNaN(largura) || isNaN(altura) ||
        quantidade < 1 || largura <= 0 || altura <= 0 ||
        numVaosHorizontais < 1 || numVaosVerticais < 1;

    if (!$('tipoCalculadora').value) {
        return {
            ok: false,
            erro: 'Por favor, selecione o tipo de pinázio.',
        };
    }

    if (!$('corCamara').value || !$('corPinazio').value) {
        return {
            ok: false,
            erro: 'Por favor, selecione as cores da câmara e do pinázio.',
        };
    }

    if (invalidoBase) {
        return {
            ok: false,
            erro: 'Por favor, preencha Quantidade (>0), Largura (>0) e Altura (>0) com valores numéricos válidos.',
        };
    }

    return {
        ok: true,
        input: {
            quantidade,
            largura,
            altura,
            numVaosHorizontais,
            numVaosVerticais,
            specifySegmentsChecked: $('specifySegments').checked,
            specifiedSegmentWidths: [...state.specifiedSegmentWidths],
            specifiedSegmentHeights: [...state.specifiedSegmentHeights],
            ambienteNome: $('ambienteNome').value.trim() || 'Ambiente',
            corCamaraNome: $('corCamara').value || 'PRATA',
            corPinazioNome: $('corPinazio').value || 'BRANCO',
            obsTexto: $('obsTexto').value.trim(),
            tipoCalculadora: $('tipoCalculadora').value,
        },
    };
}
