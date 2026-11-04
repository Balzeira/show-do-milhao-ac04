// Configuração do Supabase
const SUPABASE_URL = "https://cniinrbzytatalowiqnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_nMYJ1kNcm61VCj6qPHUVqw_5z-q-iRJ";
const JOGO_ID = 1;

function formatarMoeda(valor) {
    return "R$ " + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function carregarRanking() {
    console.log("A consultar dados no Supabase...");
    const tbody = document.getElementById("ranking-corpo") || document.querySelector("tbody");

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Carregando dados...</td></tr>`;
    }

    try {
        // Consulta direta via fetch (API REST do Supabase - totalmente à prova de falhas de CDN)
        const url = `${SUPABASE_URL}/rest/v1/partidas?jogo_id=eq.${JOGO_ID}&select=*`;
        
        const resposta = await fetch(url, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const partidas = await resposta.json();
        console.log("Dados recebidos:", partidas);

        if (!partidas || partidas.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum jogo registado ainda. Jogue pelo Python!</td></tr>`;
            }
            return;
        }

        // Agrupa por apelido (pega a melhor partida de cada jogador)
        const melhores = {};
        partidas.forEach(p => {
            const ap = p.apelido;
            const valor = parseFloat(p.valor_ganho);
            const tempo = parseFloat(p.tempo_segundos);

            if (!melhores[ap] || 
                valor > parseFloat(melhores[ap].valor_ganho) || 
                (valor === parseFloat(melhores[ap].valor_ganho) && tempo < parseFloat(melhores[ap].tempo_segundos))) {
                melhores[ap] = p;
            }
        });

        // Ordena por maior prêmio e menor tempo
        const ranking = Object.values(melhores).sort((a, b) => {
            const diffPremio = parseFloat(b.valor_ganho) - parseFloat(a.valor_ganho);
            if (diffPremio !== 0) return diffPremio;
            return parseFloat(a.tempo_segundos) - parseFloat(b.tempo_segundos);
        });

        // Preenche a tabela no site
        if (tbody) {
            tbody.innerHTML = "";
            ranking.slice(0, 10).forEach((p, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}º</td>
                    <td>${p.apelido}</td>
                    <td>${formatarMoeda(p.valor_ganho)}</td>
                    <td>${p.tempo_segundos}s</td>
                `;
                tbody.appendChild(tr);
            });
        }
        console.log("Ranking atualizado com sucesso!");

    } catch (err) {
        console.error("Falha ao carregar ranking:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro ao ligar ao servidor.</td></tr>`;
        }
    }
}

// Carrega automaticamente ao abrir a página
carregarRanking();

// Configura o botão de atualizar
setTimeout(() => {
    const btn = document.getElementById("btn-atualizar") || document.querySelector("button");
    if (btn) {
        btn.onclick = carregarRanking;
    }
}, 500);
