const listaDePokemons = document.querySelector("#lista-pokemon");

async function buscarDetalhesPokemon(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error("Não foi possível buscar dados do Pokémon.");
    }
    return resposta.json();
}

const idsFavoritos = new Set();
const seletorCards = document.querySelector("#cards-por-pagina");
const botaoPaginaAnterior = document.querySelector("#pagina-anterior");
const botaoProximaPagina = document.querySelector("#proxima-pagina");
const informacaoPagina = document.querySelector("#pagina-info");

let paginaAtual = 0;
let tamanhoPagina = Number(seletorCards?.value || 50);
let totalPokemons = 0;
let proximaPaginaDisponivel = false;
let carregandoPokemons = false;
let favoritosCarregados = false;
let termoBuscaGlobal = "";
let listaCompletaPokemons = null;
let resultadosBuscaGlobal = [];
let requisicaoAtual = 0;

function normalizarBuscaPokemon(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function atualizarBotaoDeFavorito(botao, idPokemon) {
    const favorito = idsFavoritos.has(String(idPokemon));
    botao.classList.toggle("ativo", favorito);
    botao.setAttribute("aria-label", favorito ? "Desfavoritar Pokémon" : "Favoritar Pokémon");
    botao.title = favorito ? "Remover dos favoritos" : "Adicionar aos favoritos";
}

const $ = (id) => document.getElementById(id);

function criarCardPokemon(pokemon) {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");
    card.value = `${pokemon.id}`;
    card.dataset.nome = pokemon.name;
    card.dataset.tipos = pokemon.types.map(item => item.type.name).join(",");

    const numero = String(pokemon.id).padStart(4, "0");
    const nome = pokemon.name.toUpperCase();
    const tipos = pokemon.types.map(item => item.type.name.toUpperCase()).join(" / ");
    const imagem = pokemon.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const altura = pokemon.height / 10;
    const peso = pokemon.weight / 10;

    const botaoFavorito = document.createElement("button");
    botaoFavorito.classList.add("favoritar-pokemon");
    botaoFavorito.type = "button";
    botaoFavorito.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M5 20h3v2H3v-6h2v4Zm16 2h-5v-2h3v-4h2v6Zm-11-2H8v-2h2v2Zm6 0h-2v-2h2v2Zm-2-2h-4v-2h4v2Zm-7-2H5v-3h2v3Zm12 0h-2v-3h2v3ZM5 13H3v-2h2v2Zm16 0h-2v-2h2v2ZM9 9H3V7h8v2Zm14 2h-2V9h-6V7h8v4ZM11 7H9V3h2v4Zm4 0h-2V3h2v4Zm-2-4h-2V1h2v2Z"/></svg>`;
    atualizarBotaoDeFavorito(botaoFavorito, pokemon.id);

    botaoFavorito.addEventListener("click", async () => {
        event.stopPropagation();
        const guidPerson = sessionStorage.getItem("guidPerson");
        if (!guidPerson) {
            alert("Entre na sua conta para favoritar Pokémon.");
            return;
        }

        const id = String(pokemon.id);
        const eraFavorito = idsFavoritos.has(id);
        botaoFavorito.disabled = true;

        if (eraFavorito) {
            idsFavoritos.delete(id);
        } else {
            idsFavoritos.add(id);
        }
        atualizarBotaoDeFavorito(botaoFavorito, id);

        try {
            if (eraFavorito) {
                await desfavoritarPokemon(guidPerson, id);
            } else {
                await favoritarPokemon(guidPerson, id);
            }
        } catch (error) {
            console.error("Falha ao atualizar favorito:", error);
            if (eraFavorito) {
                idsFavoritos.add(id);
            } else {
                idsFavoritos.delete(id);
            }
            atualizarBotaoDeFavorito(botaoFavorito, id);
            alert("A API não confirmou a alteração do favorito.");
        } finally {
            botaoFavorito.disabled = false;
        }
    });

    card.addEventListener("click", () => {
        const blurBg = document.createElement("div");
        blurBg.classList.add("blur-bg");

        const cardDetalhado = document.createElement("div");
        cardDetalhado.classList.add("card-detalhado");

        cardDetalhado.innerHTML = `
            <button class="fechar-detalhes" type="button" aria-label="Fechar">
                &times;
            </button>
            
            <h2>${nome}</h2>

            <section class="lower-card-info">
                <img src="${imagem}" alt="${nome}">

                <section class="poke-stats">
                    <label>TIPO:</label>
                    <div class="stats-bar">${tipos}</div>

                    <label>ALTURA:</label>
                    <div class="stats-bar">${altura} m</div>

                    <label>PESO:</label>
                    <div class="stats-bar">${peso} kg</div>
                </section>
            </section>
        `;

        blurBg.append(cardDetalhado);

        document.body.append(blurBg);

        const botaoFechar = cardDetalhado.querySelector(".fechar-detalhes");

        botaoFechar.addEventListener("click", () => {
            blurBg.remove();
        });

        blurBg.addEventListener("click", (event) => {
            if (event.target === blurBg) {
                blurBg.remove();
            }
        });
    });

    const identifier = document.createElement("p");
    identifier.classList.add("pokemon-id");
    identifier.textContent = `#${numero}`;

    const imagemPokemon = document.createElement("img");
    imagemPokemon.src = imagem;
    imagemPokemon.alt = nome;
    imagemPokemon.loading = "lazy";

    const nomePokemon = document.createElement("span");
    nomePokemon.classList.add("pokemon-nome");
    nomePokemon.textContent = nome;

    const tipoPokemon = document.createElement("span");
    tipoPokemon.classList.add("pokemon-tipo");
    tipoPokemon.textContent = tipos;

    card.append(identifier, botaoFavorito, imagemPokemon, nomePokemon, tipoPokemon);
    return card;
}

function mostrarDetalhes() {

}

function atualizarControlesPaginacao() {
    if (botaoPaginaAnterior) {
        botaoPaginaAnterior.disabled = carregandoPokemons || paginaAtual === 0;
    }
    if (botaoProximaPagina) {
        botaoProximaPagina.disabled = carregandoPokemons || !proximaPaginaDisponivel;
    }
    if (informacaoPagina) {
        const totalPaginas = Math.max(1, Math.ceil(totalPokemons / tamanhoPagina));
        informacaoPagina.textContent = `Página ${paginaAtual + 1} de ${totalPaginas} — ${totalPokemons} Pokémon no total`;
    }
}

async function carregarPokemons() {
    if (!listaDePokemons) return;

    const idRequisicao = ++requisicaoAtual;
    carregandoPokemons = true;
    atualizarControlesPaginacao();

    try {
        if (!favoritosCarregados) {
            const guidPerson = sessionStorage.getItem("guidPerson");
            if (guidPerson && typeof buscarFavoritos === "function") {
                try {
                    const favoritos = await buscarFavoritos(guidPerson);
                    idsFavoritos.clear();
                    if (Array.isArray(favoritos)) {
                        favoritos.forEach(id => idsFavoritos.add(String(id)));
                    }
                } catch (error) {
                    console.warn("Não foi possível carregar os favoritos do treinador:", error);
                }
            }
            favoritosCarregados = true;
        }

        let resultadosDaPagina;
        const offset = paginaAtual * tamanhoPagina;

        if (termoBuscaGlobal) {
            // Carrega a lista de nomes uma única vez para permitir pesquisar
            // Pokémon que ainda não estão na página visível.
            if (!listaCompletaPokemons) {
                const respostaLista = await fetch(
                    "https://pokeapi.co/api/v2/pokemon?limit=20000&offset=0"
                );
                if (!respostaLista.ok) {
                    throw new Error("Não foi possível carregar a lista completa de Pokémon.");
                }
                const dadosLista = await respostaLista.json();
                listaCompletaPokemons = dadosLista.results;
            }

            const termoNormalizado = normalizarBuscaPokemon(termoBuscaGlobal);
            resultadosBuscaGlobal = listaCompletaPokemons.filter(pokemon =>
                normalizarBuscaPokemon(pokemon.name).includes(termoNormalizado)
            );

            totalPokemons = resultadosBuscaGlobal.length;
            proximaPaginaDisponivel = offset + tamanhoPagina < totalPokemons;
            resultadosDaPagina = resultadosBuscaGlobal.slice(offset, offset + tamanhoPagina);
        } else {
            const resposta = await fetch(
                `https://pokeapi.co/api/v2/pokemon?limit=${tamanhoPagina}&offset=${offset}`
            );
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar a lista de Pokémon.");
            }

            const dados = await resposta.json();
            totalPokemons = dados.count;
            proximaPaginaDisponivel = Boolean(dados.next);
            resultadosDaPagina = dados.results;
        }

        const detalhes = await Promise.all(
            resultadosDaPagina.map(pokemon => buscarDetalhesPokemon(pokemon.url))
        );

        // Ignora respostas antigas caso o usuário tenha digitado outra pesquisa
        // enquanto as requisições anteriores ainda estavam carregando.
        if (idRequisicao !== requisicaoAtual) return;

        listaDePokemons.replaceChildren();

        detalhes.forEach(pokemon => {
            listaDePokemons.appendChild(criarCardPokemon(pokemon));
        });

        if (informacaoPagina) {
            const totalPaginas = Math.max(1, Math.ceil(totalPokemons / tamanhoPagina));
            const descricao = termoBuscaGlobal ? "resultado(s) da pesquisa" : "Pokémon no total";
            informacaoPagina.textContent =
                `Página ${paginaAtual + 1} de ${totalPaginas} — ${totalPokemons} ${descricao}`;
        }
    } catch (error) {
        console.error("Erro ao carregar Pokémon:", error);
        if (informacaoPagina) {
            informacaoPagina.textContent = "Não foi possível carregar os Pokémon. Tente novamente.";
        }
    } finally {
        if (idRequisicao === requisicaoAtual) {
            carregandoPokemons = false;
            atualizarControlesPaginacao();
        }
    }
}

window.addEventListener("pokedex:search", evento => {
    termoBuscaGlobal = String(evento.detail?.termo || "").trim();
    paginaAtual = 0;
    carregarPokemons();
});

seletorCards?.addEventListener("change", () => {
    tamanhoPagina = Number(seletorCards.value);
    paginaAtual = 0;
    carregarPokemons();
});

botaoPaginaAnterior?.addEventListener("click", () => {
    if (paginaAtual > 0 && !carregandoPokemons) {
        paginaAtual--;
        carregarPokemons();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

botaoProximaPagina?.addEventListener("click", () => {
    if (proximaPaginaDisponivel && !carregandoPokemons) {
        paginaAtual++;
        carregarPokemons();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

carregarPokemons();

const modal = document.querySelector('.modal-container')
const fraquezas = document.querySelector('.fraquezas-container')
const info = document.querySelector('.poke-info')
const modalInfo = document.querySelector('.modal-info')
const modalSecondInfo = document.querySelector('.modal-second-info')

const pokePrevious = document.querySelector('.poke-previous')
const pokeballPrevious = document.querySelector('.pokeball-left')

const pokeNext = document.querySelector('.poke-next')
const pokeballNext = document.querySelector('.pokeball-right')

const cards = document.querySelectorAll('.d-card-border')

const observer = new IntersectionObserver((entries) => {

    entries.forEach((entry, index) => {

        if (entry.isIntersecting) {

            setTimeout(() => {
                entry.target.classList.add('show');
            }, index * 100);

        }

    });

});

cards.forEach((card) => {
    observer.observe(card);
});


function mudarTema() {
            document.body.classList.toggle('light-theme');
        }
        
function poke(direction){
    if (direction === 'previous'){
        pokeballNext.classList.remove('pokeball-animation')
        pokeNext.classList.remove('click')
        pokePrevious.classList.add('click')
        pokeballPrevious.classList.add('pokeball-animation')
    } else {
        pokeballPrevious.classList.remove('pokeball-animation')
        pokePrevious.classList.remove('click')
        pokeNext.classList.add('click')
        pokeballNext.classList.add('pokeball-animation')
    }
}

function openPage(pagina) {
    if (pagina === 'habilidades'){
        modal.classList.add('active')
        fraquezas.classList.remove('active')
    } else {
        fraquezas.classList.add('active')
        modal.classList.remove('active')
    }
}

function closePage(pagina) {
    if (pagina === 'habilidades'){
        modal.classList.remove('active')
    } else {
        fraquezas.classList.remove('active')
    }
}

function nextPage(pagina) {
     if (pagina === 'habilidades'){
        if (getComputedStyle(modalInfo).display == 'flex') {
            modalInfo.classList.add('modal-text-quit')
            modalInfo.style.display = 'none';
            modalSecondInfo.style.display = 'flex';
        } else {
            modalSecondInfo.classList.add('modal-text-quit')
            modalSecondInfo.style.display = 'none';
            modalInfo.style.display = 'flex';
        }
    } else {

    }
}

function previousPage(pagina) {
    if (pagina === 'habilidades'){
        if (getComputedStyle(modalInfo).display == 'flex') {
            modalInfo.classList.add('modal-text-quit')
            modalInfo.style.display = 'none';
            modalSecondInfo.style.display = 'flex';
        } else {
            modalSecondInfo.classList.add('modal-text-quit')
            modalSecondInfo.style.display = 'none';
            modalInfo.style.display = 'flex';
        }
    } else {

    }
}

// let medico = {
//     nome: "Caio",
    
//     idade: 6767,
//     pacientes: [
//         {
//             nome: "João",
//             idade: 20
//         },
//         {
//             nome: "Douglas",
//             idade: 23
//         },
//         {
//             nome: "Giovanna",
//             idade: 18
//         },
//     ],

//     imprimirPacientes: function(){
//         this.pacientes.forEach((paciente)=>{
//             console.log(`Paciente ${paciente.nome}, idade:${paciente.idade}`);
//         })
//     }
// }