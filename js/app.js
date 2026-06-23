let juegos = [];

/* =========================
   CARGAR DATOS
========================= */

async function cargarDatos() {

    const response = await fetch(
        "data/juegos.json?v=" + Date.now()
    );

    juegos = await response.json();

    cargarPlataformas();
    renderizar();
}

/* =========================
   PLATAFORMAS
========================= */

function cargarPlataformas() {

    const select =
        document.getElementById("platformFilter");

    select.innerHTML =
        '<option value="">Todas las plataformas</option>';

    const plataformas =
        [...new Set(juegos.map(j => j.plataforma))];

    plataformas.sort().forEach(p => {

        const option =
            document.createElement("option");

        option.value = p;
        option.textContent = p;

        select.appendChild(option);
    });
}

/* =========================
   FILTROS
========================= */

function obtenerLista() {

    const texto =
        document.getElementById("search")
            .value.toLowerCase();

    const plataforma =
        document.getElementById("platformFilter")
            .value;

    const orden =
        document.getElementById("sortFilter")
            .value;

    let lista = juegos.filter(j => {

        return j.titulo.toLowerCase().includes(texto) &&
            (!plataforma || j.plataforma === plataforma);
    });

    if (orden === "available") {
        lista = lista.filter(j => !j.prestadoA);
    }

    if (orden === "loaned") {
        lista = lista.filter(j => j.prestadoA);
    }

    if (orden === "az") {
        lista.sort((a, b) =>
            a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" })
        );
    }

    if (orden === "za") {
        lista.sort((a, b) =>
            b.titulo.localeCompare(a.titulo, "es", { sensitivity: "base" })
        );
    }

    return lista;
}

/* =========================
   RENDER
========================= */

function renderizar() {

    const lista = obtenerLista();

    const container =
        document.getElementById("gamesContainer");

    container.innerHTML = "";

    lista.forEach(j => {

        const imagenes =
            j.imagenes && j.imagenes.length > 0
                ? j.imagenes
                : [j.portada];

        container.innerHTML += `
        <div class="game-card">

            <div class="image-container"
                 onmouseenter="startPreview(this)"
                 onmouseleave="stopPreview(this)">

                <img
                    src="${imagenes[0]}"
                    data-images='${JSON.stringify(imagenes)}'
                    alt="${j.titulo}"
                    onerror="this.src='images/no-image.jpg'"
                >

            </div>

            <div class="game-info">

                <div class="game-title">${j.titulo}</div>

                <div class="platform">${j.plataforma}</div>

                <div class="region">${j.region}</div>

                <div class="prestamo">
                    ${
                        j.prestadoA
                        ? `<span class="loaned">🔴 Prestado a ${j.prestadoA}</span>`
                        : `<span class="available">🟢 Disponible</span>`
                    }
                </div>

            </div>

        </div>
        `;
    });

    document.getElementById("stats").textContent =
        `Total juegos: ${lista.length}`;
}

/* =========================
   HOVER GALERÍA
========================= */

let intervalMap = new Map();

function startPreview(container) {

    const img = container.querySelector("img");

    let images = JSON.parse(img.dataset.images);

    if (images.length <= 1) return;

    let i = 0;

    intervalMap.set(img, setInterval(() => {

        i = (i + 1) % images.length;

        img.src = images[i];

    }, 800));
}

function stopPreview(container) {

    const img = container.querySelector("img");

    if (intervalMap.has(img)) {
        clearInterval(intervalMap.get(img));
        intervalMap.delete(img);
    }

    let images = JSON.parse(img.dataset.images);

    img.src = images[0];
}

/* =========================
   EVENTOS
========================= */

document.getElementById("search").addEventListener("input", renderizar);
document.getElementById("platformFilter").addEventListener("change", renderizar);
document.getElementById("sortFilter").addEventListener("change", renderizar);

/* =========================
   INICIO
========================= */

cargarDatos();
