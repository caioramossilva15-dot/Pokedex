const formTreinador = document.querySelector("#form-treinador");

const criacaoDeTreinador = document.querySelector('#criar-treinador');
const loginDeTreinador = document.querySelector('#entrar-treinador');
const perfilDeTreinador = document.querySelector('#perfil-treinador');

function mostrarTreinador(treinador){
    if (!perfilDeTreinador) return;

    perfilDeTreinador.style.display = "flex";

    const nomeTreinador = document.querySelector("#perfil-nome");
    const usernameTreinador = document.querySelector("#perfil-username");
    const idadeTreinador = document.querySelector("#perfil-nascimento");

    nomeTreinador.textContent = `${treinador.Name} ${treinador.Surename}`;
    usernameTreinador.textContent = `${treinador.Username}`;
    idadeTreinador.textContent = treinador.Birthday;

    atualizarIconePerfil(treinador.Icone);
}

function sairDaConta() {
    perfilDeTreinador.style.display = "none";
    sessionStorage.setItem("guidPerson", "");
    sessionStorage.setItem("treinador", "");
}

async function buscarGuidByUsername(username) {
    const resposta = await fetch(`https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/GuidByUsername?Username=${encodeURIComponent(username)}`)    
    const guidPerson = await resposta.text();
    return guidPerson;
}

async function buscarTreinadorByGuid(guidPerson) {
    const resposta = await fetch(`https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/PersonByGuid?Guid=${encodeURIComponent(guidPerson)}`)    
    const treinador = await resposta.json();
    return treinador;
}

async function buscarTreinador(username) {
    const guidPerson = await buscarGuidByUsername(username);
    const treinador = await buscarTreinadorByGuid(guidPerson);
    return treinador;
}

async function buscarFavoritos(guidPerson) {
    const resposta = await fetch(`https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/FavoritosByGuidPerson?GuidPerson=${encodeURIComponent(guidPerson)}`)
    console.log("Status da consulta:", resposta.status);
    const favoritos = await resposta.text();
    console.log("Resposta bruta da consulta:", favoritos);
    try {
        return JSON.parse(favoritos);
    } catch {
        return favoritos;
    }
}


async function favoritarPokemon(guidPerson, idPokemon) {
    const resposta = await fetch(
        `https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/FavoritarPokemon?GuidPerson=${encodeURIComponent(guidPerson)}&PokemonGuid=${encodeURIComponent(idPokemon)}`,
        {
            method: "POST"
        }
    );

    if (!resposta.ok) {
        throw new Error(`Erro ao favoritar: HTTP ${resposta.status}`);
    }

    return true;
}


async function desfavoritarPokemon(guidPerson, idPokemon) {
    const resposta = await fetch(
        `https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/DesfavoritarPokemon?GuidPerson=${encodeURIComponent(guidPerson)}&PokemonGuid=${encodeURIComponent(idPokemon)}`,
        {
            method: "DELETE"
        }
    );

    if (!resposta.ok) {
        throw new Error(`Erro ao desfavoritar: HTTP ${resposta.status}`);
    }

    return true;
}


formTreinador?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.querySelector("#nome").value.trim();
    const sobrenome = document.querySelector("#sobrenome").value.trim();
    const username = document.querySelector("#username").value.trim();
    const idade = document.querySelector("#nascimento").value;

    const dadosTreinador = {
    Name: nome,
    Surename: sobrenome,
    Username: username,
    Birthday: idade
    };

    const resposta = await fetch("https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede/Person", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosTreinador)
    });

    const guidPerson = await resposta.text();

    const treinador = await buscarTreinadorByGuid(guidPerson);

    const icone = imagensIcones[indiceIcone];

    treinador.Icone = icone;

    sessionStorage.setItem("guidPerson", guidPerson);
    salvarIcone(guidPerson, icone);

    sessionStorage.setItem(
        "treinador",
        JSON.stringify(treinador)
    );

    criacaoDeTreinador.style.display = "none";

    mostrarTreinador(treinador);

    const favoritosAtualizados = await buscarFavoritos(guidPerson);

    console.log("Favoritos atualizados:", favoritosAtualizados);
});

const formLogin = document.querySelector("#form-login");

formLogin?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username-login").value.trim();
    const guidPerson = await buscarGuidByUsername(username);
    const treinador = await buscarTreinadorByGuid(guidPerson);

    let icone = obterIconeSalvo(guidPerson);

    if (!icone || !imagensIcones.includes(icone)) {
        icone = sortearIconeValor();
    }

    treinador.Icone = icone;
    salvarIcone(guidPerson, icone);

    sessionStorage.setItem("guidPerson", guidPerson);
    sessionStorage.setItem("treinador", JSON.stringify(treinador));

    console.log("Treinador:", treinador);

    loginDeTreinador.style.display = "none";

    mostrarTreinador(treinador);
});

function abrirFormulario(tipo) {
    if (tipo === 'cadastro') {
        sortearIcone();

        criacaoDeTreinador.style.display = "flex";
        criacaoDeTreinador.style.opacity = 1;
    } else {
        loginDeTreinador.style.display = "flex";
        loginDeTreinador.style.opacity = 1;
    }
}

const hero = document.querySelector("#hero-treinador");
const botaoCriar = document.querySelector("#cadastro");
const botaoEntrar = document.querySelector("#login");

let camadaParticulas = null;
let particulas = [];
let emTransicao = false;
let heroDesintegrado = false;

function criarParticulas() {
    // A camada fica no body, fora do hero.
    camadaParticulas = document.createElement("div");
    camadaParticulas.className = "hero-particulas";
    document.body.appendChild(camadaParticulas);

    particulas = [];

    // Partículas sobre os textos e botões.
    const elementos = hero.querySelectorAll("p, button");

    elementos.forEach(elemento => {
        const retangulo = elemento.getBoundingClientRect();
        const area = retangulo.width * retangulo.height;

        // Limita a quantidade para evitar excesso de elementos.
        const quantidade = Math.min(
            90,
            Math.max(12, Math.floor(area / 180))
        );

        for (let i = 0; i < quantidade; i++) {
            const particula = document.createElement("span");
            particula.className = "particula-pixel";

            const tamanho = Math.random() * 4 + 2;

            particula.style.width = `${tamanho}px`;
            particula.style.height = `${tamanho}px`;

            particula.style.left =
                `${retangulo.left + Math.random() * retangulo.width}px`;

            particula.style.top =
                `${retangulo.top + Math.random() * retangulo.height}px`;

            camadaParticulas.appendChild(particula);

            const dx = (Math.random() - 0.5) * 120;
            const dy = (Math.random() - 0.5) * 120;

            const animacao = particula.animate(
                [
                    {
                        transform: "translate(0, 0)",
                        opacity: 1
                    },
                    {
                        transform: `translate(${dx}px, ${dy}px)`,
                        opacity: 0
                    }
                ],
                {
                    duration: 700 + Math.random() * 200,
                    delay: Math.random() * 120,
                    easing: "ease-out",
                    fill: "forwards"
                }
            );

            particulas.push({
                elemento: particula,
                dx,
                dy,
                animacao
            });
        }
    });
}

async function desintegrarHero() {
    if (emTransicao || heroDesintegrado) return;

    emTransicao = true;

    criarParticulas();

    // O hero inteiro desaparece.
    hero.classList.remove("voltando");
    hero.classList.add("saindo");

    await Promise.all(
        particulas.map(particula => particula.animacao.finished)
    );

    heroDesintegrado = true;
    emTransicao = false;
}

async function reconstruirHero() {
    if (emTransicao || !heroDesintegrado) return;

    emTransicao = true;

    hero.classList.remove("saindo");
    hero.classList.add("voltando");

    const voltas = particulas.map(particula => {
        const { elemento, dx, dy } = particula;

        const animacaoVolta = elemento.animate(
            [
                {
                   transform: `translate(${dx}px, ${dy}px)`, 
                   opacity: 0
                },
                {
                    transform: `translate(${dx * 0.65}px, ${dy * 0.65}px)`,
                    opacity: 0.9,
                    offset: 0.2
                },
                {
                    transform: `translate(${dx * 0.12}px, ${dy * 0.12}px)`,
                    opacity: 0
                }
            ],
            {
                duration: 450 + Math.random() * 180,
                delay: Math.random() * 100,
                easing: "ease-in",
                fill: "forwards"
            }
        );

        return animacaoVolta.finished;
    });

    await Promise.all(voltas);

    camadaParticulas?.remove();
    camadaParticulas = null;
    particulas = [];

    hero.classList.remove("voltando");

    heroDesintegrado = false;
    emTransicao = false;
}

botaoCriar?.addEventListener("click", () => {
    abrirFormulario("cadastro");
    desintegrarHero();
});

botaoEntrar?.addEventListener("click", () => {
    abrirFormulario("login");
    desintegrarHero();
});

document.querySelectorAll(".quit-form").forEach(botao => {
    botao.addEventListener("click", () => {
        if (criacaoDeTreinador) criacaoDeTreinador.style.display = "none";
        if (loginDeTreinador) loginDeTreinador.style.display = "none";

        reconstruirHero();
    });
});

// Ícones disponíveis para cadastro e perfil.
const imagensIcones = [
    "resources/img/icons/Blue.jpg",
    "resources/img/icons/Guzma.jpg",
    "resources/img/icons/Piers.jpg",
    "resources/img/icons/Cynthia.jpg",
    "resources/img/icons/Diantha.jpg"
];

const imagemCadastro = document.querySelector(
    "#criar-treinador .trainer-logo img"
);
const imagemPerfil = document.querySelector(
    "#perfil-treinador .trainer-logo img"
);

const botaoEsquerda = document.querySelector("#left-arrow");
const botaoDireita = document.querySelector("#right-arrow");
const botaoEsquerdaPerfil = document.querySelector("#left-arrow-perfil");
const botaoDireitaPerfil = document.querySelector("#right-arrow-perfil");
const botaoConfirmarIcone = document.querySelector("#confirmar-icone");

let indiceIcone = Math.floor(Math.random() * imagensIcones.length);
let indiceIconePerfil = 0;

const chaveIcones = "iconesTreinadores";

function sortearIconeValor() {
    return imagensIcones[Math.floor(Math.random() * imagensIcones.length)];
}

function atualizarIconeCadastro() {
    if (imagemCadastro) {
        imagemCadastro.src = imagensIcones[indiceIcone];
    }
}

function sortearIcone() {
    indiceIcone = Math.floor(Math.random() * imagensIcones.length);
    atualizarIconeCadastro();
}

function lerIconesSalvos() {
    try {
        const dados = JSON.parse(sessionStorage.getItem(chaveIcones) || "{}");
        return dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
    } catch {
        return {};
    }
}

function obterIconeSalvo(guidPerson) {
    if (!guidPerson) return null;

    const icones = lerIconesSalvos();
    return icones[guidPerson] || null;
}

function salvarIcone(guidPerson, icone) {
    if (!guidPerson || !icone) return;

    const icones = lerIconesSalvos();
    icones[guidPerson] = icone;
    sessionStorage.setItem(chaveIcones, JSON.stringify(icones));
}

function atualizarIconePerfil(icone) {
    if (!imagemPerfil) return;

    if (!icone || !imagensIcones.includes(icone)) {
        icone = sortearIconeValor();
    }

    imagemPerfil.src = icone;
    indiceIconePerfil = imagensIcones.indexOf(icone);
    if (indiceIconePerfil < 0) indiceIconePerfil = 0;
}

function alterarIconeCadastro(direcao) {
    indiceIcone = (indiceIcone + direcao + imagensIcones.length) % imagensIcones.length;
    atualizarIconeCadastro();
}

function alterarIconePerfil(direcao) {
    indiceIconePerfil =
        (indiceIconePerfil + direcao + imagensIcones.length) % imagensIcones.length;

    if (imagemPerfil) {
        imagemPerfil.src = imagensIcones[indiceIconePerfil];
    }
}

botaoEsquerda?.addEventListener("click", () => alterarIconeCadastro(-1));
botaoDireita?.addEventListener("click", () => alterarIconeCadastro(1));

botaoEsquerdaPerfil?.addEventListener("click", () => alterarIconePerfil(-1));
botaoDireitaPerfil?.addEventListener("click", () => alterarIconePerfil(1));

botaoConfirmarIcone?.addEventListener("click", () => {
    const guidPerson = sessionStorage.getItem("guidPerson");

    if (!guidPerson) {
        alert("Entre na sua conta antes de alterar o ícone.");
        return;
    }

    const dadosSalvos = sessionStorage.getItem("treinador");
    if (!dadosSalvos) {
        alert("Não foi possível encontrar os dados do treinador.");
        return;
    }

    const treinador = JSON.parse(dadosSalvos);
    const novoIcone = imagensIcones[indiceIconePerfil];

    treinador.Icone = novoIcone;
    salvarIcone(guidPerson, novoIcone);
    sessionStorage.setItem("treinador", JSON.stringify(treinador));

    atualizarIconePerfil(novoIcone);

    botaoConfirmarIcone.classList.add("icone-salvo");
    botaoConfirmarIcone.title = "Ícone salvo nesta sessão";
    setTimeout(() => {
        botaoConfirmarIcone?.classList.remove("icone-salvo");
        if (botaoConfirmarIcone) botaoConfirmarIcone.title = "Salvar ícone";
    }, 1200);
});

// Restaurar o treinador da sessão depois de declarar as funções de ícones.
const dadosSalvos = sessionStorage.getItem("treinador");

if (dadosSalvos) {
    try {
        const treinador = JSON.parse(dadosSalvos);
        const guidPerson = sessionStorage.getItem("guidPerson");

        let icone = obterIconeSalvo(guidPerson) || treinador.Icone;
        if (!icone || !imagensIcones.includes(icone)) {
            icone = sortearIconeValor();
        }

        treinador.Icone = icone;

        if (guidPerson) salvarIcone(guidPerson, icone);
        sessionStorage.setItem("treinador", JSON.stringify(treinador));

        mostrarTreinador(treinador);
    } catch (error) {
        console.error("Não foi possível restaurar o treinador da sessão:", error);
    }
}
