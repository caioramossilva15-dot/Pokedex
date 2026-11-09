const listaDeFavoritos = document.querySelector("#lista-favoritos");

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

let todosOsFavoritos = [];
let paginaAtual = 0;
let tamanhoPagina = Number(seletorCards?.value || 50);
let carregandoFavoritos = false;

function atualizarBotaoDeFavorito(botao, idPokemon) {
    const favorito = idsFavoritos.has(String(idPokemon));
    botao.classList.toggle("ativo", favorito);
    botao.setAttribute("aria-label", favorito ? "Desfavoritar Pokémon" : "Favoritar Pokémon");
    botao.title = favorito ? "Remover dos favoritos" : "Adicionar aos favoritos";
}

function atualizarControlesPaginacao() {
    const totalPaginas = Math.max(1, Math.ceil(todosOsFavoritos.length / tamanhoPagina));

    if (botaoPaginaAnterior) {
        botaoPaginaAnterior.disabled = carregandoFavoritos || paginaAtual === 0;
    }
    if (botaoProximaPagina) {
        botaoProximaPagina.disabled =
            carregandoFavoritos || (paginaAtual + 1) * tamanhoPagina >= todosOsFavoritos.length;
    }
    if (informacaoPagina) {
        informacaoPagina.textContent =
            todosOsFavoritos.length === 0
                ? "Nenhum favorito"
                : `Página ${paginaAtual + 1} de ${totalPaginas} — ${todosOsFavoritos.length} favorito(s)`;
    }
}

function criarCardPokemon(pokemon) {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");
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
            alert("Entre na sua conta para gerenciar seus favoritos.");
            return;
        }

        const id = String(pokemon.id);
        const eraFavorito = idsFavoritos.has(id);
        botaoFavorito.disabled = true;

        try {
            if (eraFavorito) {
                await desfavoritarPokemon(guidPerson, id);
                idsFavoritos.delete(id);
                todosOsFavoritos = todosOsFavoritos.filter(favorito => String(favorito) !== id);

                const ultimaPagina = Math.max(0, Math.ceil(todosOsFavoritos.length / tamanhoPagina) - 1);
                if (paginaAtual > ultimaPagina) paginaAtual = ultimaPagina;

                await renderizarPaginaFavoritos();
            } else {
                await favoritarPokemon(guidPerson, id);
                idsFavoritos.add(id);
                if (!todosOsFavoritos.some(favorito => String(favorito) === id)) {
                    todosOsFavoritos.push(id);
                }
                await renderizarPaginaFavoritos();
            }
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
            alert("Não foi possível atualizar os favoritos. Tente novamente.");
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

async function renderizarPaginaFavoritos() {
    if (!listaDeFavoritos || carregandoFavoritos) return;

    carregandoFavoritos = true;
    atualizarControlesPaginacao();

    try {
        if (todosOsFavoritos.length === 0) {
            listaDeFavoritos.textContent = "Você ainda não tem favoritos.";
            return;
        }

        const inicio = paginaAtual * tamanhoPagina;
        const favoritosDaPagina = todosOsFavoritos.slice(inicio, inicio + tamanhoPagina);

        const detalhes = await Promise.all(
            favoritosDaPagina.map(id =>
                buscarDetalhesPokemon(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(id)}`)
            )
        );

        listaDeFavoritos.replaceChildren();
        detalhes.forEach(pokemon => {
            listaDeFavoritos.appendChild(criarCardPokemon(pokemon));
        });
    } catch (error) {
        console.error("Erro ao carregar Pokémon favoritos:", error);
        listaDeFavoritos.textContent = "Não foi possível carregar os favoritos. Tente novamente.";
    } finally {
        carregandoFavoritos = false;
        atualizarControlesPaginacao();
    }
}

async function carregarFavoritos() {
    if (!listaDeFavoritos) return;

    const guidPerson = sessionStorage.getItem("guidPerson");

    if (!guidPerson) {
        todosOsFavoritos = [];
        idsFavoritos.clear();
        listaDeFavoritos.textContent = "Entre na sua conta para visualizar seus favoritos.";
        atualizarControlesPaginacao();
        return;
    }

    try {
        const favoritos = await buscarFavoritos(guidPerson);

        todosOsFavoritos = Array.isArray(favoritos)
            ? [...new Set(favoritos.map(id => String(id)))]
            : [];

        idsFavoritos.clear();
        todosOsFavoritos.forEach(id => idsFavoritos.add(id));

        paginaAtual = 0;
        await renderizarPaginaFavoritos();
    } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        listaDeFavoritos.textContent = "Não foi possível carregar os favoritos.";
        atualizarControlesPaginacao();
    }
}

seletorCards?.addEventListener("change", () => {
    tamanhoPagina = Number(seletorCards.value);
    paginaAtual = 0;
    renderizarPaginaFavoritos();
});

botaoPaginaAnterior?.addEventListener("click", () => {
    if (paginaAtual > 0 && !carregandoFavoritos) {
        paginaAtual--;
        renderizarPaginaFavoritos();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

botaoProximaPagina?.addEventListener("click", () => {
    if ((paginaAtual + 1) * tamanhoPagina < todosOsFavoritos.length && !carregandoFavoritos) {
        paginaAtual++;
        renderizarPaginaFavoritos();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

carregarFavoritos();
