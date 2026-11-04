const SUPABASE_URL = "https://cniinrbzytatalowiqnm.supabase.co";
const SUPABASE_KEY = "sb_publishable_nMYJ1kNcm61VCj6qPHUVqw_5z-q-iRJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarTempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return mins > 0 ? `${mins}m ${segs}s` : `${segs}s`;
}

function formatarData(isoString) {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString('pt-BR');
}

async function carregarRanking() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const emptyEl = document.getElementById('empty');
    const tableEl = document.getElementById('rankingTable');
    const tbodyEl = document.getElementById('rankingBody');

    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    tableEl.classList.add('hidden');
    tbodyEl.innerHTML = '';

    try {
        const { data: partidas, error } = await supabase
            .from('partidas')
            .select('*')
            .eq('jogo_id', 1);

        if (error) throw error;

        if (!partidas || partidas.length === 0) {
            loadingEl.classList.add('hidden');
            emptyEl.classList.remove('hidden');
            return;
        }

        // Filtra para manter apenas a melhor partida de cada apelido
        const melhoresPartidas = {};
        partidas.forEach(p => {
            const apelido = p.apelido;
            if (!melhoresPartidas[apelido]) {
                melhoresPartidas[apelido] = p;
            } else {
                const atual = melhoresPartidas[apelido];
                const vNovo = parseFloat(p.valor_ganho);
                const vAtual = parseFloat(atual.valor_ganho);
                const tNovo = parseFloat(p.tempo_segundos);
                const tAtual = parseFloat(atual.tempo_segundos);
                const dNovo = new Date(p.data_hora);
                const dAtual = new Date(atual.data_hora);

                if (vNovo > vAtual) {
                    melhoresPartidas[apelido] = p;
                } else if (vNovo === vAtual) {
                    if (tNovo < tAtual) {
                        melhoresPartidas[apelido] = p;
                    } else if (tNovo === tAtual && dNovo < dAtual) {
                        melhoresPartidas[apelido] = p;
                    }
                }
            }
        });

        // Ordenação estrita: Maior Prêmio -> Menor Tempo -> Data mais antiga
        const rankingOrdenado = Object.values(melhoresPartidas).sort((a, b) => {
            if (b.valor_ganho !== a.valor_ganho) return b.valor_ganho - a.valor_ganho;
            if (a.tempo_segundos !== b.tempo_segundos) return a.tempo_segundos - b.tempo_segundos;
            return new Date(a.data_hora) - new Date(b.data_hora);
        });

        const top10 = rankingOrdenado.slice(0, 10);

        top10.forEach((p, index) => {
            const tr = document.createElement('tr');
            const pos = index + 1;
            let posClass = pos === 1 ? "posicao-1" : pos === 2 ? "posicao-2" : pos === 3 ? "posicao-3" : "";

            tr.innerHTML = `
                <td class="${posClass}">${pos}º</td>
                <td><strong>${p.apelido}</strong></td>
                <td>${formatarMoeda(p.valor_ganho)}</td>
                <td>${formatarTempo(p.tempo_segundos)}</td>
                <td>${formatarData(p.data_hora)}</td>
            `;
            tbodyEl.appendChild(tr);
        });

        loadingEl.classList.add('hidden');
        tableEl.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        loadingEl.classList.add('hidden');
        errorEl.textContent = `Falha ao carregar ranking: ${err.message || err}`;
        errorEl.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', carregarRanking);
