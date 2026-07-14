const API_CURRICULO_URL =
    'https://vupi.us/adimael/api/curriculo';

/**
 * Busca o currículo completo na API.
 *
 * @returns {Promise<object>}
 */
async function buscarCurriculo() {
    const resposta = await fetch(API_CURRICULO_URL, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!resposta.ok) {
        let mensagem = `Erro HTTP ${resposta.status}`;

        try {
            const erro = await resposta.json();

            mensagem =
                erro.erro ??
                erro.message ??
                erro.mensagem ??
                mensagem;
        } catch {
            // Mantém a mensagem padrão caso a resposta não seja JSON.
        }

        throw new Error(mensagem);
    }

    const resultado = await resposta.json();

    if (
        !resultado ||
        typeof resultado !== 'object' ||
        !resultado.dados
    ) {
        throw new Error(
            'A API retornou uma estrutura de dados inválida.'
        );
    }

    return resultado.dados;
}