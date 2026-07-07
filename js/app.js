// ============================================
// CARGA DE DATOS Y RENDERIZADO PRINCIPAL
// ============================================

let juegos = [];
let juegosFiltrados = [];

// Elementos DOM
const container = document.getElementById('games-container');
const filterPlataforma = document.getElementById('filter-plataforma');
const filterEstado = document.getElementById('filter-estado');
const filterBusqueda = document.getElementById('filter-busqueda');

// IDs de estadísticas
const totalJuegosEl = document.getElementById('total-juegos');
const completadosEl = document.getElementById('completados');
const jugandoEl = document.getElementById('jugando');
const progresoMedioEl = document.getElementById('progreso-medio');
const horasTotalesEl = document.getElementById('horas-totales');
const logrosTotalesEl = document.getElementById('logros-totales');
const totalFooterEl = document.getElementById('total-juegos-footer');
const fechaActualizacionEl = document.getElementById('fecha-actualizacion');

// ============================================
// CARGA DE DATOS DESDE JSON
// ============================================
async function cargarJuegos() {
    try {
        const response = await fetch('data/juegos.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        juegos = await response.json();
        juegosFiltrados = [...juegos];
        
        // Poblar filtros
        poblarFiltroPlataformas();
        
        // Actualizar todo
        actualizarEstadisticas();
        renderizarJuegos();
        actualizarFooter();
        
    } catch (error) {
        console.error('Error cargando juegos:', error);
        container.innerHTML = `<p class="loading">❌ Error al cargar los datos. Revisa la consola.</p>`;
    }
}

// ============================================
// POBLAR FILTRO DE PLATAFORMAS
// ============================================
function poblarFiltroPlataformas() {
    const plataformas = [...new Set(juegos.map(j => j.plataforma).filter(Boolean))];
    plataformas.sort();
    
    filterPlataforma.innerHTML = '<option value="todas">Todas</option>';
    plataformas.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        filterPlataforma.appendChild(option);
    });
}

// ============================================
// FILTRAR JUEGOS
// ============================================
function filtrarJuegos() {
    const plataforma = filterPlataforma.value;
    const estado = filterEstado.value;
    const busqueda = filterBusqueda.value.toLowerCase().trim();

    juegosFiltrados = juegos.filter(juego => {
        const matchPlataforma = plataforma === 'todas' || juego.plataforma === plataforma;
        const matchEstado = estado === 'todos' || juego.estado === estado;
        const matchBusqueda = juego.titulo.toLowerCase().includes(busqueda) ||
                              (juego.genero && juego.genero.toLowerCase().includes(busqueda));
        return matchPlataforma && matchEstado && matchBusqueda;
    });

    renderizarJuegos();
    actualizarEstadisticas();
    actualizarFooter();
}

// ============================================
// RENDERIZAR TARJETAS DE JUEGOS
// ============================================
function renderizarJuegos() {
    if (juegosFiltrados.length === 0) {
        container.innerHTML = `<p class="loading">🔍 No se encontraron juegos con esos filtros</p>`;
        return;
    }

    let html = '';
    juegosFiltrados.forEach((juego, index) => {
        const progreso = juego.progreso || 0;
        const estadoClass = getEstadoClass(juego.estado);
        const horas = juego.horas_jugadas || 0;
        const logros = juego.logros || 0;

        html += `
            <div class="game-card" style="animation-delay: ${Math.min(index * 0.03, 0.5)}s">
                <div class="game-title">${escapeHtml(juego.titulo)}</div>
                <div class="game-plataforma">🖥️ ${escapeHtml(juego.plataforma || 'Sin especificar')}</div>
                <span class="game-estado ${estadoClass}">${escapeHtml(juego.estado || 'Sin estado')}</span>
                <div class="game-progreso">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progreso}%"></div>
                    </div>
                </div>
                <div class="game-metadata">
                    <span>⏱️ ${horas}h</span>
                    <span>🏆 ${logros}</span>
                    <span>${progreso}%</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// ESTADÍSTICAS
// ============================================
function actualizarEstadisticas() {
    const total = juegosFiltrados.length;
    const completados = juegosFiltrados.filter(j => j.estado === 'Completado').length;
    const jugando = juegosFiltrados.filter(j => j.estado === 'Jugando').length;
    const progresoTotal = juegosFiltrados.reduce((sum, j) => sum + (j.progreso || 0), 0);
    const progresoMedio = total > 0 ? Math.round(progresoTotal / total) : 0;
    const horasTotales = juegosFiltrados.reduce((sum, j) => sum + (j.horas_jugadas || 0), 0);
    const logrosTotales = juegosFiltrados.reduce((sum, j) => sum + (j.logros || 0), 0);

    totalJuegosEl.textContent = total;
    completadosEl.textContent = completados;
    jugandoEl.textContent = jugando;
    progresoMedioEl.textContent = `${progresoMedio}%`;
    horasTotalesEl.textContent = horasTotales;
    logrosTotalesEl.textContent = logrosTotales;
}

// ============================================
// FOOTER
// ============================================
function actualizarFooter() {
    totalFooterEl.textContent = juegosFiltrados.length;
    const ahora = new Date();
    fechaActualizacionEl.textContent = ahora.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// UTILIDADES
// ============================================
function getEstadoClass(estado) {
    const map = {
        'Completado': 'estado-completado',
        'Jugando': 'estado-jugando',
        'Pendiente': 'estado-pendiente',
        'Abandonado': 'estado-abandonado'
    };
    return map[estado] || '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENTOS
// ============================================
filterPlataforma.addEventListener('change', filtrarJuegos);
filterEstado.addEventListener('change', filtrarJuegos);
filterBusqueda.addEventListener('input', filtrarJuegos);

// ============================================
// INICIO
// ============================================
document.addEventListener('DOMContentLoaded', cargarJuegos);