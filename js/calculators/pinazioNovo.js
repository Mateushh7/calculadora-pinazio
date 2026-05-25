/**
 * Pinázio Novo (18 mm).
 *
 * Diferenças em relação ao antigo:
 *  - Não tem conectores: as barras verticais são sempre "inteiras" (atravessam
 *    a peça toda) e as barras horizontais são "conectadas" — entram 5 mm na
 *    parte lateral da barra inteira (a barra tem estrutura 5+8+5 mm).
 *  - Regra Opção B (escolhida pelo cliente): todas as barras conectadas de uma
 *    mesma peça têm o mesmo comprimento. Os vãos das pontas ficam 5 mm maiores
 *    que os vãos do meio (compensação geométrica), mas o pedido sai com uma
 *    única medida de conectada.
 *
 * Casos limite:
 *  - Se não há barras verticais (1 vão horizontal), as horizontais existentes
 *    viram inteiras (largura útil completa), sem sobreposição.
 *  - Se não há barras horizontais (1 vão vertical), só restam as verticais
 *    inteiras.
 *
 * Quando o modo "Especificar divisões individualmente" está ativo, respeitamos
 * os tamanhos de vão definidos pelo usuário e calculamos cada conectada como
 * `vão + sobreposições` — nesse modo perde-se a propriedade "todas iguais",
 * porque o usuário está sobrescrevendo a distribuição.
 */

const DESCONTO_PERFIL = 14;
const DESCONTO_POLI = 10;
const DESCONTO_BORDA_DIM = 2;
const LARGURA_PINAZIO = 18;
const SOBREPOSICAO = 5;
const FLOAT_TOLERANCE = 0.01;

export const pinazioNovo = {
    id: 'novo',
    label: 'Pinázio Novo (18mm)',
    descricao: 'Barras verticais inteiras. Horizontais conectadas com 5 mm de sobreposição em cada inteira.',
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

        const larguraUtil = largura - DESCONTO_PERFIL - DESCONTO_POLI - DESCONTO_BORDA_DIM;
        const alturaUtil = altura - DESCONTO_PERFIL - DESCONTO_POLI - DESCONTO_BORDA_DIM;

        if (larguraUtil < -FLOAT_TOLERANCE || alturaUtil < -FLOAT_TOLERANCE) {
            return {
                ok: false,
                erro: 'As dimensões da peça são insuficientes para acomodar os descontos.',
            };
        }

        // Espaço para vãos (descontando as barras que ocupam fisicamente o espaço)
        const espacoLargura = Math.max(0, larguraUtil - numBarrasVerticais * LARGURA_PINAZIO);
        const espacoAltura = Math.max(0, alturaUtil - numBarrasHorizontais * LARGURA_PINAZIO);

        // ── Determinar vãos (largura) ─────────────────────────────────
        let realSegmentWidths;
        let conectadaUniforme = null; // medida única quando aplicável (modo auto + há inteiras)
        let modoLargura = 'igual';

        if (specifySegmentsChecked && numVaosHorizontais > 1) {
            const sumW = specifiedSegmentWidths.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            if (Math.abs(sumW - largura) > FLOAT_TOLERANCE) {
                return { ok: false, erro: `Erro Largura: Soma (${sumW.toFixed(2)}mm) ≠ Largura Total (${largura.toFixed(2)}mm).` };
            }
            if (specifiedSegmentWidths.some((w) => parseFloat(w) <= 0 || isNaN(parseFloat(w)))) {
                return { ok: false, erro: 'Erro: tamanhos especificados devem ser > 0.' };
            }
            realSegmentWidths = specifiedSegmentWidths.map((w) => (w / sumW) * espacoLargura);
            modoLargura = 'especificada';
        } else if (numVaosHorizontais > 1 && numBarrasVerticais > 0) {
            // Opção B: todas conectadas iguais
            //   L = (larguraUtil - 8n) / (n+1)   onde n = nº inteiras
            //   vão ponta   = L - 5
            //   vão meio    = L - 10
            const n = numBarrasVerticais;
            const L = (larguraUtil - 8 * n) / (n + 1);
            if (L < SOBREPOSICAO * 2 + FLOAT_TOLERANCE) {
                return { ok: false, erro: 'Largura insuficiente para acomodar barras inteiras com sobreposição mínima.' };
            }
            conectadaUniforme = L;
            const vaoPonta = L - SOBREPOSICAO;
            const vaoMeio = L - 2 * SOBREPOSICAO;
            realSegmentWidths = [];
            for (let j = 0; j < numVaosHorizontais; j++) {
                const isPonta = j === 0 || j === numVaosHorizontais - 1;
                realSegmentWidths.push(isPonta ? vaoPonta : vaoMeio);
            }
            modoLargura = 'opcaoB';
        } else {
            const vao = numVaosHorizontais > 0 ? espacoLargura / numVaosHorizontais : 0;
            realSegmentWidths = Array(numVaosHorizontais).fill(vao);
        }

        // ── Determinar vãos (altura) — divisão simples, sem sobreposição ─
        let realSegmentHeights;
        if (specifySegmentsChecked && numVaosVerticais > 1) {
            const sumH = specifiedSegmentHeights.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            if (Math.abs(sumH - altura) > FLOAT_TOLERANCE) {
                return { ok: false, erro: `Erro Altura: Soma (${sumH.toFixed(2)}mm) ≠ Altura Total (${altura.toFixed(2)}mm).` };
            }
            if (specifiedSegmentHeights.some((h) => parseFloat(h) <= 0 || isNaN(parseFloat(h)))) {
                return { ok: false, erro: 'Erro: tamanhos especificados devem ser > 0.' };
            }
            realSegmentHeights = specifiedSegmentHeights.map((h) => (h / sumH) * espacoAltura);
        } else {
            const vao = numVaosVerticais > 0 ? espacoAltura / numVaosVerticais : 0;
            realSegmentHeights = Array(numVaosVerticais).fill(vao);
        }

        realSegmentWidths = realSegmentWidths.map((w) => Math.max(0, w));
        realSegmentHeights = realSegmentHeights.map((h) => Math.max(0, h));

        // ── Comprimentos das barras ───────────────────────────────────
        const barrasVerticais = [];
        const barrasHorizontais = [];

        // Verticais: sempre inteiras quando existem.
        if (numBarrasVerticais > 0) {
            const medida = alturaUtil.toFixed(2);
            barrasVerticais.push({
                medida,
                quantidade: numBarrasVerticais * quantidade,
                categoria: 'inteira',
            });
        }

        // Horizontais:
        //  - Se houver barras verticais (n ≥ 1): conectadas com sobreposição.
        //  - Se não houver: inteiras (atravessam toda a largura útil).
        if (numBarrasHorizontais > 0) {
            if (numBarrasVerticais === 0) {
                const medida = larguraUtil.toFixed(2);
                barrasHorizontais.push({
                    medida,
                    quantidade: numBarrasHorizontais * quantidade,
                    categoria: 'inteira',
                });
            } else {
                // Calcula comprimento de cada pedaço (vão + sobreposições) e agrupa por medida.
                const grupos = {};
                for (let j = 0; j < numVaosHorizontais; j++) {
                    const vao = realSegmentWidths[j];
                    const overlapEsq = j === 0 ? 0 : SOBREPOSICAO;
                    const overlapDir = j === numVaosHorizontais - 1 ? 0 : SOBREPOSICAO;
                    const comprimento = vao + overlapEsq + overlapDir;
                    const chave = comprimento.toFixed(2);
                    grupos[chave] = (grupos[chave] || 0) + numBarrasHorizontais;
                }
                Object.entries(grupos).forEach(([medida, q]) => {
                    if (parseFloat(medida) > 0 && q * quantidade > 0) {
                        barrasHorizontais.push({
                            medida,
                            quantidade: q * quantidade,
                            categoria: 'conectada',
                        });
                    }
                });
            }
        }

        // ── Breakdown ──────────────────────────────────────────────────
        const breakdown = {
            calculadora: this.label,
            largura: criarBreakdownLargura({
                largura, larguraUtil,
                numBarrasVerticais,
                numVaosHorizontais,
                modoLargura,
                conectadaUniforme,
            }),
            altura: criarBreakdownAltura({
                altura, alturaUtil, numBarrasVerticais,
            }),
            // Sem conectores no modelo novo
            observacao: 'Pinázio Novo: sem conectores. Verticais são inteiras; horizontais entram 5 mm em cada inteira (lateral 5+8+5).',
        };

        return {
            ok: true,
            barrasVerticais,
            barrasHorizontais,
            conectores: 0,
            realSegmentWidths,
            realSegmentHeights,
            direcaoInteira: 'vertical',
            breakdown,
        };
    },
};

// ─── helpers ───────────────────────────────────────────────────────────

function criarBreakdownLargura({
    largura, larguraUtil,
    numBarrasVerticais,
    numVaosHorizontais,
    modoLargura,
    conectadaUniforme,
}) {
    const steps = [
        { op: '',  label: 'Largura total',        valor: largura },
        { op: '−', label: 'Desconto perfil',      valor: DESCONTO_PERFIL },
        { op: '−', label: 'Desconto poli',        valor: DESCONTO_POLI },
        { op: '−', label: 'Desconto borda',       valor: DESCONTO_BORDA_DIM },
        { op: '=', label: 'Largura útil',         valor: larguraUtil, total: true },
    ];

    let resultado = null;
    if (modoLargura === 'opcaoB') {
        const n = numBarrasVerticais;
        const totalSobreposicao = 2 * SOBREPOSICAO * n;
        steps.push({ op: '−', label: `${n} barra(s) inteira(s) × ${LARGURA_PINAZIO}mm`, valor: n * LARGURA_PINAZIO });
        steps.push({ op: '=', label: 'Espaço dos vãos',            valor: larguraUtil - n * LARGURA_PINAZIO });
        steps.push({ op: '+', label: `Sobreposição total (${2 * n} × ${SOBREPOSICAO}mm)`, valor: totalSobreposicao });
        steps.push({ op: '=', label: 'Comprimento total conectadas', valor: larguraUtil - n * LARGURA_PINAZIO + totalSobreposicao, total: true });
        steps.push({ op: '÷', label: `${numVaosHorizontais} pedaço(s) iguais`, valor: conectadaUniforme });
        resultado = { label: 'Comprimento de cada conectada', valor: conectadaUniforme };
    } else if (numBarrasVerticais > 0) {
        // Sem inteiras... não deveria cair aqui no novo, mas mantemos por segurança.
        const espacoVaos = larguraUtil - numBarrasVerticais * LARGURA_PINAZIO;
        steps.push({ op: '−', label: `${numBarrasVerticais} barra(s) × ${LARGURA_PINAZIO}mm`, valor: numBarrasVerticais * LARGURA_PINAZIO });
        steps.push({ op: '=', label: 'Espaço dos vãos', valor: espacoVaos, total: true });
    }

    return { eixo: 'Largura — barras horizontais (conectadas)', steps, resultado };
}

function criarBreakdownAltura({
    altura, alturaUtil, numBarrasVerticais,
}) {
    // No Pinázio Novo, a altura útil já É o comprimento da barra inteira (vertical).
    const steps = [
        { op: '',  label: 'Altura total',         valor: altura },
        { op: '−', label: 'Desconto perfil',      valor: DESCONTO_PERFIL },
        { op: '−', label: 'Desconto poli',        valor: DESCONTO_POLI },
        { op: '−', label: 'Desconto borda',       valor: DESCONTO_BORDA_DIM },
        { op: '=', label: 'Altura útil',          valor: alturaUtil, total: true },
    ];

    const resultado = numBarrasVerticais > 0
        ? { label: 'Comprimento da barra inteira (vertical)', valor: alturaUtil }
        : null;

    return { eixo: 'Altura — barras verticais (inteiras)', steps, resultado };
}
