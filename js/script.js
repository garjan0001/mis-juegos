// ============================================
// CARGA DE DATOS Y RENDERIZADO PRINCIPAL
// ============================================

let juegos = [];
let juegosFiltrados = [];
let indiceModalActual = 0;
let vistaActual = 'grid';

// Elementos DOM
const container = document.getElementById('games-container');
const filterPlataforma = document.getElementById('filter-plataforma');
const filterEstado = document.getElementById('filter-estado');
const filterOrden = document.getElementById('filter-orden');
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

// Barras de estadísticas
const barCompletados = document.getElementById('bar-completados');
const barJugando = document.getElementById('bar-jugando');
const barPendientes = document.getElementById('bar-pendientes');
const barPrestados = document.getElementById('bar-prestados');
const barCompletadosText = document.getElementById('bar-completados-text');
const barJugandoText = document.getElementById('bar-jugando-text');
const barPendientesText = document.getElementById('bar-pendientes-text');
const barPrestadosText = document.getElementById('bar-prestados-text');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalCerrar = document.getElementById('modal-cerrar');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');

// ============================================
// TOGGLE ESTADÍSTICAS
// ============================================
let estadisticasVisibles = true;

function toggleEstadisticas() {
    const statsSection = document.querySelector('.stats-section');
    const toggleBtn = document.getElementById('toggle-stats-btn');
    
    if (estadisticasVisibles) {
        statsSection.style.display = 'none';
        toggleBtn.textContent = '📊 Mostrar estadísticas';
        estadisticasVisibles = false;
    } else {
        statsSection.style.display = 'block';
        toggleBtn.textContent = '📊 Ocultar estadísticas';
        estadisticasVisibles = true;
    }
}

// ============================================
// CAMBIAR VISTA (GRID / LISTA)
// ============================================
function cambiarVista(vista) {
    vistaActual = vista;
    const container = document.getElementById('games-container');
    const btnGrid = document.getElementById('btn-grid');
    const btnList = document.getElementById('btn-list');
    
    if (vista === 'grid') {
        container.className = 'games-grid';
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
    } else {
        container.className = 'games-list';
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    }
}

// ============================================
// CARGA DE DATOS DESDE JSON (SIN CACHÉ)
// ============================================
async function cargarJuegos() {
    console.log('🔄 Iniciando carga de juegos...');
    container.innerHTML = `<p class="loading">⏳ Cargando juegos...</p>`;
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`./data/juegos.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        juegos = await response.json();
        console.log('📦 Datos cargados:', juegos.length, 'juegos');
        console.log('📦 Primer juego:', juegos[0]);
        
        if (juegos.length > 0) {
            console.log('📌 estado_filtro del primer juego:', juegos[0].estado_filtro || 'No tiene');
        }
        
        juegosFiltrados = [...juegos];
        
        poblarFiltroPlataformas();
        aplicarFiltrosYOrden();
        
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
// RECARGAR DATOS MANUALMENTE
// ============================================
async function recargarDatos() {
    const btn = document.getElementById('btn-recargar-datos');
    if (!btn) return;
    
    btn.textContent = '⏳ Cargando...';
    btn.disabled = true;
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`./data/juegos.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        juegos = await response.json();
        console.log('📦 Datos recargados:', juegos.length, 'juegos');
        
        juegosFiltrados = [...juegos];
        
        poblarFiltroPlataformas();
        aplicarFiltrosYOrden();
        
        btn.textContent = '✅ ¡Actualizado!';
        setTimeout(() => {
            btn.textContent = '🔄 Actualizar';
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error recargando:', error);
        btn.textContent = '❌ Error';
        setTimeout(() => {
            btn.textContent = '🔄 Actualizar';
            btn.disabled = false;
        }, 2000);
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
// APLICAR FILTROS Y ORDEN
// ============================================
function aplicarFiltrosYOrden() {
    const plataforma = filterPlataforma.value;
    const estado = filterEstado.value;
    const busqueda = filterBusqueda.value.toLowerCase().trim();
    const orden = filterOrden.value;

    // 1. FILTRAR
    juegosFiltrados = juegos.filter(juego => {
        const estaPrestado = juego.prestadoA && juego.prestadoA.trim() !== '';
        
        let estadoJuego = juego.estado_filtro || '';
        if (estaPrestado && estadoJuego !== 'Prestado') {
            estadoJuego = 'Prestado';
        }
        
        const matchPlataforma = plataforma === 'todas' || juego.plataforma === plataforma;
        const matchEstado = estado === 'todos' || estadoJuego === estado;
        const matchBusqueda = juego.titulo.toLowerCase().includes(busqueda);
        
        return matchPlataforma && matchEstado && matchBusqueda;
    });

    // 2. ORDENAR
    juegosFiltrados.sort((a, b) => {
        switch(orden) {
            case 'titulo': return a.titulo.localeCompare(b.titulo);
            case 'titulo-desc': return b.titulo.localeCompare(a.titulo);
            case 'plataforma': return (a.plataforma || '').localeCompare(b.plataforma || '');
            case 'favorito': return (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0);
            default: return 0;
        }
    });

    // 3. RENDERIZAR
    renderizarJuegos();
    actualizarEstadisticas();
    actualizarFooter();
}

// ============================================
// FILTRAR JUEGOS (MANTENIDO PARA COMPATIBILIDAD)
// ============================================
function filtrarJuegos() {
    aplicarFiltrosYOrden();
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
        const esPrestado = juego.prestadoA && juego.prestadoA.trim() !== '';
        
        const portada = juego.portada ? juego.portada.replace(/^\.?\//, './') : 'images/default.jpg';
        const imagenes = juego.imagenes ? juego.imagenes.map(img => img.replace(/^\.?\//, './')) : [portada];
        
        const imgFront = portada;
        const imgBack = imagenes.length > 1 ? imagenes[1] : portada;

        let estadoMostrar = '';
        if (esPrestado) {
            estadoMostrar = '📤 Prestado';
        } else if (juego.estado_filtro) {
            const estadoMap = {
                'Completado': '✅ Completado',
                'Jugando': '⏳ Jugando',
                'Pendiente': '📅 Pendiente',
                'Abandonado': '❌ Abandonado'
            };
            estadoMostrar = estadoMap[juego.estado_filtro] || juego.estado_filtro;
        }

        html += `
            <div class="game-card" data-index="${index}" style="animation-delay: ${Math.min(index * 0.03, 0.5)}s">
                ${esPrestado ? `<span class="prestado-badge">📤 ${escapeHtml(juego.prestadoA)}</span>` : ''}
                ${juego.favorito ? '<span class="favorito-badge">⭐</span>' : ''}
                
                <div class="game-image">
                    <img class="img-front" src="${imgFront}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         loading="lazy"
                         onerror="this.style.display='none'; this.parentElement.querySelector('.no-image').style.display='flex';" />
                    <img class="img-back" src="${imgBack}" 
                         alt="${escapeHtml(juego.titulo)}" 
                         loading="lazy"
                         onerror="this.style.display='none'" />
                    <div class="no-image" style="display:none;">🎮</div>
                </div>
                
                <div class="game-title">${escapeHtml(juego.titulo)}</div>
                <div class="game-plataforma">🖥️ ${escapeHtml(juego.plataforma || 'Sin especificar')}</div>
                <div class="game-region">🌍 ${escapeHtml(juego.region || 'Sin región')}</div>
                ${estadoMostrar ? `<div class="game-estado">${estadoMostrar}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
    
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const juego = juegosFiltrados[index];
            if (juego) abrirModal(juego, index);
        });
    });

    document.getElementById('result-count').textContent = juegosFiltrados.length;
}

// ============================================
// MODAL
// ============================================
function abrirModal(juego, index) {
    indiceModalActual = index !== undefined ? index : juegosFiltrados.indexOf(juego);
    
    const portada = juego.portada ? juego.portada.replace(/^\.?\//, './') : 'images/default.jpg';
    const imagenes = juego.imagenes ? juego.imagenes.map(img => img.replace(/^\.?\//, './')) : [portada];
    const esPrestado = juego.prestadoA && juego.prestadoA.trim() !== '';
    
    let estadoMostrar = '';
    if (esPrestado) {
        estadoMostrar = '📤 Prestado';
    } else if (juego.estado_filtro) {
        const estadoMap = {
            'Completado': '✅ Completado',
            'Jugando': '⏳ Jugando',
            'Pendiente': '📅 Pendiente',
            'Abandonado': '❌ Abandonado'
        };
        estadoMostrar = estadoMap[juego.estado_filtro] || juego.estado_filtro;
    }
    
    let html = `
        <div class="modal-imagen-principal" onclick="abrirLightbox('${portada}')">
            <img src="${portada}" alt="${escapeHtml(juego.titulo)}" 
                 onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:#666;font-size:3rem;\\'>🎮</div>'" />
            <div class="modal-zoom-hint">🔍 Click para ampliar</div>
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
            ${estadoMostrar ? `
            <div class="detalle-item">
                <span class="label">Estado</span>
                <span class="value">${estadoMostrar}</span>
            </div>
            ` : ''}
            ${juego.favorito ? `
            <div class="detalle-item">
                <span class="label">⭐ Favorito</span>
                <span class="value">Sí</span>
            </div>
            ` : ''}
        </div>
    `;
    
    if (juego.estado && juego.estado.trim() !== '') {
        html += `
            <div class="modal-estado-fisico">
                <div class="label">📦 Estado físico</div>
                <div class="value">${escapeHtml(juego.estado)}</div>
            </div>
        `;
    }
    
    if (juego.descripcion && juego.descripcion.trim() !== '') {
        html += `
            <div class="modal-descripcion">
                <div class="label">📝 Descripción</div>
                <div class="value">${escapeHtml(juego.descripcion)}</div>
            </div>
        `;
    }
    
    if (esPrestado) {
        html += `
            <div class="modal-prestado">
                <div class="label">📤 Prestado a</div>
                <div class="value">${escapeHtml(juego.prestadoA)}</div>
            </div>
        `;
    }
    
    if (imagenes.length > 1) {
        html += `
            <div class="modal-galera">
                <div class="label">🖼️ Imágenes (click para ampliar)</div>
                <div class="galeria-imagenes">
        `;
        imagenes.forEach(img => {
            html += `
                <div class="galeria-item" onclick="abrirLightbox('${img}')">
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
    
    modalPrev.style.display = indiceModalActual > 0 ? 'block' : 'none';
    modalNext.style.display = indiceModalActual < juegosFiltrados.length - 1 ? 'block' : 'none';
}

// ============================================
// NAVEGACIÓN MODAL
// ============================================
modalPrev.addEventListener('click', function() {
    if (indiceModalActual > 0) {
        const juego = juegosFiltrados[indiceModalActual - 1];
        abrirModal(juego, indiceModalActual - 1);
    }
});

modalNext.addEventListener('click', function() {
    if (indiceModalActual < juegosFiltrados.length - 1) {
        const juego = juegosFiltrados[indiceModalActual + 1];
        abrirModal(juego, indiceModalActual + 1);
    }
});

// ============================================
// LIGHTBOX
// ============================================
function abrirLightbox(src) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 2rem;
    `;
    
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 0 60px rgba(0,0,0,0.8);
    `;
    
    lightbox.appendChild(img);
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    lightbox.addEventListener('click', function() {
        this.remove();
        document.body.style.overflow = 'auto';
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const lb = document.querySelector('div[style*="z-index: 2000"]');
            if (lb) {
                lb.remove();
                document.body.style.overflow = 'auto';
            }
        }
    });
}

function cerrarModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

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
    const completados = juegosFiltrados.filter(j => j.estado_filtro === 'Completado').length;
    const jugando = juegosFiltrados.filter(j => j.estado_filtro === 'Jugando').length;
    const pendientes = juegosFiltrados.filter(j => j.estado_filtro === 'Pendiente').length;
    
    const progresoTotal = juegosFiltrados.reduce((sum, j) => sum + (j.progreso || 0), 0);
    const progresoMedio = total > 0 ? Math.round(progresoTotal / total) : 0;

    totalJuegosEl.textContent = total;
    completadosEl.textContent = completados;
    jugandoEl.textContent = jugando;
    pendientesEl.textContent = pendientes;
    prestadosEl.textContent = prestados;
    progresoMedioEl.textContent = total > 0 ? `${progresoMedio}%` : '--';
    
    const maxValor = Math.max(completados, jugando, pendientes, prestados, 1);
    barCompletados.style.width = `${(completados / maxValor) * 100}%`;
    barJugando.style.width = `${(jugando / maxValor) * 100}%`;
    barPendientes.style.width = `${(pendientes / maxValor) * 100}%`;
    barPrestados.style.width = `${(prestados / maxValor) * 100}%`;
    barCompletadosText.textContent = completados;
    barJugandoText.textContent = jugando;
    barPendientesText.textContent = pendientes;
    barPrestadosText.textContent = prestados;
    
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
// EXPORTAR / IMPORTAR DATOS
// ============================================
function exportarDatos() {
    const blob = new Blob([JSON.stringify(juegos, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `juegos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                throw new Error('El archivo no contiene un array de juegos');
            }
            juegos = data;
            juegosFiltrados = [...juegos];
            poblarFiltroPlataformas();
            aplicarFiltrosYOrden();
            alert(`✅ ${juegos.length} juegos importados correctamente`);
        } catch(err) {
            alert('❌ Error al importar: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ATEJO DE TECLADO (Ctrl+K)
// ============================================
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('filter-busqueda').focus();
    }
});

// ============================================
// EVENTOS DE FILTROS
// ============================================
filterPlataforma.addEventListener('change', aplicarFiltrosYOrden);
filterEstado.addEventListener('change', aplicarFiltrosYOrden);
filterOrden.addEventListener('change', aplicarFiltrosYOrden);
filterBusqueda.addEventListener('input', aplicarFiltrosYOrden);

// ============================================
// INICIO
// ============================================
document.addEventListener('DOMContentLoaded', cargarJuegos);
