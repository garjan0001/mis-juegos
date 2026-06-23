let juegos = [];

/* =========================
   CARGA
========================= */

async function cargarDatos() {

    const res = await fetch("data/juegos.json?v=" + Date.now());
    juegos = await res.json();

    cargarPlataformas();
    renderizar();
}

/* =========================
   PLATAFORMAS
========================= */

function cargarPlataformas() {

    const select = document.getElementById("platformFilter");

    const plataformas = [...new Set(juegos.map(j => j.plataforma))];

    select.innerHTML = `<option value="">Todas las plataformas</option>`;

    plataformas.sort().forEach(p => {
        select.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

/* =========================
   FILTROS
========================= */

function getFiltrados() {

    const texto = document.getElementById("search").value.toLowerCase();
    const plataforma = document.getElementById("platformFilter").value;
    const fav = document.getElementById("favFilter").value;
    const orden = document.getElementById("sortFilter").value;

    let lista = juegos.filter(j => {

        return j.titulo.toLowerCase().includes(texto) &&
            (!plataforma || j.plataforma === plataforma) &&
            (!fav || j.favorito);
    });

    if (orden === "available") {
        lista = lista.filter(j => !j.prestadoA);
    }

    if (orden === "loaned") {
        lista = lista.filter(j => j.prestadoA);
    }

    if (orden === "az") {
        lista.sort((a,b)=>a.titulo.localeCompare(b.titulo,"es"));
    }

    if (orden === "za") {
        lista.sort((a,b)=>b.titulo.localeCompare(a.titulo,"es"));
    }

    return lista;
}

/* =========================
   AGRUPAR
========================= */

function agrupar(lista) {

    const grupos = {};

    lista.forEach(j => {
        if (!grupos[j.plataforma]) grupos[j.plataforma] = [];
        grupos[j.plataforma].push(j);
    });

    return grupos;
}

/* =========================
   RENDER
========================= */

function renderizar() {

    const lista = getFiltrados();
    const grupos = agrupar(lista);

    const container = document.getElementById("gamesContainer");

    container.innerHTML = "";

    Object.keys(grupos).sort().forEach(plataforma => {

        container.innerHTML += `<h2 style="padding:10px">${plataforma}</h2>`;

        grupos[plataforma].forEach(j => {

            const imgs = j.imagenes?.length ? j.imagenes : [j.portada];

            container.innerHTML += `
            <div class="game-card" onclick="abrirDetalle(${j.id})">

                <div class="image-container"
                     onmouseenter="hoverStart(this)"
                     onmouseleave="hoverStop(this)">

                    <img src="${imgs[0]}"
                         data-images='${JSON.stringify(imgs)}'
                         onerror="this.src='images/no-image.jpg'">

                </div>

                <div class="game-info">

                    <div class="game-title">
                        ${j.titulo}
                        ${j.favorito ? "⭐" : ""}
                    </div>

                    <div class="platform">${j.plataforma}</div>

                    <div class="region">${j.region}</div>

                    <div>
                        ${j.prestadoA
                            ? `<span class="loaned">Prestado a ${j.prestadoA}</span>`
                            : `<span class="available">Disponible</span>`
                        }
                    </div>

                    <button onclick="event.stopPropagation(); toggleFav(${j.id})">
                        ⭐ Favorito
                    </button>

                </div>

            </div>`;
        });
    });

    stats();
}

/* =========================
   HOVER IMAGES
========================= */

let intervalMap = new Map();

function hoverStart(el) {

    const img = el.querySelector("img");
    const images = JSON.parse(img.dataset.images);

    if (images.length <= 1) return;

    let i = 0;

    intervalMap.set(img, setInterval(()=>{
        i = (i+1)%images.length;
        img.src = images[i];
    },700));
}

function hoverStop(el) {

    const img = el.querySelector("img");

    clearInterval(intervalMap.get(img));

    intervalMap.delete(img);

    const images = JSON.parse(img.dataset.images);
    img.src = images[0];
}

/* =========================
   FAVORITOS
========================= */

function toggleFav(id) {
    const j = juegos.find(x=>x.id===id);
    j.favorito = !j.favorito;
    renderizar();
}

/* =========================
   DETALLE
========================= */

function abrirDetalle(id){

    const j = juegos.find(x => x.id === id);

    const imagenes =
        j.imagenes && j.imagenes.length
        ? j.imagenes
        : [j.portada];

    let galeria = "";

    imagenes.forEach(img => {

        galeria += `
            <img
                src="${img}"
                class="detalle-thumb"
                onclick="cambiarImagenPrincipal('${img}')"
            >
        `;
    });

    document.getElementById("modalBody").innerHTML = `

        <h2>${j.titulo}</h2>

        <img
            id="imagenPrincipal"
            src="${imagenes[0]}"
            class="detalle-principal"
        >

        <div class="detalle-galeria">
            ${galeria}
        </div>

        <hr>

        <p><b>Plataforma:</b> ${j.plataforma}</p>

        <p><b>Región:</b> ${j.region}</p>

        <p><b>Estado:</b>
        ${j.prestadoA
            ? "Prestado a " + j.prestadoA
            : "Disponible"}
        </p>

        <p><b>Conservación:</b></p>

        <p>
            ${j.estado || "Sin información"}
        </p>

        <p><b>Descripción:</b></p>

        <p>
            ${j.descripcion || "Sin descripción"}
        </p>

    `;

    document
        .getElementById("modal")
        .classList.remove("hidden");
}

window.cerrarModal = function(){

    document
        .getElementById("modal")
        .classList.add("hidden");

}

/* =========================
   ESTADÍSTICAS
========================= */

function stats(){

    const total = juegos.length;
    const prestados = juegos.filter(j => j.prestadoA).length;
    const favoritos = juegos.filter(j => j.favorito).length;

    const porPlataforma = {};

    juegos.forEach(j => {

        porPlataforma[j.plataforma] =
            (porPlataforma[j.plataforma] || 0) + 1;
    });

    let html = `
        <h3>📊 Estadísticas</h3>

        <div class="stats-item">
            <span>Total</span>
            <span class="stats-total">${total}</span>
        </div>

        <div class="stats-item">
            <span>Prestados</span>
            <span>${prestados}</span>
        </div>

        <div class="stats-item">
            <span>Favoritos</span>
            <span>${favoritos}</span>
        </div>

        <hr style="margin:8px 0;border-color:#333;">
    `;

    Object.keys(porPlataforma)
        .sort()
        .forEach(p => {

            html += `
                <div class="stats-item">
                    <span>${p}</span>
                    <span>${porPlataforma[p]}</span>
                </div>
            `;
        });

    document.getElementById("stats").innerHTML = html;
}

/* =========================
   EVENTS
========================= */

document.getElementById("search").addEventListener("input",renderizar);
document.getElementById("platformFilter").addEventListener("change",renderizar);
document.getElementById("sortFilter").addEventListener("change",renderizar);
document.getElementById("favFilter").addEventListener("change",renderizar);

/* =========================
   INIT
========================= */

cargarDatos();

document
    .getElementById("modal")
    .addEventListener("click", function(e){

        if(e.target === this){
            cerrarModal();
        }

    });
function cambiarImagenPrincipal(url){

    document
        .getElementById("imagenPrincipal")
        .src = url;

}
