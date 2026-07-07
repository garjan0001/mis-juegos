<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
    <title>🎮 Mi Colección de Juegos</title>
    <link rel="stylesheet" href="./css/style.css" />
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <header class="header">
            <h1>🎮 Mi Colección</h1>
            <p class="subtitle" id="total-juegos-header">Cargando...</p>
            <div class="header-actions">
                <button id="btn-recargar-datos" class="btn-recargar" onclick="recargarDatos()">
                    🔄 Actualizar
                </button>
                <button id="toggle-stats-btn" class="btn-toggle-stats" onclick="toggleEstadisticas()">
                    📊 Ocultar estadísticas
                </button>
            </div>
        </header>

        <!-- ESTADÍSTICAS -->
        <section class="stats-section">
            <h2>📊 Resumen</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">🎮 Total</span>
                    <span class="stat-value" id="total-juegos">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">✅ Completados</span>
                    <span class="stat-value" id="completados">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">⏳ Jugando</span>
                    <span class="stat-value" id="jugando">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📅 Pendientes</span>
                    <span class="stat-value" id="pendientes">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📤 Prestados</span>
                    <span class="stat-value" id="prestados">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📊 Progreso</span>
                    <span class="stat-value" id="progreso-medio">0%</span>
                </div>
            </div>
            
            <!-- GRÁFICOS DE BARRAS -->
            <div class="stats-bars">
                <div class="stat-bar">
                    <span class="stat-bar-label">✅ Completados</span>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill bar-completados" id="bar-completados" style="width: 0%"></div>
                    </div>
                    <span class="stat-bar-value" id="bar-completados-text">0</span>
                </div>
                <div class="stat-bar">
                    <span class="stat-bar-label">⏳ Jugando</span>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill bar-jugando" id="bar-jugando" style="width: 0%"></div>
                    </div>
                    <span class="stat-bar-value" id="bar-jugando-text">0</span>
                </div>
                <div class="stat-bar">
                    <span class="stat-bar-label">📅 Pendientes</span>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill bar-pendientes" id="bar-pendientes" style="width: 0%"></div>
                    </div>
                    <span class="stat-bar-value" id="bar-pendientes-text">0</span>
                </div>
                <div class="stat-bar">
                    <span class="stat-bar-label">📤 Prestados</span>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill bar-prestados" id="bar-prestados" style="width: 0%"></div>
                    </div>
                    <span class="stat-bar-value" id="bar-prestados-text">0</span>
                </div>
            </div>
        </section>

        <!-- FILTROS -->
        <section class="filters-section">
            <div class="filter-group">
                <label for="filter-plataforma">📌 Plataforma</label>
                <select id="filter-plataforma">
                    <option value="todas">Todas</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-estado">📌 Estado</label>
                <select id="filter-estado">
                    <option value="todos">Todos</option>
                    <option value="Completado">✅ Completado</option>
                    <option value="Jugando">⏳ Jugando</option>
                    <option value="Pendiente">📅 Pendiente</option>
                    <option value="Abandonado">❌ Abandonado</option>
                    <option value="Prestado">📤 Prestado</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-orden">📋 Ordenar</label>
                <select id="filter-orden">
                    <option value="titulo">Por título (A-Z)</option>
                    <option value="titulo-desc">Por título (Z-A)</option>
                    <option value="plataforma">Por plataforma</option>
                    <option value="favorito">Favoritos primero</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-busqueda">🔍 Buscar <span class="shortcut-hint">(Ctrl+K)</span></label>
                <input type="text" id="filter-busqueda" placeholder="Nombre del juego..." />
            </div>
        </section>

        <!-- VISTA Y CONTADOR DE RESULTADOS -->
        <div class="toolbar">
            <div class="view-toggle">
                <button id="btn-grid" class="view-btn active" onclick="cambiarVista('grid')">📐</button>
                <button id="btn-list" class="view-btn" onclick="cambiarVista('list')">📋</button>
            </div>
            <div class="result-count">Mostrando <span id="result-count">0</span> juegos</div>
        </div>

        <!-- LISTA DE JUEGOS -->
        <section class="games-section">
            <div id="games-container" class="games-grid">
                <p class="loading">⏳ Cargando juegos...</p>
            </div>
        </section>

        <!-- FOOTER -->
        <footer class="footer">
            <div class="footer-actions">
                <button onclick="exportarDatos()" class="btn-footer">💾 Exportar JSON</button>
                <button onclick="document.getElementById('import-json').click()" class="btn-footer">📂 Importar JSON</button>
                <input type="file" id="import-json" accept=".json" style="display:none" onchange="importarDatos(event)" />
            </div>
            <p>🔄 Actualizado: <span id="fecha-actualizacion">--</span></p>
            <p>📦 <span id="total-juegos-footer">0</span> juegos en total</p>
        </footer>
    </div>

    <!-- MODAL -->
    <div id="modal-overlay" class="modal-overlay" style="display:none;">
        <div class="modal-content">
            <button id="modal-cerrar" class="modal-cerrar">✕</button>
            <div id="modal-body">
                <!-- Se llena con JavaScript -->
            </div>
            <div class="modal-nav">
                <button id="modal-prev" class="modal-nav-btn">◀</button>
                <button id="modal-next" class="modal-nav-btn">▶</button>
            </div>
        </div>
    </div>

    <script src="./js/script.js"></script>
</body>
</html>
