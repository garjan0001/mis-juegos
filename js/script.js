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
const pendientesEl = document.getElementById('pendientes');
const prestadosEl = document.getElementById('prestados');
const progresoMedioEl = document.getElementById('progreso-medio');
const totalFooterEl = document.getElementById('total-juegos-footer');
const fechaActualizacionEl = document.getElementById('fecha-actualizacion');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalCerrar = document.getElementById('modal-cerrar');

// ============================================
// CARGA DE DATOS DESDE JSON
// ============================================
async function cargarJuegos() {
    console.log('🔄 Iniciando carga de juegos...');
    container.innerHTML = `<p class="loading">⏳ Cargando juegos...</p>`;
    
    try {
        const response = await fetch('./data/juegos.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        juegos = await response.json();
        console.log('📦 Datos cargados:', juegos.length, 'juegos');
        
        juegosFiltrados = [...juegos];
        
        poblarFiltroPlataformas();
        actualizarEstadisticas();
        renderizarJuegos();
        actualizarFooter();
        
        console.log('✅ Todo cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando juegos:', error);
        container.innerHTML = `
            <p class="loading">❌ No se pudieron cargar los juegos.</p>
            <p class="loading" style="font-size:0.8rem; color:#666; margin-top:1rem;">
                Error: ${error.message}
            </p>
        `;
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
// RENDERIZAR TARJETAS DE JUEGOS (CON IMÁGENES Y HOVER)
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
        const esPrestado = juego.estado === 'Prestado';
        
        // Construir rutas de imágenes
        const nombreImagen = juego.titulo
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        
        const imgFront = `./images/${nombreImagen}.jpg`;
        const imgBack = `./images/${nombreImagen}-back.jpg`;
        
        // Verificar si existen las imágenes (se mostrarán o no)
        const hasImages = true; // El CSS maneja el fallback

        html += `
            <div class="game-card" data-index="${index}" style="animation-delay: ${Math.min(index * 0.03, 0.5)}s">
                ${esPrestado ? `<span class="prestado-badge">📤 Prestado</span>` : ''}
                
                <div class="game-image">
                    <img class="img-front" src="${imgFront}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         onerror="this.style.display='none'" />
                    <img class="img-back" src="${imgBack}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         onerror="this.style.display='none'" />
                    ${!hasImages ? `<div class="no-image">🎮</div>` : ''}
                </div>
                
                <div class="game-title">${escapeHtml(juego.titulo)}</div>
                <div class="game-plataforma">🖥️ ${escapeHtml(juego.plataforma || 'Sin especificar')}</div>
                <span class="game-estado ${estadoClass}">${getEstadoEmoji(juego.estado)} ${escapeHtml(juego.estado || 'Sin estado')}</span>
                
                <div class="game-progreso">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progreso}%"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Añadir event listeners para abrir el modal
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const juego = juegosFiltrados[index];
            if (juego) abrirModal(juego);
        });
    });
}

// ============================================
// MODAL - FICHA DETALLADA DEL JUEGO
// ============================================
function abrirModal(juego) {
    const nombreImagen = juego.titulo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
    
    const imgFront = `./images/${nombreImagen}.jpg`;
    const esPrestado = juego.estado === 'Prestado';
    
    let html = `
        <div class="modal-imagen">
            <img src="${imgFront}" alt="${escapeHtml(juego.titulo)}" 
                 onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:#666;font-size:3rem;\\'>🎮</div>'" />
        </div>
        <div class="modal-titulo">${escapeHtml(juego.titulo)}</div>
        <div class="modal-detalle">
            <div class="detalle-item">
                <span class="label">Plataforma</span>
                <span class="value">${escapeHtml(juego.plataforma || 'Sin especificar')}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Estado</span>
                <span class="value">${getEstadoEmoji(juego.estado)} ${escapeHtml(juego.estado || 'Sin estado')}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Progreso</span>
                <span class="value">${juego.progreso || 0}%</span>
            </div>
            <div class="detalle-item">
                <span class="label">Género</span>
                <span class="value">${escapeHtml(juego.genero || 'Sin especificar')}</span>
            </div>
            ${juego.año ? `
            <div class="detalle-item">
                <span class="label">Año</span>
                <span class="value">${juego.año}</span>
            </div>
            ` : ''}
            ${juego.desarrollador ? `
            <div class="detalle-item">
                <span class="label">Desarrollador</span>
                <span class="value">${escapeHtml(juego.desarrollador)}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Añadir información de préstamo si aplica
    if (esPrestado && juego.prestado_a) {
        html += `
            <div class="modal-prestado">
                <div class="label">📤 Prestado a</div>
                <div class="value">${escapeHtml(juego.prestado_a)}</div>
                ${juego.prestado_desde ? `
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">
                    Desde: ${juego.prestado_desde}
                </div>
                ` : ''}
                ${juego.prestado_notas ? `
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">
                    📝 ${escapeHtml(juego.prestado_notas)}
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // Añadir notas si existen
    if (juego.notas) {
        html += `
            <div style="margin-top:0.8rem; padding:0.8rem; background:rgba(255,255,255,0.04); border-radius:8px;">
                <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px;">📝 Notas</div>
                <div style="font-size:0.9rem; margin-top:0.2rem;">${escapeHtml(juego.notas)}</div>
            </div>
        `;
    }
    
    modalBody.innerHTML = html;
    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar modal con botón o clic fuera
modalCerrar.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarModal();
});

// ============================================
// ESTADÍSTICAS (SOLO BÁSICAS)
// ============================================
function actualizarEstadisticas() {
    const total = juegosFiltrados.length;
    const completados = juegosFiltrados.filter(j => j.estado === 'Completado').length;
    const jugando = juegosFiltrados.filter(j => j.estado === 'Jugando').length;
    const pendientes = juegosFiltrados.filter(j => j.estado === 'Pendiente').length;
    const prestados = juegosFiltrados.filter(j => j.estado === 'Prestado').length;
    const progresoTotal = juegosFiltrados.reduce((sum, j) => sum + (j.progreso || 0), 0);
    const progresoMedio = total > 0 ? Math.round(progresoTotal / total) : 0;

    totalJuegosEl.textContent = total;
    completadosEl.textContent = completados;
    jugandoEl.textContent = jugando;
    pendientesEl.textContent = pendientes;
    prestadosEl.textContent = prestados;
    progresoMedioEl.textContent = `${progresoMedio}%`;
    
    // Actualizar header
    const headerSub = document.getElementById('total-juegos-header');
    if (headerSub) headerSub.textContent = `${total} juegos · ${new Set(juegos.map(j => j.plataforma)).size} plataformas`;
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
        'Abandonado': 'estado-abandonado',
        'Prestado': 'estado-prestado'
    };
    return map[estado] || '';
}

function getEstadoEmoji(estado) {
    const map = {
        'Completado': '✅',
        'Jugando': '⏳',
        'Pendiente': '📅',
        'Abandonado': '❌',
        'Prestado': '📤'
    };
    return map[estado] || '❓';
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
