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
        console.log('📦 Primer juego:', juegos[0]);
        
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
        const matchEstado = estado === 'todos' || juego.estado_filtro === estado;
        const matchBusqueda = juego.titulo.toLowerCase().includes(busqueda) ||
                              (juego.descripcion && juego.descripcion.toLowerCase().includes(busqueda));
        return matchPlataforma && matchEstado && matchBusqueda;
    });

    renderizarJuegos();
    actualizarEstadisticas();
    actualizarFooter();
}

// ============================================
// RENDERIZAR TARJETAS DE JUEGOS (CON PORTADA Y HOVER)
// ============================================
function renderizarJuegos() {
    if (juegosFiltrados.length === 0) {
        container.innerHTML = `<p class="loading">🔍 No se encontraron juegos con esos filtros</p>`;
        return;
    }

    let html = '';
    juegosFiltrados.forEach((juego, index) => {
        const esPrestado = juego.prestadoA && juego.prestadoA.trim() !== '';
        
        // 🔥 CORREGIR RUTAS DE IMÁGENES AUTOMÁTICAMENTE
        const portada = juego.portada ? juego.portada.replace(/^\.?\//, './') : 'images/default.jpg';
        const imagenes = juego.imagenes ? juego.imagenes.map(img => img.replace(/^\.?\//, './')) : [portada];
        
        // Primera imagen = portada, segunda = hover (si existe)
        const imgFront = portada;
        const imgBack = imagenes.length > 1 ? imagenes[1] : portada;

        html += `
            <div class="game-card" data-index="${index}" style="animation-delay: ${Math.min(index * 0.03, 0.5)}s">
                ${esPrestado ? `<span class="prestado-badge">📤 Prestado a ${escapeHtml(juego.prestadoA)}</span>` : ''}
                
                <div class="game-image">
                    <img class="img-front" src="${imgFront}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         onerror="this.style.display='none'" />
                    <img class="img-back" src="${imgBack}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         onerror="this.style.display='none'" />
                    <div class="no-image" style="display:none;">🎮</div>
                </div>
                
                <div class="game-title">${escapeHtml(juego.titulo)}</div>
                <div class="game-plataforma">🖥️ ${escapeHtml(juego.plataforma || 'Sin especificar')}</div>
                <div class="game-region">🌍 ${escapeHtml(juego.region || 'Sin región')}</div>
                ${juego.favorito ? '<span class="favorito-badge">⭐ Favorito</span>' : ''}
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
    // 🔥 CORREGIR RUTAS DE IMÁGENES EN MODAL
    const portada = juego.portada ? juego.portada.replace(/^\.?\//, './') : 'images/default.jpg';
    const imagenes = juego.imagenes ? juego.imagenes.map(img => img.replace(/^\.?\//, './')) : [portada];
    const esPrestado = juego.prestadoA && juego.prestadoA.trim() !== '';
    
    let html = `
        <div class="modal-imagen-principal">
            <img src="${portada}" alt="${escapeHtml(juego.titulo)}" 
                 onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:#666;font-size:3rem;\\'>🎮</div>'" />
        </div>
        
        <div class="modal-titulo">${escapeHtml(juego.titulo)}</div>
        
        <div class="modal-detalle">
            <div class="detalle-item">
                <span class="label">Plataforma</span>
                <span class="value">${escapeHtml(juego.plataforma || 'Sin especificar')}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Región</span>
                <span class="value">${escapeHtml(juego.region || 'Sin región')}</span>
            </div>
            ${juego.favorito ? `
            <div class="detalle-item">
                <span class="label">⭐ Favorito</span>
                <span class="value">Sí</span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Estado físico del juego
    if (juego.estado && juego.estado.trim() !== '') {
        html += `
            <div class="modal-estado-fisico">
                <div class="label">📦 Estado físico</div>
                <div class="value">${escapeHtml(juego.estado)}</div>
            </div>
        `;
    }
    
    // Descripción del juego
    if (juego.descripcion && juego.descripcion.trim() !== '') {
        html += `
            <div class="modal-descripcion">
                <div class="label">📝 Descripción</div>
                <div class="value">${escapeHtml(juego.descripcion)}</div>
            </div>
        `;
    }
    
    // Información de préstamo
    if (esPrestado) {
        html += `
            <div class="modal-prestado">
                <div class="label">📤 Prestado a</div>
                <div class="value">${escapeHtml(juego.prestadoA)}</div>
            </div>
        `;
    }
    
    // Galería de imágenes adicionales (si hay más de 1)
    if (imagenes.length > 1) {
        html += `
            <div class="modal-galera">
                <div class="label">🖼️ Imágenes</div>
                <div class="galeria-imagenes">
        `;
        imagenes.forEach(img => {
            html += `
                <div class="galeria-item">
                    <img src="${img}" alt="${escapeHtml(juego.titulo)}" 
                         onerror="this.style.display='none'" />
                </div>
            `;
        });
        html += `
                </div>
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
// ESTADÍSTICAS
// ============================================
function actualizarEstadisticas() {
    const total = juegosFiltrados.length;
    const prestados = juegosFiltrados.filter(j => j.prestadoA && j.prestadoA.trim() !== '').length;
    const favoritos = juegosFiltrados.filter(j => j.favorito === true).length;
    
    // Calcular progreso (si existe en tu JSON)
    const juegosConProgreso = juegosFiltrados.filter(j => j.progreso !== undefined);
    const progresoTotal = juegosConProgreso.reduce((sum, j) => sum + (j.progreso || 0), 0);
    const progresoMedio = juegosConProgreso.length > 0 ? Math.round(progresoTotal / juegosConProgreso.length) : 0;

    totalJuegosEl.textContent = total;
    completadosEl.textContent = juegosFiltrados.filter(j => j.estado_filtro === 'Completado').length;
    jugandoEl.textContent = juegosFiltrados.filter(j => j.estado_filtro === 'Jugando').length;
    pendientesEl.textContent = juegosFiltrados.filter(j => j.estado_filtro === 'Pendiente').length;
    prestadosEl.textContent = prestados;
    progresoMedioEl.textContent = juegosConProgreso.length > 0 ? `${progresoMedio}%` : '--';
    
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
        'Abandonado': 'estado-abandonado'
    };
    return map[estado] || '';
}

function getEstadoEmoji(estado) {
    const map = {
        'Completado': '✅',
        'Jugando': '⏳',
        'Pendiente': '📅',
        'Abandonado': '❌'
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
