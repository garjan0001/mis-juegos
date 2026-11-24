import json
import time
import re
import unicodedata
import requests
from bs4 import BeautifulSoup

RUTA_JSON = 'data/juegos.json'

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
})

TASA_USD_A_EUR = 0.92

MAPA_SLUGS = {
    'playstation': 'playstation',
    'playstation 1': 'playstation',
    'ps1': 'playstation',
    'playstation 2': 'playstation-2',
    'ps2': 'playstation-2',
    'playstation 3': 'playstation-3',
    'ps3': 'playstation-3',
    'playstation 4': 'playstation-4',
    'ps4': 'playstation-4',
    'psp': 'psp',
    'ps vita': 'playstation-vita',
    'nintendo switch': 'nintendo-switch',
    'wii': 'wii',
    'wii u': 'wii-u',
    'nintendo ds': 'nintendo-ds',
    'nintendo 3ds': 'nintendo-3ds',
    'game boy': 'gameboy',
    'game boy color': 'gameboy-color',
    'game boy advance': 'gameboy-advance',
    'super nintendo': 'super-nintendo',
    'nes': 'nes',
    'nintendo 64': 'nintendo-64',
    'gamecube': 'gamecube',
    'megadrive': 'sega-genesis',
    'mega drive': 'sega-genesis',
    'dreamcast': 'sega-dreamcast',
    'xbox': 'xbox',
    'xbox 360': 'xbox-360',
    'xbox one': 'xbox-one'
}

def a_slug(texto):
    texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')
    texto = texto.lower().replace('&', 'and')
    texto = re.sub(r'[^a-z0-9]+', '-', texto).strip('-')
    return texto

def generar_variantes_slug(titulo):
    base = a_slug(titulo)
    variantes = [base]
    
    # Añade esto dentro de generar_variantes_slug(titulo) en actualizar_precios.py:
    REEMPLAZOS_COMUNES = {
        'gta-': 'grand-theft-auto-',
        'los-sims': 'the-sims',
        'onimusha': 'onimusha-warlords',
        'tekken-tag': 'tekken-tag-tournament',
        'resident-evil-code-veronica': 'resident-evil-code-veronica-x',
        'socom': 'socom-us-navy-seals',
        'dogs-life': 'dog-s-life',
        'evil-twin': 'evil-twin-cyprien-s-chronicles',
        'juiced-2': 'juiced-2-hot-import-nights',
        'toca-racer-driver-2': 'toca-race-driver-2',
        'crash-bandicoot-wrath-cortex': 'crash-bandicoot-the-wrath-of-cortex',
        'crash-guerra-al-coco-maniaco': 'crash-mind-over-mutant',
        'locos-por-el-surf': 'surf-s-up',
        'gru-mi-villano-favorito': 'despicable-me',
        'disney-monstruos-s-a': 'monsters-inc',
        'disney-tarzan': 'tarzan-untamed',
        'la-leyenda-de-spyro': 'the-legend-of-spyro-a-new-beginning',
        'el-senor-de-los-anillos-las-dos-torres': 'the-lord-of-the-rings-the-two-towers',
        'ratchet-and-clark-el-tamano-importa': 'ratchet-and-clank-size-matters',
        'lara-croft-tomb-raider-el-angel-de-la-oscuridad': 'tomb-raider-the-angel-of-darkness',
        'star-wars-episodio-3': 'star-wars-episode-iii-revenge-of-the-sith',
        'lego-indiana': 'lego-indiana-jones-the-original-adventures',
        'lego-star-wars-2': 'lego-star-wars-ii-the-original-trilogy',
        'call-of-duty-modern-warface': 'call-of-duty-modern-warfare',
        'kinect-adeventures': 'kinect-adventures',
        'sonic-raiders': 'sonic-riders',
        '18-eigteeen-wheeler': '18-wheeler-american-pro-truck',
        'god-of-war-ii': 'god-of-war-2',
        'god-of-war-triologia': 'god-of-war-trilogy',
        'f1-champ-edition': 'formula-one-championship-edition',
        'blazing-angels': 'blazing-angels-squadrons-of-wwii'
    }
    for k, v in REEMPLAZOS_COMUNES.items():
        if base == k or base.startswith(k):
            variantes.append(base.replace(k, v, 1))

    # 1. Convertir números finales 2, 3, 4 a romanos (ej. tomb-raider-2 -> tomb-raider-ii)
    romanos = {'2': 'ii', '3': 'iii', '4': 'iv', '5': 'v'}
    for num, rom in romanos.items():
        if re.search(rf'-{num}$', base):
            variantes.append(re.sub(rf'-{num}$', f'-{rom}', base))

    # 2. Quitar 'disney-' si va al principio o al final (ej. disney-tarzan -> tarzan)
    sin_disney = re.sub(r'(^disney-|-disney$)', '', base)
    if sin_disney != base:
        variantes.append(sin_disney)

    # 3. Separar palabras pegadas comunes (ej. soulblade -> soul-blade, xmen -> x-men)
    ajustes = base.replace('soulblade', 'soul-blade').replace('xmen', 'x-men').replace('everybodys', 'everybody-s')
    if ajustes != base:
        variantes.append(ajustes)

    # Eliminar duplicados manteniendo el orden
    return list(dict.fromkeys(variantes))

def leer_ficha_directa(consola_slug, juego_slug):
    url = "/".join(["https://pricecharting.com", "game", consola_slug, juego_slug])
    res = SESSION.get(url, timeout=15)
    if res.status_code != 200:
        return None

    soup = BeautifulSoup(res.text, 'html.parser')
    for selector in ['#complete_price .price', '#used_price .price']:
        el = soup.select_one(selector)
        if el:
            m = re.search(r'\$(\d+(?:,\d{3})*\.\d{2})', el.get_text())
            if m:
                return round(float(m.group(1).replace(',', '')) * TASA_USD_A_EUR, 2)
    return None

def obtener_precio_pricecharting(juego):
    titulo = juego.get('titulo', '')
    plataforma = juego.get('plataforma', '')
    region = juego.get('region', '')

    base_consola = MAPA_SLUGS.get(plataforma.lower().strip(), a_slug(plataforma))
    es_pal = 'pal' in region.lower()

    consolas = [f"pal-{base_consola}", base_consola] if es_pal else [base_consola]
    
    # Si el juego tiene un slug manual en el JSON ("slug_pc"), lo usa primero
    slugs_juego = [juego['slug_pc']] if juego.get('slug_pc') else generar_variantes_slug(titulo)

    for consola_slug in consolas:
        for j_slug in slugs_juego:
            precio = leer_ficha_directa(consola_slug, j_slug)
            if precio is not None:
                return precio
            time.sleep(0.4)

    return None

def main():
    with open(RUTA_JSON, 'r', encoding='utf-8') as f:
        juegos = json.load(f)

    encontrados = 0
    for juego in juegos:
        titulo = juego.get('titulo', '')
        plataforma = juego.get('plataforma', '')
        print(f"Buscando precio: {titulo} ({plataforma})...", flush=True)
        
        precio = obtener_precio_pricecharting(juego)
        if precio is not None:
            juego['precio'] = precio
            encontrados += 1
            print(f"  -> {precio} €", flush=True)
        else:
            juego.setdefault('precio', 0.0)
            print("  -> No encontrado", flush=True)
        
        time.sleep(0.6)

    print(f"\nResumen: {encontrados}/{len(juegos)} juegos actualizados.", flush=True)

    with open(RUTA_JSON, 'w', encoding='utf-8') as f:
        json.dump(juegos, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
