(() => {
    const entrada = document.querySelector("#pesquisa-pokemon");
    const opcoesTipos = document.querySelector("#tipos-opcoes");
    const recentes = document.querySelector("#pesquisas-recentes");
    const resultado = document.querySelector("#resultado-filtro");
    const lista = document.querySelector("#lista-pokemon, #lista-favoritos");

    if (!entrada || !opcoesTipos || !lista) return;

    const tipos = [
        ["normal", "Normal"], ["fire", "Fogo"], ["water", "Água"],
        ["electric", "Elétrico"], ["grass", "Planta"], ["ice", "Gelo"],
        ["fighting", "Lutador"], ["poison", "Veneno"], ["ground", "Terra"],
        ["flying", "Voador"], ["psychic", "Psíquico"], ["bug", "Inseto"],
        ["rock", "Pedra"], ["ghost", "Fantasma"], ["dragon", "Dragão"],
        ["dark", "Sombrio"], ["steel", "Aço"], ["fairy", "Fada"]
    ];
    const chaveRecentes = "pokedex-pesquisas-recentes";
    const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    opcoesTipos.innerHTML = tipos.map(([valor, rotulo]) =>
        `<label class="tipo-opcao"><input type="checkbox" value="${valor}"><span>${rotulo}</span></label>`
    ).join("");

    function lerRecentes() {
        try {
            const dados = JSON.parse(localStorage.getItem(chaveRecentes) || "[]");
            return Array.isArray(dados) ? dados.filter(item => typeof item === "string") : [];
        } catch {
            return [];
        }
    }

    function guardarPesquisa(valor) {
        const pesquisa = valor.trim();
        if (!pesquisa) return;
        const anteriores = lerRecentes().filter(item => normalizar(item) !== normalizar(pesquisa));
        anteriores.unshift(pesquisa);
        localStorage.setItem(chaveRecentes, JSON.stringify(anteriores.slice(0, 5)));
        renderizarRecentes();
    }

    function renderizarRecentes() {
        const historico = lerRecentes();
        recentes.replaceChildren();
        if (!historico.length) return;
        const titulo = document.createElement("span");
        titulo.className = "recentes-titulo";
        titulo.textContent = "Pesquisas recentes:";
        recentes.appendChild(titulo);
        historico.forEach(nome => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "pesquisa-recente";
            botao.textContent = nome;
            botao.addEventListener("click", () => {
                entrada.value = nome;
                aplicarFiltros();
                notificarBuscaGlobal();
                guardarPesquisa(nome);
            });
            recentes.appendChild(botao);
        });
        const limpar = document.createElement("button");
        limpar.type = "button";
        limpar.className = "limpar-recentes";
        limpar.textContent = "Apagar histórico";
        limpar.addEventListener("click", () => {
            localStorage.removeItem(chaveRecentes);
            renderizarRecentes();
        });
        recentes.appendChild(limpar);
    }

    function aplicarFiltros() {
        const termo = normalizar(entrada.value);

        const selecionados = [...opcoesTipos.querySelectorAll('input:checked')].map(input => input.value);
        const cards = [...lista.querySelectorAll(".pokemon-card")];
        let visiveis = 0;

        cards.forEach(card => {
            const nome = normalizar(card.dataset.nome || card.querySelector(".pokemon-nome")?.textContent || "");
            const tiposPokemon = (card.dataset.tipos || "").split(",").filter(Boolean);
            const nomeCorresponde = !termo || nome.includes(termo);
            // Vários tipos selecionados funcionam como OU: basta corresponder a um deles.
            const tipoCorresponde = !selecionados.length || selecionados.some(tipo => tiposPokemon.includes(tipo));
            const mostrar = nomeCorresponde && tipoCorresponde;
            card.hidden = !mostrar;
            if (mostrar) visiveis++;
        });

        if (cards.length) {
            resultado.textContent = `${visiveis} de ${cards.length} Pokémon${cards.length === 1 ? "" : "s"} exibido${visiveis === 1 ? "" : "s"}.`;
        } else {
            resultado.textContent = "";
        }
    }

    function notificarBuscaGlobal() {
        if (lista.id === "lista-pokemon") {
            window.dispatchEvent(new CustomEvent("pokedex:search", {
                detail: { termo: entrada.value }
            }));
        }
    }

    entrada.addEventListener("input", () => {
        aplicarFiltros();
        notificarBuscaGlobal();
    });
    entrada.addEventListener("keydown", evento => {
        if (evento.key === "Enter") guardarPesquisa(entrada.value);
    });
    document.querySelector("#limpar-pesquisa")?.addEventListener("click", () => {
        entrada.value = "";
        aplicarFiltros();
        notificarBuscaGlobal();
        entrada.focus();
    });
    document.querySelector("#limpar-filtros")?.addEventListener("click", () => {
        opcoesTipos.querySelectorAll('input:checked').forEach(input => input.checked = false);
        aplicarFiltros();
    });
    opcoesTipos.addEventListener("change", aplicarFiltros);

    new MutationObserver(aplicarFiltros).observe(lista, { childList: true });
    renderizarRecentes();
    aplicarFiltros();
})();
