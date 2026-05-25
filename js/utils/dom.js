/**
 * Helpers de manipulação de DOM compartilhados entre módulos.
 */

/**
 * Atalho para getElementById.
 */
export const $ = (id) => document.getElementById(id);

/**
 * Cria uma <div> absolutamente posicionada com as classes informadas.
 * Retorna null silenciosamente se as dimensões forem inválidas (evita lixo no DOM).
 */
export function createDiv(parent, classes, left, top, width, height) {
    if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height) || isNaN(left) || isNaN(top)) return null;
    const div = document.createElement('div');
    classes.forEach((c) => div.classList.add(c));
    div.style.position = 'absolute';
    div.style.left = left + 'px';
    div.style.top = top + 'px';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    parent.appendChild(div);
    return div;
}

/**
 * Cria um rótulo de cota (dimension label) posicionado em (left, top) dentro de parent.
 * Trata rótulos verticais (rotacionados 90°) e o caso "total vertical" (que rotaciona -90°).
 */
export function createDimensionLabel(parent, valueText, left, top, isTotal, isVertical) {
    let dTxt = valueText;
    const numV = parseFloat(valueText);
    if (!isNaN(numV)) {
        dTxt = Math.abs(numV - Math.round(numV)) < 0.01 ? numV.toFixed(0) : numV.toFixed(1);
    }
    if (isNaN(left) || isNaN(top)) return;

    const lbl = document.createElement('div');
    lbl.classList.add('dimension-label');
    if (isTotal) lbl.classList.add('total-dimension-label');

    if (isVertical) {
        lbl.classList.add('segment-label-vertical');
        lbl.style.transform = isTotal
            ? 'translateY(-50%) rotate(90deg)'
            : 'translateX(-100%) translateY(-50%) rotate(-90deg)';
    } else {
        lbl.classList.add('segment-label-horizontal');
    }

    lbl.textContent = dTxt;
    lbl.style.left = left + 'px';
    lbl.style.top = top + 'px';
    parent.appendChild(lbl);
}

/**
 * Desenha um retângulo arredondado no canvas (path apenas; não preenche/contorna).
 */
export function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
