/**
 * Pinázio Antigo — cálculo original da calculadora (modelo de pinázio antigo, 18mm).
 *
 * Aplica descontos fixos (perfil, poli, borda) na largura/altura total da peça,
 * subtrai o espaço ocupado pelas próprias barras de pinázio (18 mm cada),
 * e divide o restante entre os vãos.
 *
 * Esta calculadora produz um objeto `breakdown` descrevendo cada subtração
 * para que a UI possa exibir o cálculo visivelmente passo a passo.
 */

const DESCONTO_PERFIL = 14;
const DESCONTO_POLI = 10;
const DESCONTO_BORDA_DIM = 2;
const LARGURA_PINAZIO = 18;
const FLOAT_TOLERANCE = 0.01;

export const pinazioAntigo = {
    id: 'antigo',
    label: 'Pinázio Antigo (18mm)',
    descricao: 'Cálculo com descontos de perfil (14), poli (10), borda (2) e barras de 18mm.',
    larguraPinazio: LARGURA_PINAZIO,

    calcular(input) {
        const {
            quantidade,
            largura,
            altura,
            numVaosHorizontais,
            numVaosVerticais,
            specifySegmentsChecked,
            specifiedSegmentWidths,
            specifiedSegmentHeights,
        } = input;

        const numBarrasVerticais = numVaosHorizontais - 1;
        const numBarrasHorizontais = numVaosVerticais - 1;

        // ── Espaço disponível por dimensão ─────────────────────────────
        const espacoBarrasV = numBarrasVerticais * LARGURA_PINAZIO;
        const espacoBarrasH = numBarrasHorizontais * LARGURA_PINAZIO;

        const larguraDisponivel =
            largura - DESCONTO_PERFIL - DESCONTO_POLI - espacoBarrasV - DESCONTO_BORDA_DIM;
        const alturaDisponivel =
            altura - DESCONTO_PERFIL - DESCONTO_POLI - espacoBarrasH - DESCONTO_BORDA_DIM;

        if (larguraDisponivel < -FLOAT_TOLERANCE || alturaDisponivel < -FLOAT_TOLERANCE) {
            return {
                ok: false,
                erro: 'As dimensões da peça são insuficientes para acomodar os descontos e as barras.',
            };
        }

        const finalLargura = Math.max(0, larguraDisponivel);
        const finalAltura = Math.max(0, alturaDisponivel);

        // ── Tamanhos reais dos segmentos ───────────────────────────────
        let realSegmentWidths;
        let realSegmentHeights;
        let modoDivisao = 'igual';

        if (specifySegmentsChecked && (numVaosHorizontais > 1 || numVaosVerticais > 1)) {
            const erroEspec = validarSegmentosEspecificados({
                numVaosHorizontais,
                numVaosVerticais,
                specifiedSegmentWidths,
                specifiedSegmentHeights,
                largura,
                altura,
            });
            if (erroEspec) return { ok: false, erro: erroEspec };

            const sumWidths = specifiedSegmentWidths.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            const sumHeights = specifiedSegmentHeights.reduce((s, v) => s + (parseFloat(v) || 0), 0);

            realSegmentWidths = numVaosHorizontais === 1
                ? [finalLargura]
                : specifiedSegmentWidths.map((w) => (w / (sumWidths || largura || 1)) * finalLargura);
            realSegmentHeights = numVaosVerticais === 1
                ? [finalAltura]
                : specifiedSegmentHeights.map((h) => (h / (sumHeights || altura || 1)) * finalAltura);

            if (realSegmentWidths.some((w) => w < -FLOAT_TOLERANCE) ||
                realSegmentHeights.some((h) => h < -FLOAT_TOLERANCE)) {
                return { ok: false, erro: 'Erro interno: cálculo resultou em tamanhos negativos.' };
            }
            modoDivisao = 'especificada';
        } else {
            const larguraIgual = numVaosHorizontais > 0 ? finalLargura / numVaosHorizontais : 0;
            const alturaIgual = numVaosVerticais > 0 ? finalAltura / numVaosVerticais : 0;
            realSegmentWidths = Array(numVaosHorizontais).fill(larguraIgual);
            realSegmentHeights = Array(numVaosVerticais).fill(alturaIgual);
        }

        realSegmentWidths = realSegmentWidths.map((w) => Math.max(0, w));
        realSegmentHeights = realSegmentHeights.map((h) => Math.max(0, h));

        // ── Quantidades agrupadas por medida ───────────────────────────
        const barrasVerticais = agruparBarras(realSegmentHeights, numBarrasVerticais, quantidade);
        const barrasHorizontais = agruparBarras(realSegmentWidths, numBarrasHorizontais, quantidade);
        const conectores = quantidade * numBarrasVerticais * numBarrasHorizontais;

        // ── Breakdown estruturado (cálculo visível) ────────────────────
        const breakdown = {
            calculadora: this.label,
            largura: criarBreakdownDimensao({
                eixo: 'Largura — barras horizontais',
                total: largura,
                numBarras: numBarrasVerticais,
                disponivel: finalLargura,
                numVaos: numVaosHorizontais,
                modoDivisao,
                rotuloBarra: 'Comprimento das barras horizontais',
            }),
            altura: criarBreakdownDimensao({
                eixo: 'Altura — barras verticais',
                total: altura,
                numBarras: numBarrasHorizontais,
                disponivel: finalAltura,
                numVaos: numVaosVerticais,
                modoDivisao,
                rotuloBarra: 'Comprimento das barras verticais',
            }),
            conectores: {
                formula: `${quantidade} peça(s) × ${numBarrasVerticais} barras verticais × ${numBarrasHorizontais} barras horizontais`,
                total: conectores,
            },
        };

        return {
            ok: true,
            barrasVerticais,
            barrasHorizontais,
            conectores,
            realSegmentWidths,
            realSegmentHeights,
            breakdown,
        };
    },
};

// ─── helpers privados ──────────────────────────────────────────────────

function validarSegmentosEspecificados({
    numVaosHorizontais, numVaosVerticais,
    specifiedSegmentWidths, specifiedSegmentHeights,
    largura, altura,
}) {
    const sumW = specifiedSegmentWidths.reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const sumH = specifiedSegmentHeights.reduce((s, v) => s + (parseFloat(v) || 0), 0);

    if (numVaosHorizontais > 1 && Math.abs(sumW - largura) > FLOAT_TOLERANCE) {
        return `Erro Largura: Soma (${sumW.toFixed(2)}mm) ≠ Largura Total (${largura.toFixed(2)}mm).`;
    }
    if (numVaosVerticais > 1 && Math.abs(sumH - altura) > FLOAT_TOLERANCE) {
        return `Erro Altura: Soma (${sumH.toFixed(2)}mm) ≠ Altura Total (${altura.toFixed(2)}mm).`;
    }
    const widthsInvalidos = numVaosHorizontais > 1 &&
        specifiedSegmentWidths.some((w) => parseFloat(w) <= 0 || isNaN(parseFloat(w)));
    const heightsInvalidos = numVaosVerticais > 1 &&
        specifiedSegmentHeights.some((h) => parseFloat(h) <= 0 || isNaN(parseFloat(h)));
    if (widthsInvalidos || heightsInvalidos) {
        return 'Erro: tamanhos especificados devem ser > 0.';
    }
    return null;
}

function agruparBarras(segmentos, numBarras, quantidade) {
    if (numBarras <= 0) return [];
    const grupos = {};
    segmentos.forEach((size) => {
        if (size > FLOAT_TOLERANCE) {
            const chave = size.toFixed(2);
            grupos[chave] = (grupos[chave] || 0) + numBarras;
        }
    });
    return Object.entries(grupos)
        .filter(([medida, q]) => parseFloat(medida) > 0 && q * quantidade > 0)
        .map(([medida, q]) => ({ medida, quantidade: q * quantidade }));
}

/**
 * Constrói o breakdown de uma dimensão. O resultado final é o comprimento
 * das barras dessa direção. Não listamos vãos.
 */
function criarBreakdownDimensao({
    eixo, total,
    numBarras, disponivel,
    numVaos, modoDivisao, rotuloBarra,
}) {
    const descontoPerfil = DESCONTO_PERFIL;
    const descontoPoli = DESCONTO_POLI;
    const descontoBorda = DESCONTO_BORDA_DIM;
    const larguraPinazio = LARGURA_PINAZIO;
    const steps = [
        { op: '',  label: `Total`,            valor: total },
        { op: '−', label: 'Desconto perfil',          valor: descontoPerfil },
        { op: '−', label: 'Desconto poli',            valor: descontoPoli },
    ];
    if (numBarras > 0) {
        steps.push({
            op: '−',
            label: `${numBarras} barra(s) × ${larguraPinazio}mm`,
            valor: numBarras * larguraPinazio,
        });
    }
    steps.push({ op: '−', label: 'Desconto borda',   valor: descontoBorda });
    steps.push({ op: '=', label: 'Espaço disponível', valor: disponivel, total: true });
    if (numVaos > 0) {
        steps.push({ op: '÷', label: `${numVaos} barra(s)`, valor: disponivel / numVaos });
    }

    const resultado = numVaos > 0 && modoDivisao !== 'especificada'
        ? { label: rotuloBarra || 'Comprimento da barra', valor: disponivel / numVaos }
        : null;

    return { eixo, steps, resultado };
}
