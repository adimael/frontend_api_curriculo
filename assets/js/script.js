'use strict';

const API_URL =
    'https://vupi.us/adimael/api/curriculo';

const jsonElement =
    document.getElementById('json');

const inputElement =
    document.getElementById('search');

const popupElement =
    document.getElementById('search-popup');

const counterElement =
    document.getElementById('search-counter');

const previousButton =
    document.getElementById('previous-result');

const nextButton =
    document.getElementById('next-result');

const closeButton =
    document.getElementById('close-search');

let curriculo = null;

let resultados = [];

let indiceAtual = -1;

/*
|--------------------------------------------------------------------------
| Ícones
|--------------------------------------------------------------------------
*/

function atualizarIcones() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

// A função buscarCurriculo é fornecida por assets/js/api.js.

/*
|--------------------------------------------------------------------------
| Segurança e formatação
|--------------------------------------------------------------------------
*/

function escaparHtml(valor) {
    return String(valor)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escaparExpressaoRegular(valor) {
    return valor.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

/*
|--------------------------------------------------------------------------
| Destaque da sintaxe JSON
|--------------------------------------------------------------------------
*/

function destacarJson(dados) {
    const texto = JSON.stringify(
        dados,
        null,
        4
    );

    const textoSeguro =
        escaparHtml(texto);

    return textoSeguro.replace(
        /(&quot;(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\&])*&quot;)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g,

        (
            correspondencia,
            string,
            chave,
            numero,
            booleano,
            nulo
        ) => {
            if (string) {
                const classe = chave
                    ? 'json-key'
                    : 'json-string';

                return (
                    `<span class="${classe}">`
                    + `${string}</span>${chave ?? ''}`
                );
            }

            if (numero) {
                return (
                    `<span class="json-number">`
                    + `${numero}</span>`
                );
            }

            if (booleano) {
                return (
                    `<span class="json-boolean">`
                    + `${booleano}</span>`
                );
            }

            if (nulo) {
                return (
                    `<span class="json-null">`
                    + `${nulo}</span>`
                );
            }

            return correspondencia;
        }
    );
}

/*
|--------------------------------------------------------------------------
| Destaque da pesquisa
|--------------------------------------------------------------------------
*/

function destacarPesquisa(html, termo) {
    const termoLimpo = termo.trim();

    if (termoLimpo === '') {
        return html;
    }

    const termoSeguro =
        escaparHtml(termoLimpo);

    const expressao = new RegExp(
        `(${escaparExpressaoRegular(termoSeguro)})`,
        'gi'
    );

    /*
     * Separa as tags HTML do texto para evitar alterações
     * em nomes de classes e atributos.
     */
    return html
        .split(/(<[^>]+>)/g)
        .map((parte) => {
            if (parte.startsWith('<')) {
                return parte;
            }

            return parte.replace(
                expressao,
                '<mark class="json-highlight">$1</mark>'
            );
        })
        .join('');
}

/*
|--------------------------------------------------------------------------
| Pop-up e resultados
|--------------------------------------------------------------------------
*/

function coletarResultados() {
    resultados = Array.from(
        jsonElement.querySelectorAll(
            '.json-highlight'
        )
    );

    if (resultados.length === 0) {
        indiceAtual = -1;
        return;
    }

    indiceAtual = 0;
}

function atualizarPopup() {
    const termo =
        inputElement.value.trim();

    if (termo === '') {
        popupElement.hidden = true;
        return;
    }

    popupElement.hidden = false;

    if (resultados.length === 0) {
        counterElement.textContent =
            'Nenhum resultado';

        previousButton.disabled = true;
        nextButton.disabled = true;

        return;
    }

    counterElement.textContent =
        `${indiceAtual + 1} de ${resultados.length}`;

    const apenasUmResultado =
        resultados.length === 1;

    previousButton.disabled =
        apenasUmResultado;

    nextButton.disabled =
        apenasUmResultado;
}

function exibirResultadoAtual() {

    resultados.forEach((resultado) => {
        resultado.classList.remove('current-result');
    });

    if (
        indiceAtual < 0 ||
        resultados.length === 0
    ) {
        atualizarPopup();
        return;
    }

    const resultadoAtual = resultados[indiceAtual];

    resultadoAtual.classList.add('current-result');

    const container = jsonElement;

    container.scrollTo({

        top:
            resultadoAtual.offsetTop
            - (container.clientHeight / 2)
            + (resultadoAtual.clientHeight / 2),

        left:
            resultadoAtual.offsetLeft
            - (container.clientWidth / 2)
            + (resultadoAtual.clientWidth / 2),

        behavior: 'smooth'

    });

    atualizarPopup();
}

function irParaProximoResultado() {
    if (resultados.length === 0) {
        return;
    }

    indiceAtual =
        (indiceAtual + 1)
        % resultados.length;

    exibirResultadoAtual();
}

function irParaResultadoAnterior() {
    if (resultados.length === 0) {
        return;
    }

    indiceAtual =
        (
            indiceAtual
            - 1
            + resultados.length
        )
        % resultados.length;

    exibirResultadoAtual();
}

function limparPesquisa() {
    inputElement.value = '';

    renderizarCurriculo('');

    inputElement.focus();
}

/*
|--------------------------------------------------------------------------
| Renderização
|--------------------------------------------------------------------------
*/

function renderizarCurriculo(filtro = '') {
    if (!curriculo) {
        return;
    }

    const jsonComCores =
        destacarJson(curriculo);

    jsonElement.innerHTML =
        destacarPesquisa(
            jsonComCores,
            filtro
        );

    coletarResultados();
    atualizarPopup();

    /*
     * Aguarda o navegador concluir a renderização
     * dos elementos <mark>.
     */
    if (resultados.length > 0) {
        requestAnimationFrame(() => {
            exibirResultadoAtual();
        });
    }
}

function mostrarCarregamento() {
    jsonElement.innerHTML =
        destacarJson({
            status: 'carregando',
            mensagem: 'Buscando currículo na API...'
        });
}

function mostrarErro(erro) {
    jsonElement.innerHTML =
        destacarJson({
            status: 'erro',
            mensagem: erro.message
        });
}

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

async function carregarCurriculo() {
    mostrarCarregamento();

    inputElement.disabled = true;

    try {
        curriculo =
            await buscarCurriculo();

        renderizarCurriculo();
    } catch (erro) {
        console.error(
            'Erro ao carregar currículo:',
            erro
        );

        mostrarErro(erro);
    } finally {
        inputElement.disabled = false;

        atualizarIcones();
    }
}

/*
|--------------------------------------------------------------------------
| Eventos
|--------------------------------------------------------------------------
*/

inputElement.addEventListener(
    'input',
    (evento) => {
        renderizarCurriculo(
            evento.target.value
        );
    }
);

inputElement.addEventListener(
    'keydown',
    (evento) => {
        if (evento.key === 'Enter') {
            evento.preventDefault();

            if (evento.shiftKey) {
                irParaResultadoAnterior();
                return;
            }

            irParaProximoResultado();
        }

        if (evento.key === 'Escape') {
            limparPesquisa();
        }
    }
);

previousButton.addEventListener(
    'click',
    irParaResultadoAnterior
);

nextButton.addEventListener(
    'click',
    irParaProximoResultado
);

closeButton.addEventListener(
    'click',
    limparPesquisa
);

atualizarIcones();
carregarCurriculo();