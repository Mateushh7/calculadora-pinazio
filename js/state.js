/**
 * Estado mutável compartilhado da aplicação.
 *
 * Mantemos como módulo singleton (re-export de um objeto) para que todos os
 * módulos vejam a mesma instância. Cada módulo importa apenas o que precisa.
 */

export const state = {
    /**
     * Pedido em construção. Quando o número do pedido muda, a lista de peças é zerada.
     * @type {{ numero: string, pecas: Array }}
     */
    currentPedido: { numero: '', pecas: [] },

    /**
     * Resumo da última peça calculada (o que será adicionado ao pedido se o usuário confirmar).
     * Setado por calculators/* e lido por ui/pedido.js + export/download.js.
     * @type {object|null}
     */
    lastCalculatedPieceSummary: null,

    /**
     * Tamanhos especificados manualmente quando o checkbox "Especificar divisões individualmente" está ativo.
     * Mantidos aqui para sobreviver entre chamadas de calcular().
     */
    specifiedSegmentWidths: [],
    specifiedSegmentHeights: [],
};

export function resetSpecifiedSegments() {
    state.specifiedSegmentWidths = [];
    state.specifiedSegmentHeights = [];
}
