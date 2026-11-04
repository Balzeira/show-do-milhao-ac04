// Configuração do Supabase
const SUPABASE_URL = "https://cniinrbzytatalowiqnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_nMYJ1kNcm61VCj6qPHUVqw_5z-q-iRJ";
const JOGO_ID = 1;

// Inicialização segura do cliente Supabase usando outro identificador
let supabaseClient = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
}

function formatarMoeda(valor) {
    return "R$ " + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função para buscar e renderizar o ranking
async function carregarRanking() {
    const containerTabela = document.querySelector("tbody") || document.getElementById("ranking-corpo");
    
    if (!supabaseClient) {
        if (containerTabela) {
            containerTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro: Biblioteca do Supabase não carregada.</td></tr>`;
        }
        return;
    }

    try {
        const { data: partidas, error } = await supabaseClient
            .from('partidas')
            .select('*')
            .eq('jogo_id', JOGO_ID);

        if (error) throw error;

        if (!partidas || partidas.length === 0) {
            if (containerTabela) {
                containerTabela.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum jogo registado ainda. Jogue pelo Python!</td></tr>`;
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

        // Ordena por prêmio e tempo
        const ranking = Object.values(melhores).sort((a, b) => {
            const diffPremio = parseFloat(b.valor_ganho) - parseFloat(a.valor_ganho);
            if (diffPremio !== 0) return diffPremio;
            return parseFloat(a.tempo_segundos) - parseFloat(b.tempo_segundos);
        });

        // Renderiza no HTML
        if (containerTabela) {
            containerTabela.innerHTML = "";
            ranking.slice(0, 10).forEach((p, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}º</td>
                    <td>${p.apelido}</td>
                    <td>${formatarMoeda(p.valor_ganho)}</td>
                    <td>${p.tempo_segundos}s</td>
                `;
                containerTabela.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Falha ao consultar banco:", err);
        if (containerTabela) {
            containerTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar dados do banco.</td></tr>`;
        }
    }
}

// Executa ao carregar a página e mapeia o botão de atualização
window.addEventListener('DOMContentLoaded', () => {
    carregarRanking();
    
    // Se houver um botão de atualizar, garante o evento de clique
    const btnAtualizar = document.querySelector("button");
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', carregarRanking);
    }
});
