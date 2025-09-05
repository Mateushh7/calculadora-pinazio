    // Variáveis globais
    let realSegmentWidths = [];
    let realSegmentHeights = [];
    let specifiedSegmentWidths = [];
    let specifiedSegmentHeights = [];
    // Margens para cotas
    const totalLabelMargin = 30;
    const miniTotalLabelMargin = 25;
    const totalLabelMarginHorizontal = 15;
    const miniTotalLabelMarginHorizontal = 12;
    const segmentLabelMargin = 8;
    const miniSegmentLabelMargin = 3;
    let currentPedido = { numero: '', pecas: [] };
    let lastCalculatedPieceSummary = null;
    const larguraPinazio = 18;

    // --- Funções Principais ---

    /**
     * Calcula as dimensões e quantidades de pinázios e atualiza a seção de resultados e preview.
     * *** AJUSTE: Validação para campos vazios/inválidos adicionada ***
     * *** ALTERAÇÃO 28/04/2025: Aplica descontoBordaDim incondicionalmente ***
     */
    function calcular() {
        console.log(`--- Iniciando Cálculo ---`);
        // 1. Coleta e Validação Inicial de Inputs

        const quantidadeInput = document.getElementById('quantidade');
        const larguraInput = document.getElementById('largura');
        const alturaInput = document.getElementById('altura');
        const vaosHorizontaisInput = document.getElementById('vaosHorizontais');
        const vaosVerticaisInput = document.getElementById('vaosVerticais');

        const quantidadeValueStr = quantidadeInput.value.trim();
        const larguraValueStr = larguraInput.value.trim();
        const alturaValueStr = alturaInput.value.trim();

        const quantidade = parseInt(quantidadeValueStr);
        const largura = parseFloat(larguraValueStr);
        const altura = parseFloat(alturaValueStr);
        const numVaosHorizontais = parseInt(vaosHorizontaisInput.value) || 1;
        const numVaosVerticais = parseInt(vaosVerticaisInput.value) || 1;

        const specifySegmentsChecked = document.getElementById('specifySegments').checked;
        const ambienteNome = document.getElementById('ambienteNome').value.trim() || 'Ambiente';

        // *** Validação Aprimorada ***
        if (
            quantidadeValueStr === '' || larguraValueStr === '' || alturaValueStr === '' ||
            isNaN(quantidade) || isNaN(largura) || isNaN(altura) ||
            quantidade < 1 || largura <= 0 || altura <= 0 ||
            numVaosHorizontais < 1 || numVaosVerticais < 1
        ) {
            showError('Por favor, preencha Quantidade (>0), Largura (>0) e Altura (>0) com valores numéricos válidos.');
            limparPreview();
            document.getElementById('previewTitleAmbiente').textContent = '';
            document.getElementById('downloadImageButton').style.display = 'none';
            document.getElementById('captureContainer').style.display = 'none';
            document.getElementById('resultadoQuantidade').textContent = '';
            lastCalculatedPieceSummary = null;
            return; // Impede a continuação do cálculo
        }
        // *** Fim da Validação Aprimorada ***

        // 2. Constantes e Cálculos Derivados
        const descontoPerfil = 14, descontoPoli = 10, descontoBordaDim = 2;
        const numBarrasVerticais = numVaosHorizontais - 1;
        const numBarrasHorizontais = numVaosVerticais - 1;

        // 3. Cálculo do Espaço Disponível para Segmentos
        // *** ALTERADO AQUI (28/04/2025): descontoBordaDim aplicado incondicionalmente ***
        const larguraDisponivelParaSegmentos = largura - descontoPerfil - descontoPoli - (numBarrasVerticais * larguraPinazio) - descontoBordaDim;
        const alturaDisponivelParaSegmentos = altura - descontoPerfil - descontoPoli - (numBarrasHorizontais * larguraPinazio) - descontoBordaDim;

        if (larguraDisponivelParaSegmentos < -0.01 || alturaDisponivelParaSegmentos < -0.01) {
            showError('Erro: As dimensões da peça são insuficientes para acomodar os descontos e as barras.');
            limparPreview();
             document.getElementById('previewTitleAmbiente').textContent = '';
            document.getElementById('downloadImageButton').style.display = 'none';
            document.getElementById('captureContainer').style.display = 'none';
             document.getElementById('resultadoQuantidade').textContent = '';
            lastCalculatedPieceSummary = null;
            return;
        }
         const finalLarguraDisponivel = Math.max(0, larguraDisponivelParaSegmentos);
         const finalAlturaDisponivel = Math.max(0, alturaDisponivelParaSegmentos);

        // 4. Determinação dos Tamanhos Reais dos Segmentos
        let calculationError = false;
        let errorMessage = '';
        realSegmentWidths = [];
        realSegmentHeights = [];

        if (specifySegmentsChecked && (numVaosHorizontais > 1 || numVaosVerticais > 1)) {
            const specifiedWidths = [...specifiedSegmentWidths];
            const specifiedHeights = [...specifiedSegmentHeights];
            let sumSpecifiedWidths = specifiedWidths.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            let sumSpecifiedHeights = specifiedHeights.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const floatTolerance = 0.01;

            if (numVaosHorizontais > 1 && Math.abs(sumSpecifiedWidths - largura) > floatTolerance) {
                 errorMessage = `Erro Largura: Soma (${sumSpecifiedWidths.toFixed(2)}mm) != Largura Total (${largura.toFixed(2)}mm).`; calculationError = true;
            }
            if (!calculationError && numVaosVerticais > 1 && Math.abs(sumSpecifiedHeights - altura) > floatTolerance) {
                 errorMessage = `Erro Altura: Soma (${sumSpecifiedHeights.toFixed(2)}mm) != Altura Total (${altura.toFixed(2)}mm).`; calculationError = true;
            }
            if (!calculationError && ((numVaosHorizontais > 1 && specifiedWidths.some(w => parseFloat(w) <= 0 || isNaN(parseFloat(w)))) || (numVaosVerticais > 1 && specifiedHeights.some(h => parseFloat(h) <= 0 || isNaN(parseFloat(h)))))) {
                 errorMessage = "Erro: Tamanhos especificados devem ser > 0."; calculationError = true;
            }

            if (!calculationError) {
                 realSegmentWidths = (numVaosHorizontais === 1) ? [finalLarguraDisponivel] : specifiedWidths.map(w => (w / (sumSpecifiedWidths || largura || 1)) * finalLarguraDisponivel);
                 realSegmentHeights = (numVaosVerticais === 1) ? [finalAlturaDisponivel] : specifiedHeights.map(h => (h / (sumSpecifiedHeights || altura || 1)) * finalAlturaDisponivel);
                 if (realSegmentWidths.some(w => w < -floatTolerance) || realSegmentHeights.some(h => h < -floatTolerance)) { errorMessage = 'Erro interno: Cálculo resultou em tamanhos negativos.'; calculationError = true; }
            }
        } else {
            const larguraSegmentoIgual = numVaosHorizontais > 0 ? finalLarguraDisponivel / numVaosHorizontais : 0;
            const alturaSegmentoIgual = numVaosVerticais > 0 ? finalAlturaDisponivel / numVaosVerticais : 0;
            realSegmentWidths = Array(numVaosHorizontais).fill(larguraSegmentoIgual);
            realSegmentHeights = Array(numVaosVerticais).fill(alturaSegmentoIgual);
        }

        realSegmentWidths = realSegmentWidths.map(w => Math.max(0, w));
        realSegmentHeights = realSegmentHeights.map(h => Math.max(0, h));

        // 5. Exibição de Erros ou Resultados
        if (calculationError) {
            showError(errorMessage); limparPreview(); document.getElementById('previewTitleAmbiente').textContent = ''; document.getElementById('downloadImageButton').style.display = 'none'; document.getElementById('captureContainer').style.display = 'none'; document.getElementById('resultadoQuantidade').textContent = '';
            if (specifySegmentsChecked) updateSegmentInputWarning(errorMessage); lastCalculatedPieceSummary = null; return;
        } else { updateSegmentInputWarning(''); }

        // 6. Cálculo de Quantidades Totais
        const totalConectores = quantidade * numBarrasVerticais * numBarrasHorizontais;

        // 7. Montagem do Resumo e HTML de Resultado
        lastCalculatedPieceSummary = {
             ambiente: ambienteNome, barrasVerticais: [], barrasHorizontais: [], conectores: totalConectores,
             previewParams: { larguraTotal: largura, alturaTotal: altura, numVaosHorizontais: numVaosHorizontais, numVaosVerticais: numVaosVerticais, numBarrasVerticais: numBarrasVerticais, numBarrasHorizontais: numBarrasHorizontais, larguraPinazio: larguraPinazio, realSegmentWidths: [...realSegmentWidths], realSegmentHeights: [...realSegmentHeights], specifySegmentsChecked: specifySegmentsChecked, specifiedSegmentWidths: [...specifiedSegmentWidths], specifiedSegmentHeights: [...specifiedSegmentHeights] }
        };
        document.getElementById('resultadoQuantidade').textContent = `Quantidade de peças: ${quantidade}`;
        let resultadoHTML = `<h3 class="font-semibold mb-1 mt-2" style="color: var(--cor-primaria);">Resumo das barras:</h3><table class="results-table text-sm"><thead><tr><th>Tipo</th><th>Medida (mm)</th><th>Qtd Total</th></tr></thead><tbody>`;
        const verticalBarSummary = {}; if (numBarrasVerticais > 0) { realSegmentHeights.forEach(size => { if (size > 0.01) { const rS = size.toFixed(2); verticalBarSummary[rS] = (verticalBarSummary[rS] || 0) + numBarrasVerticais; } }); for (const s in verticalBarSummary) { const sF = parseFloat(s); const tQ = verticalBarSummary[s] * quantidade; if (sF > 0 && tQ > 0) { resultadoHTML += `<tr><td>Vertical</td><td>${sF.toFixed(2)}</td><td>${tQ}</td></tr>`; lastCalculatedPieceSummary.barrasVerticais.push({ medida: sF.toFixed(2), quantidade: tQ }); } } }
        const horizontalBarSummary = {}; if (numBarrasHorizontais > 0) { realSegmentWidths.forEach(size => { if (size > 0.01) { const rS = size.toFixed(2); horizontalBarSummary[rS] = (horizontalBarSummary[rS] || 0) + numBarrasHorizontais; } }); for (const s in horizontalBarSummary) { const sF = parseFloat(s); const tQ = horizontalBarSummary[s] * quantidade; if (sF > 0 && tQ > 0) { resultadoHTML += `<tr><td>Horizontal</td><td>${sF.toFixed(2)}</td><td>${tQ}</td></tr>`; lastCalculatedPieceSummary.barrasHorizontais.push({ medida: sF.toFixed(2), quantidade: tQ }); } } }
        resultadoHTML += `</tbody></table>`; if (totalConectores > 0) { resultadoHTML += `<p class="font-semibold mb-1 mt-4" style="color: var(--cor-primaria);">Conectores:</p>${totalConectores} unidades<br>`; }
        document.getElementById('resultado').innerHTML = resultadoHTML; console.log("Resultados atualizados.");

        // 8. Desenho do Preview Principal
        document.getElementById('previewTitleAmbiente').textContent = `Ambiente: ${ambienteNome}`;
        desenharPreview(largura, altura, numVaosHorizontais, numVaosVerticais, numBarrasVerticais, numBarrasHorizontais, larguraPinazio, realSegmentWidths, realSegmentHeights, specifySegmentsChecked, specifiedSegmentWidths, specifiedSegmentHeights);
        document.getElementById('captureContainer').style.display = 'grid'; document.getElementById('downloadImageButton').style.display = 'inline-block'; console.log(`--- Fim do Cálculo ---`);
    }

    /** Limpa preview */
    function limparPreview() {
         const peca = document.getElementById('preview-peca'); const previewDiv = document.querySelector('.preview');
         peca.innerHTML = ''; peca.style.width = '0px'; peca.style.height = '0px';
         previewDiv.querySelectorAll('.dimension-label').forEach(label => label.remove());
         document.getElementById('captureContainer').style.display = 'none'; document.getElementById('previewTitleAmbiente').textContent = ''; console.log("Preview limpo.");
    }

    /** Gera/oculta inputs dinâmicos */
    function generateDynamicSegmentInputs() {
         const container = document.getElementById('segmentInputContainer'); const specifyCheckbox = document.getElementById('specifySegments');
         const numVaosH = parseInt(document.getElementById('vaosHorizontais').value) || 1; const numVaosV = parseInt(document.getElementById('vaosVerticais').value) || 1;
         if (!specifyCheckbox.checked || (numVaosH <= 1 && numVaosV <= 1)) { container.style.display = 'none'; container.innerHTML = ''; specifiedSegmentWidths = []; specifiedSegmentHeights = []; updateSegmentInputWarning(''); if (document.getElementById('captureContainer').style.display !== 'none') calcular(); return; }
         container.style.display = 'block'; container.innerHTML = `<h3 class="text-lg font-semibold mb-3" style="color: var(--cor-primaria);">Tamanhos Específicos (mm)</h3><p class="text-sm text-red-600 segment-input-warning" id="segmentInputWarning"></p>`;
         if (numVaosH > 1) { let h = '<div class="dynamic-input-group"><label>Larguras Vãos Horizontais:</label><div class="dynamic-inputs">'; for (let j = 0; j < numVaosH; j++) { h += `<input type="number" min="0.1" step="0.1" data-dimension="width" data-index="${j}">`; } h += '</div></div>'; container.innerHTML += h; }
         if (numVaosV > 1) { let h = '<div class="dynamic-input-group"><label>Alturas Vãos Verticais:</label><div class="dynamic-inputs">'; for (let i = 0; i < numVaosV; i++) { h += `<input type="number" min="0.1" step="0.1" data-dimension="height" data-index="${i}">`; } h += '</div></div>'; container.innerHTML += h; }
         container.querySelectorAll('input[type="number"]').forEach(input => input.addEventListener('input', handleDynamicInputChange)); populateDynamicInputsWithCalculatedValues(); if (document.getElementById('captureContainer').style.display !== 'none') calcular();
    }

    /** Atualiza arrays com inputs dinâmicos */
     function handleDynamicInputChange(event) { const i = event.target; const d = i.dataset.dimension; const x = parseInt(i.dataset.index); const v = parseFloat(i.value) || 0; if (d === 'width') specifiedSegmentWidths[x] = v; else if (d === 'height') specifiedSegmentHeights[x] = v; }

    /** Preenche inputs dinâmicos */
     function populateDynamicInputsWithCalculatedValues() { const nH = parseInt(document.getElementById('vaosHorizontais').value) || 1; const nV = parseInt(document.getElementById('vaosVerticais').value) || 1; const l = parseFloat(document.getElementById('largura').value) || 0; const a = parseFloat(document.getElementById('altura').value) || 0; const lS = nH > 0 ? l / nH : 0; const aS = nV > 0 ? a / nV : 0; const useS = specifiedSegmentWidths.length === nH && specifiedSegmentHeights.length === nV && specifiedSegmentWidths.every(v => typeof v === 'number') && specifiedSegmentHeights.every(v => typeof v === 'number'); if (!useS) { specifiedSegmentWidths = Array(nH).fill(lS); specifiedSegmentHeights = Array(nV).fill(aS); } document.querySelectorAll('#segmentInputContainer input[data-dimension="width"]').forEach((inp, idx) => { const val = specifiedSegmentWidths[idx]; inp.value = (val >= 0 && !isNaN(val)) ? val.toFixed(2) : ''; specifiedSegmentWidths[idx] = parseFloat(inp.value) || 0; }); document.querySelectorAll('#segmentInputContainer input[data-dimension="height"]').forEach((inp, idx) => { const val = specifiedSegmentHeights[idx]; inp.value = (val >= 0 && !isNaN(val)) ? val.toFixed(2) : ''; specifiedSegmentHeights[idx] = parseFloat(inp.value) || 0; }); }

    /** Exibe mensagens de erro */
     function showError(message) { document.getElementById('resultado').innerHTML = `<p class="text-red-600">${message}</p>`; if (document.getElementById('specifySegments').checked) updateSegmentInputWarning(message); console.error("Erro:", message); }

    /** Atualiza aviso nos inputs dinâmicos */
     function updateSegmentInputWarning(message) { const w = document.getElementById('segmentInputWarning'); if (w) w.textContent = message; }

     /** Desenha preview principal */
     function desenharPreview(lT, aT, nVH, nVV, nBV, nBH, lP, rSW, rSH, sSC, sSW, sSH) { const pC = document.querySelector('.preview'); const pE = document.getElementById('preview-peca'); desenharPecaGenerico(pC, pE, { larguraTotal: lT, alturaTotal: aT, numVaosHorizontais: nVH, numVaosVerticais: nVV, numBarrasVerticais: nBV, numBarrasHorizontais: nBH, larguraPinazio: lP, realSegmentWidths: rSW, realSegmentHeights: rSH, specifySegmentsChecked: sSC, specifiedSegmentWidths: sSW, specifiedSegmentHeights: sSH }, 450, totalLabelMargin, totalLabelMarginHorizontal, segmentLabelMargin); }

     /** Desenha mini-preview */
     function desenharMiniPreview(targetContainer, params) { const mPE = document.createElement('div'); mPE.classList.add('peca'); targetContainer.innerHTML = ''; targetContainer.appendChild(mPE); desenharPecaGenerico(targetContainer, mPE, params, 200, miniTotalLabelMargin, miniTotalLabelMarginHorizontal, miniSegmentLabelMargin); }

     /** Função Genérica para Desenhar Peça */
     function desenharPecaGenerico(containerElement, pecaElement, params, maxDimVisual, cotaTotalMargemVertical, cotaTotalMargemHorizontal, cotaSegmentoMargem) {
         console.log(`Desenho (Max: ${maxDimVisual})`); const { larguraTotal, alturaTotal, numVaosHorizontais, numVaosVerticais, numBarrasVerticais, numBarrasHorizontais, larguraPinazio, realSegmentWidths, realSegmentHeights, specifySegmentsChecked, specifiedSegmentWidths, specifiedSegmentHeights } = params;
         pecaElement.innerHTML = ''; containerElement.querySelectorAll('.dimension-label').forEach(l => l.remove());
         const minDimVisual = maxDimVisual * 0.1; let scale = 0; if (larguraTotal > 0 && alturaTotal > 0) { scale = Math.min(maxDimVisual / larguraTotal, maxDimVisual / alturaTotal); const sWT = larguraTotal * scale, sHT = alturaTotal * scale; if (sWT < minDimVisual && larguraTotal > 0) scale = Math.max(scale, minDimVisual / larguraTotal); if (sHT < minDimVisual && alturaTotal > 0) scale = Math.max(scale, minDimVisual / alturaTotal); const fSW = larguraTotal * scale, fSH = alturaTotal * scale; if (Math.max(fSW, fSH) > maxDimVisual) scale = maxDimVisual / Math.max(larguraTotal, alturaTotal); } else return;
         const scaledLarguraTotal = larguraTotal * scale; const scaledAlturaTotal = alturaTotal * scale; const scaledLarguraPinazio = Math.max(0.5, larguraPinazio * scale);
         pecaElement.style.width = scaledLarguraTotal + 'px'; pecaElement.style.height = scaledAlturaTotal + 'px'; pecaElement.offsetWidth;
         const larguraRealSum = realSegmentWidths.reduce((s, w) => s + w, 0); const alturaRealSum = realSegmentHeights.reduce((s, h) => s + h, 0); const visualEspacoW = Math.max(0, scaledLarguraTotal - numBarrasVerticais * scaledLarguraPinazio); const visualEspacoH = Math.max(0, scaledAlturaTotal - numBarrasHorizontais * scaledLarguraPinazio); const visualW = realSegmentWidths.map(w => Math.max(0, (w / (larguraRealSum || larguraTotal || 1)) * visualEspacoW)); const visualH = realSegmentHeights.map(h => Math.max(0, (h / (alturaRealSum || alturaTotal || 1)) * visualEspacoH));
         if ((numVaosHorizontais > 0 || numVaosVerticais > 0) && scaledLarguraTotal >= 1 && scaledAlturaTotal >= 1) {
             if (visualW.some(w => w < -0.01) || visualH.some(h => h < -0.01)) { console.error("Erro visual: Segmentos < 0"); return; }
             let cTSD = 0; for (let i = 0; i < numVaosVerticais; i++) { let cLSD = 0; for (let j = 0; j < numVaosHorizontais; j++) { if (visualW[j] > 0 && visualH[i] > 0) createDiv(pecaElement, ['divisao-segmento'], cLSD, cTSD, visualW[j], visualH[i]); cLSD += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0); } cTSD += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0); }
             if (numBarrasVerticais > 0) { let bL = 0; for (let j = 0; j < numBarrasVerticais; j++) { bL += visualW[j]; let bT = 0; for (let i = 0; i < numVaosVerticais; i++) { if (visualH[i] > 0 && scaledLarguraPinazio > 0) createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-vertical-peca'], bL, bT, scaledLarguraPinazio, visualH[i]); bT += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0); } bL += scaledLarguraPinazio; } }
             if (numBarrasHorizontais > 0) { let bT = 0; for (let i = 0; i < numBarrasHorizontais; i++) { bT += visualH[i]; let bL = 0; for (let j = 0; j < numVaosHorizontais; j++) { if (visualW[j] > 0 && scaledLarguraPinazio > 0) createDiv(pecaElement, ['divisao-pinazio-peca', 'pinazio-horizontal-peca'], bL, bT, visualW[j], scaledLarguraPinazio); bL += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0); } bT += scaledLarguraPinazio; } }
             if (numBarrasVerticais > 0 && numBarrasHorizontais > 0 && scaledLarguraPinazio > 0) { let cL = 0; for (let i = 0; i < numBarrasVerticais; i++) { cL += visualW[i]; let cT = 0; for (let j = 0; j < numBarrasHorizontais; j++) { cT += visualH[j]; createDiv(pecaElement, ['conector-visual'], cL, cT, scaledLarguraPinazio, scaledLarguraPinazio); cT += scaledLarguraPinazio; } cL += scaledLarguraPinazio; } }
         }
         requestAnimationFrame(() => {
             if (!document.body.contains(containerElement) || !document.body.contains(pecaElement)) { console.warn("Preview removido."); return; }
             const cR = containerElement.getBoundingClientRect(); const pR = pecaElement.getBoundingClientRect(); const pOX = pR.left - cR.left; const pOY = pR.top - cR.top;
             createDimensionLabel(containerElement, `${larguraTotal.toFixed(1)}`, pOX + scaledLarguraTotal / 2, pOY - cotaTotalMargemVertical, true, false);
             createDimensionLabel(containerElement, `${alturaTotal.toFixed(1)}`, pOX + scaledLarguraTotal + cotaTotalMargemHorizontal, pOY + scaledAlturaTotal / 2, true, true);
             if ((numVaosHorizontais > 0 || numVaosVerticais > 0) && scaledLarguraTotal >= 1 && scaledAlturaTotal >= 1) {
                  let cTS = 0; for (let i = 0; i < numVaosVerticais; i++) { let cLS = 0; for (let j = 0; j < numVaosHorizontais; j++) { if (i === numVaosVerticais - 1 && numVaosHorizontais > 0) { const wS = specifySegmentsChecked && specifiedSegmentWidths[j] !== undefined ? specifiedSegmentWidths[j] : (larguraTotal / numVaosHorizontais); if (!isNaN(wS)) createDimensionLabel(containerElement, `${wS.toFixed(1)}`, pOX + cLS + visualW[j] / 2, pOY + scaledAlturaTotal + cotaSegmentoMargem, false, false); } if (j === 0 && numVaosVerticais > 0) { const hS = specifySegmentsChecked && specifiedSegmentHeights[i] !== undefined ? specifiedSegmentHeights[i] : (alturaTotal / numVaosVerticais); if (!isNaN(hS)) createDimensionLabel(containerElement, `${hS.toFixed(1)}`, pOX - cotaSegmentoMargem, pOY + cTS + visualH[i] / 2, false, true); } cLS += visualW[j] + (j < numBarrasVerticais ? scaledLarguraPinazio : 0); } cTS += visualH[i] + (i < numBarrasHorizontais ? scaledLarguraPinazio : 0); }
                 }
         });
         console.log(`--- Fim Desenho ---`);
     }

    /** Adiciona peça ao pedido */
    function adicionarPecaAoPedido() {
        console.log("Adicionando Peça..."); if (!lastCalculatedPieceSummary || !lastCalculatedPieceSummary.previewParams) { alert("Calcule uma peça antes de adicionar."); return; }
        const pN = document.getElementById('pedidoNumero').value.trim(); const aN = document.getElementById('ambienteNome').value.trim();
        if (pN === '') { alert("Preencha o Número do Pedido."); document.getElementById('pedidoNumero').focus(); return; } if (aN === '') { alert("Preencha o Nome do Ambiente."); document.getElementById('ambienteNome').focus(); return; }
        if (currentPedido.numero === '' || currentPedido.numero !== pN) { currentPedido.numero = pN; currentPedido.pecas = []; console.log(`Pedido: ${pN}`); }
        const pPCopy = JSON.parse(JSON.stringify(lastCalculatedPieceSummary.previewParams)); const nP = { ambiente: aN, resumoBarras: [ ...lastCalculatedPieceSummary.barrasVerticais.map(b => ({ ...b, tipo: 'Vertical' })), ...lastCalculatedPieceSummary.barrasHorizontais.map(b => ({ ...b, tipo: 'Horizontal' })) ], conectores: lastCalculatedPieceSummary.conectores, dimensoes: { quantidade: parseInt(document.getElementById('quantidade').value) || 1, largura: parseFloat(document.getElementById('largura').value) || 0, altura: parseFloat(document.getElementById('altura').value) || 0, vaosHorizontais: parseInt(document.getElementById('vaosHorizontais').value) || 1, vaosVerticais: parseInt(document.getElementById('vaosVerticais').value) || 1, especificarSegmentos: document.getElementById('specifySegments').checked }, previewParams: pPCopy };
        currentPedido.pecas.push(nP); updatePedidoPecasList(); document.getElementById('ambienteNome').value = ''; lastCalculatedPieceSummary = null; document.getElementById('resultado').innerHTML = `<p>Peça <strong>"${aN}"</strong> adicionada ao Pedido <strong>${pN}</strong>.</p>`; limparPreview(); document.getElementById('captureContainer').style.display = 'none'; alert(`Peça "${aN}" adicionada ao Pedido ${pN}!`); document.getElementById('ambienteNome').focus();
    }

    /** Atualiza lista de peças */
    function updatePedidoPecasList() { const lC = document.getElementById('pedidoPecasList'); const pH = document.getElementById('pedidoHeader'); lC.innerHTML = ''; let tPF = 0; currentPedido.pecas.forEach(p => { tPF += p.dimensoes.quantidade; }); if (pH) { pH.innerHTML = `Pedido: <span id="pedidoNumeroDisplay">${currentPedido.numero || 'N/A'}</span> (<span id="pedidoTotalPecas">${tPF}</span> peças)`; } if (currentPedido.pecas.length === 0) { lC.innerHTML = '<p class="text-gray-600">Nenhuma peça adicionada.</p>'; return; } currentPedido.pecas.forEach((peca, index) => { const pID = document.createElement('div'); pID.classList.add('pedido-peca-item'); const dD = document.createElement('div'); dD.classList.add('peca-item-details'); let iH = `<h4>Ambiente: ${peca.ambiente}</h4><p class="text-xs text-gray-600 mb-2">(${peca.dimensoes.quantidade}x ${peca.dimensoes.largura}mm x ${peca.dimensoes.altura}mm${peca.dimensoes.especificarSegmentos ? ', Seg. Espec.' : ''})</p>`; if (peca.resumoBarras.length > 0) { iH += `<h5 class="font-semibold mb-1 text-sm" style="color: var(--cor-primaria);">Barras:</h5><table class="results-table"><thead><tr><th>Tipo</th><th>Medida (mm)</th><th>Qtd Total</th></tr></thead><tbody>`; peca.resumoBarras.forEach(b => { iH += `<tr><td>${b.tipo}</td><td>${b.medida}</td><td>${b.quantidade}</td></tr>`; }); iH += `</tbody></table>`; } else { iH += `<p class="text-xs mt-2">Nenhuma barra.</p>`; } if (peca.conectores > 0) { iH += `<p class="text-sm mt-2">Conectores: ${peca.conectores} unidades</p>`; } else { iH += `<p class="text-xs mt-2">Nenhum conector.</p>`; } dD.innerHTML = iH; const mPD = document.createElement('div'); mPD.classList.add('mini-preview-container'); pID.appendChild(dD); pID.appendChild(mPD); const dB = document.createElement('button'); dB.classList.add('delete-button'); dB.textContent = 'Excluir'; dB.addEventListener('click', () => excluirPecaDoPedido(index)); pID.appendChild(dB); lC.appendChild(pID); requestAnimationFrame(() => { if (document.body.contains(mPD)) { desenharMiniPreview(mPD, peca.previewParams); } }); }); }

    /** Remove peça */
    function excluirPecaDoPedido(index) { if (index < 0 || index >= currentPedido.pecas.length) { console.error("Índice inválido:", index); return; } if (confirm(`Excluir peça "${currentPedido.pecas[index].ambiente}"?`)) { currentPedido.pecas.splice(index, 1); updatePedidoPecasList(); console.log("Peça excluída."); } else { console.log("Exclusão cancelada."); } }

    /** Cria label de dimensão */
    function createDimensionLabel(parent, valueText, left, top, isTotal, isVertical) { let dTxt = valueText; const numV = parseFloat(valueText); if (!isNaN(numV)) { dTxt = (Math.abs(numV - Math.round(numV)) < 0.01) ? numV.toFixed(0) : numV.toFixed(1); } if (isNaN(left) || isNaN(top)) { console.warn("Posição inválida:", dTxt, left, top); return; } const lbl = document.createElement('div'); lbl.classList.add('dimension-label'); if (isTotal) lbl.classList.add('total-dimension-label'); if (isVertical) { lbl.classList.add('segment-label-vertical'); lbl.style.transform = 'translateY(-50%) rotate(90deg)'; if (!isTotal) lbl.style.transform = 'translateX(-100%) translateY(-50%) rotate(-90deg)'; } else { lbl.classList.add('segment-label-horizontal'); } lbl.textContent = dTxt; lbl.style.left = left + 'px'; lbl.style.top = top + 'px'; parent.appendChild(lbl); }

    /** Cria div genérica */
    function createDiv(parent, classes, left, top, width, height) { if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height) || isNaN(left) || isNaN(top)) return; const div = document.createElement('div'); classes.forEach(c => div.classList.add(c)); div.style.position = 'absolute'; div.style.left = left + 'px'; div.style.top = top + 'px'; div.style.width = width + 'px'; div.style.height = height + 'px'; parent.appendChild(div); }

    /** Download Imagem */
    function handleDownloadImage() { const pN = document.getElementById('pedidoNumero').value.trim() || 'sN'; const aN = document.getElementById('ambienteNome').value.trim() || 'sA'; const tE = document.getElementById('captureContainer'); const dBtn = document.getElementById('downloadImageButton'); const aBtn = document.getElementById('addPieceButton'); if (!tE) { console.error("Elem. captura não encontrado."); alert("Erro ao gerar imagem."); return; } console.log("Capturando imagem..."); if (dBtn) dBtn.style.display = 'none'; if (aBtn) aBtn.style.display = 'none'; html2canvas(tE, { scale: 2, useCORS: true, logging: false }).then(c => { console.log("Canvas gerado."); const iDU = c.toDataURL('image/png'); const lnk = document.createElement('a'); lnk.href = iDU; lnk.download = `${aN} - ${pN}.png`; document.body.appendChild(lnk); lnk.click(); document.body.removeChild(lnk); console.log("Download imagem iniciado."); if (dBtn) dBtn.style.display = 'inline-block'; if (aBtn) aBtn.style.display = 'flex'; }).catch(e => { console.error("Erro html2canvas:", e); alert("Erro ao gerar imagem."); if (dBtn) dBtn.style.display = 'inline-block'; if (aBtn) aBtn.style.display = 'flex'; }); }

    /** Download PDF */
    async function handleDownloadPDF() { const { jsPDF } = window.jspdf; const pN = document.getElementById('pedidoNumero').value.trim() || 'sP'; const lC = document.getElementById('pedidoPecasList'); const items = lC.querySelectorAll('.pedido-peca-item'); const dBtn = document.getElementById('downloadPdfButton'); if (items.length === 0) { alert("Nenhuma peça para gerar PDF."); return; } console.log("Gerando PDF..."); if(dBtn) { dBtn.textContent = "Gerando..."; dBtn.disabled = true; } const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }); const pW = pdf.internal.pageSize.getWidth(); const pH = pdf.internal.pageSize.getHeight(); const m = 15; const aW = pW - m * 2; let y = m; const hTxt = document.getElementById('pedidoHeader').innerText; pdf.setFontSize(14); pdf.text(hTxt, m, y); y += 10; const delBtns = lC.querySelectorAll('.delete-button'); delBtns.forEach(b => b.style.visibility = 'hidden'); for (let i = 0; i < items.length; i++) { const item = items[i]; console.log(`Item PDF ${i + 1}...`); try { const canvas = await html2canvas(item, { scale: 2, useCORS: true, logging: false, backgroundColor: window.getComputedStyle(item).backgroundColor || '#ffffff' }); const iD = canvas.toDataURL('image/png'); const iW = canvas.width; const iH = canvas.height; const sF = aW / iW; const fIW = iW * sF; const fIH = iH * sF; if (y + fIH > pH - m) { pdf.addPage(); y = m; } pdf.addImage(iD, 'PNG', m, y, fIW, fIH); y += fIH + 5; } catch (e) { console.error(`Erro item ${i + 1}:`, e); } } delBtns.forEach(b => b.style.visibility = 'visible'); if(dBtn) { dBtn.textContent = "Download Pedido (PDF)"; dBtn.disabled = false; } pdf.save(`PINAZIOS ${pN}.pdf`); console.log("PDF Gerado."); }

    // --- Event Listeners ---
    document.getElementById('specifySegments').addEventListener('change', generateDynamicSegmentInputs);
    document.getElementById('vaosHorizontais').addEventListener('input', function() { const nV = parseInt(this.value) || 1; if (specifiedSegmentWidths.length !== nV) specifiedSegmentWidths = []; if (document.getElementById('specifySegments').checked) generateDynamicSegmentInputs(); else if (document.getElementById('captureContainer').style.display !== 'none') calcular(); });
    document.getElementById('vaosVerticais').addEventListener('input', function() { const nV = parseInt(this.value) || 1; if (specifiedSegmentHeights.length !== nV) specifiedSegmentHeights = []; if (document.getElementById('specifySegments').checked) generateDynamicSegmentInputs(); else if (document.getElementById('captureContainer').style.display !== 'none') calcular(); });
    document.getElementById('calculateButton').addEventListener('click', calcular);
    document.getElementById('addPieceButton').addEventListener('click', adicionarPecaAoPedido);
    document.getElementById('downloadImageButton').addEventListener('click', handleDownloadImage);
    document.getElementById('downloadPdfButton').addEventListener('click', handleDownloadPDF);

    // Inicialização
     document.addEventListener('DOMContentLoaded', function() {
         updatePedidoPecasList(); // Atualiza cabeçalho
         document.getElementById('captureContainer').style.display = 'none'; // Esconde preview inicial
       });

