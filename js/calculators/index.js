/**
 * Registry de calculadoras de pinázio.
 *
 * Cada calculadora é um objeto que segue o contrato:
 *
 *   {
 *     id:    string              // identificador único (usado no select e ao salvar no pedido)
 *     label: string              // nome amigável exibido na UI
 *     descricao?: string         // descrição curta opcional
 *     calcular(input): Resultado // função pura — recebe inputs do form, retorna resultado + breakdown
 *   }
 *
 * Resultado:
 *   {
 *     ok: boolean,
 *     erro?: string,
 *     barrasVerticais:   [{ medida: string, quantidade: number }],
 *     barrasHorizontais: [{ medida: string, quantidade: number }],
 *     conectores: number,
 *     realSegmentWidths:  number[],   // tamanhos reais (mm) usados no preview
 *     realSegmentHeights: number[],
 *     breakdown: Breakdown            // estrutura do cálculo visível (ver pinazioAntigo.js)
 *   }
 *
 * Para adicionar um novo tipo de pinázio:
 *   1. Crie um arquivo js/calculators/seuTipo.js seguindo o contrato acima.
 *   2. Importe-o aqui e adicione a CALCULATORS.
 */

import { pinazioAntigo } from './pinazioAntigo.js';
import { pinazioNovo } from './pinazioNovo.js';

const CALCULATORS = {
    [pinazioAntigo.id]: pinazioAntigo,
    [pinazioNovo.id]: pinazioNovo,
};

/**
 * Lista as calculadoras disponíveis (para popular o <select>).
 */
export function listCalculators() {
    return Object.values(CALCULATORS);
}

/**
 * Recupera uma calculadora pelo id. Lança se não existir
 * — chamadores devem garantir que o id veio do select populado por listCalculators().
 */
export function getCalculator(id) {
    const calc = CALCULATORS[id];
    if (!calc) throw new Error(`Calculadora desconhecida: ${id}`);
    return calc;
}

/**
 * Id da calculadora padrão (default no select).
 */
export const DEFAULT_CALCULATOR_ID = pinazioAntigo.id;
