// Configuração do Supabase
const SUPABASE_URL = "https://cniinrbzytatalowiqnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_nMYJ1kNcm61VCj6qPHUVqw_5z-q-iRJ";
const JOGO_ID = 1;

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

async function carregarRanking() {
    console.log("A carregar ranking do Supabase...");
    
    // Procura o tbody de várias formas possíveis para garantir que encontra
    const tbody = document.getElementById("ranking-corpo") || document.querySelector("tbody");

    if (!supabaseClient) {
        console.error("Cliente Supabase não inicializado.");
        return;
    }

    try {
        const { data: partidas, error } = await supabaseClient
            .from('partidas')
            .select('*')
            .eq('jogo_id', JOGO_ID);

        if (error) throw error;

        if (!partidas || partidas.length === 0) {
            console.log("Nenhum registo encontrado.");
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum jogo registado ainda.</td></tr>`;
            }
            return;
        }

        // Agrupa por apelido (pega a melhor partida)
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

        const ranking = Object.values(melhores).sort((a, b) => {
            const diffPremio = parseFloat(b.valor_ganho) - parseFloat(a.valor_ganho);
            if (diffPremio !== 0) return diffPremio;
            return parseFloat(a.tempo_segundos) - parseFloat(b.tempo_segundos);
        });

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
        console.error("Falha ao consultar banco:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    carregarRanking();
    
    const btn = document.getElementById("btn-atualizar") || document.querySelector("button");
    if (btn) {
        btn.addEventListener('click', carregarRanking);
    }
});
