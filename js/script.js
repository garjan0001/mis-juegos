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
    container.innerHTML = `<p class="loading">⏳ Cargando juegos
