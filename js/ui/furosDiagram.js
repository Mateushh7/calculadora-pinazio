/**
 * Renderiza um diagrama (SVG) da barra inteira com as posições dos furos.
 *
 * Entrada (objeto `furos`):
 *   {
 *     comprimentoBarra: number,        // comprimento total da barra inteira (mm)
 *     quantidadeBarrasIguais: number,  // só pra UI ("× 3 unidades")
 *     posicoes: number[],              // posições dos furos (mm, do topo)
 *   }
 *
 * Retorna uma string com o HTML/SVG pronto para inserir na UI.
 */

import { fmt2 } from '../utils/format.js';

const SVG_HEIGHT = 360;          // altura útil do SVG (px)
const BAR_WIDTH = 30;            // largura da representação da barra (px)
const SVG_WIDTH = 170;           // largura total do SVG (com espaço pras cotas)
const PAD_TOP = 18;              // margem superior para a label "topo"
const PAD_BOTTOM = 18;           // margem inferior para a label do total
const BAR_X = 18;                // posição X da barra no SVG

export function renderFurosDiagramHTML(furos) {
    if (!furos || !furos.posicoes || furos.posicoes.length === 0) return '';

    const { comprimentoBarra, posicoes, quantidadeBarrasIguais } = furos;
    const barTop = PAD_TOP;
    const barBottom = SVG_HEIGHT - PAD_BOTTOM;
    const barHeight = barBottom - barTop;

    const yForMm = (mm) => barTop + (mm / comprimentoBarra) * barHeight;

    // Barra
    const bar = `<rect x="${BAR_X}" y="${barTop}" width="${BAR_WIDTH}" height="${barHeight}" ` +
                `fill="#e8f5f7" stroke="#2C6E7A" stroke-width="1.5" rx="2" />`;

    // Linha central da barra (referência visual do eixo)
    const cx = BAR_X + BAR_WIDTH / 2;
    const centerLine = `<line x1="${cx}" y1="${barTop}" x2="${cx}" y2="${barBottom}" ` +
                       `stroke="#9ecdd4" stroke-width="0.5" stroke-dasharray="2 2" />`;

    // Furos + cotas
    const furosSvg = posicoes.map((mm) => {
        const y = yForMm(mm);
        const labelX = BAR_X + BAR_WIDTH + 8;
        return (
            `<circle cx="${cx}" cy="${y}" r="3.5" fill="#C63832" stroke="#7a201d" stroke-width="0.8"/>` +
            `<line x1="${BAR_X + BAR_WIDTH}" y1="${y}" x2="${labelX}" y2="${y}" stroke="#163A4A" stroke-width="0.8"/>` +
            `<text x="${labelX + 2}" y="${y + 3}" font-size="11" font-weight="600" fill="#163A4A">${fmt2(mm)} mm</text>`
        );
    }).join('');

    // Marcadores das extremidades (topo = 0, fim = comprimento)
    const topoLabel =
        `<text x="${BAR_X + BAR_WIDTH / 2}" y="${barTop - 6}" font-size="10" font-weight="600" ` +
        `fill="#4a7a87" text-anchor="middle">topo</text>`;
    const totalLabel =
        `<text x="${BAR_X + BAR_WIDTH / 2}" y="${barBottom + 12}" font-size="10" font-weight="600" ` +
        `fill="#4a7a87" text-anchor="middle">${fmt2(comprimentoBarra)} mm</text>`;

    const svg =
        `<svg viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" ` +
        `style="width:100%; max-width:${SVG_WIDTH}px; height:auto;">` +
            bar + centerLine + furosSvg + topoLabel + totalLabel +
        `</svg>`;

    const titulo = quantidadeBarrasIguais > 1
        ? `Furos nas ${quantidadeBarrasIguais} barras inteiras (todas iguais)`
        : 'Furos na barra inteira';

    return (
        `<div class="furos-diagram">` +
            `<h4>${titulo}</h4>` +
            svg +
        `</div>`
    );
}
