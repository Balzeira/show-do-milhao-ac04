// Configuração e inicialização correta do cliente Supabase no navegador
const SUPABASE_URL = "https://cniinrbzytatalowiqnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_nMYJ1kNcm61VCj6qPHUVqw_5z-q-iRJ";
const JOGO_ID = 1;

// Inicializa o cliente único do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function formatarMoeda(valor) {
    return "R$ " + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função principal que busca e exibe o ranking no site
async function carregarRanking() {
    const containerTabela = document.querySelector("tbody") || document.getElementById("ranking-corpo");
    const statusCarregamento = document.getElementById("status-carregamento") || document.querySelector(".card-ranking") || document.body;
    
    console.log("A carregar ranking do Supabase...");

    try {
        const { data: partidas, error } = await supabaseClient
            .from('partidas')
            .select('*')
            .eq('jogo_id', JOGO_ID);

        if (error) {
            console.error("Erro do Supabase:", error);
            throw error;
        }

        if (!partidas || partidas.length === 0) {
            console.log("Nenhum registo encontrado.");
            if (containerTabela) {
                containerTabela.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum jogo registado ainda. Jogue pelo Python para aparecer aqui!</td></tr>`;
            }
            return;
        }

        // Lógica de desempate e agrupamento por melhor pontuação do jogador
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

        // Monta as linhas na tabela HTML do site
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
        console.log("Ranking atualizado com sucesso!");

    } catch (err) {
        console.error("Falha ao carregar ranking:", err);
    }
}

// Carrega automaticamente ao abrir a página
window.onload = () => {
    carregarRanking();
};
