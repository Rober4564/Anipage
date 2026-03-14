# Anipage Explorer

Aplicación web estática para descubrir anime y personajes con una interfaz moderna, construida únicamente con **HTML, CSS y JavaScript**.

---

## 1) Objetivo del proyecto

Anipage Explorer está diseñado para:

- Mostrar en portada un **Top 10 de anime** de forma visual (tarjetas modernas).
- Permitir que el usuario pulse cualquier tarjeta y vea un **apartado de detalle completo**.
- Incluir un buscador de anime (AniList) y un buscador de personajes (Jikan/MyAnimeList).
- Funcionar sin backend propio (todo se hace desde el navegador con APIs públicas).

---

## 2) Tecnologías y APIs

### Frontend
- **HTML5** para estructura.
- **CSS3** para diseño responsive, paneles y tarjetas.
- **JavaScript (ES6+)** para lógica de negocio y consumo de APIs.

### APIs externas
1. **AniList GraphQL API**
   - Endpoint: `https://graphql.anilist.co`
   - Uso en el proyecto:
     - Cargar Top 10 anime.
     - Buscar anime por texto.
2. **Jikan REST API (MyAnimeList)**
   - Endpoint base: `https://api.jikan.moe/v4`
   - Uso en el proyecto:
     - Buscar personajes por nombre.

---

## 3) Estructura del proyecto

```text
Anipage/
├── index.html      # Estructura de la interfaz
├── styles.css      # Estilos modernos y responsive
├── app.js          # Lógica, llamadas a API, renderizado
└── README.md       # Documentación
```

---

## 4) Flujo general de funcionamiento

1. Se carga `index.html`.
2. `app.js` se ejecuta (`defer`) y enlaza nodos del DOM.
3. Se llama automáticamente a `loadTopAnime()` para poblar la portada.
4. El usuario puede:
   - Buscar anime en el panel izquierdo.
   - Buscar personajes en el panel derecho.
   - Pulsar una tarjeta del Top para abrir el panel de detalle.

---

## 5) Documentación detallada por archivo

## `index.html`

Define la estructura principal:

- **Header/Hero** con título y subtítulo.
- **Dos paneles de búsqueda**:
  - Formulario de anime: `#anime-search-form` y contenedor `#anime-results`.
  - Formulario de personajes: `#character-search-form` y contenedor `#character-results`.
- **Sección principal** del Top 10:
  - Estado de carga: `#top-status`.
  - Grid de tarjetas: `#top-anime`.
- **Sección de detalle** oculta al inicio:
  - `#details` con clase `hidden`.
- **Template reutilizable de tarjeta**:
  - `#anime-card-template`, usado por JavaScript para crear cada tarjeta dinámicamente.

## `styles.css`

Organiza el aspecto visual moderno:

- Variables CSS (`:root`) para paleta de colores y consistencia de diseño.
- Fondo con gradientes y brillo (`.bg-glow`) para look premium.
- Diseño de paneles translúcidos (`.panel`) y tarjetas (`.anime-card`).
- Grids responsivos (`.search-grid`, `.card-grid`) para escritorio y móvil.
- Bloque de detalle (`.details`) con layout de imagen + contenido.
- Media query para adaptar la sección de detalle en pantallas pequeñas.

## `app.js`

Contiene la lógica completa de datos y renderizado.

### Constantes globales

- `anilistEndpoint`: URL GraphQL de AniList.
- `jikanEndpoint`: URL base de Jikan.
- Referencias del DOM:
  - `topAnimeContainer`, `topStatus`, `detailsContainer`
  - `animeForm`, `characterForm`
  - `animeResults`, `characterResults`
  - `cardTemplate`

### Funciones

#### 1) `cleanText(html = "")`

**Propósito:**
- Limpiar texto recibido desde API eliminando etiquetas HTML y espacios extra.

**Entrada:**
- `html` (string): texto potencialmente con etiquetas.

**Salida:**
- String limpio listo para mostrar en UI.

**Uso:**
- Descripciones cortas de tarjetas.
- Descripción larga en panel de detalles.

---

#### 2) `fetchAniList(query, variables)` *(async)*

**Propósito:**
- Centralizar peticiones GraphQL a AniList.

**Entrada:**
- `query` (string): consulta GraphQL.
- `variables` (object): variables para la consulta.

**Proceso interno:**
1. Hace `fetch` POST a AniList.
2. Valida código HTTP.
3. Parsea JSON.
4. Si AniList responde con `errors`, lanza excepción.

**Salida:**
- `payload.data` (objeto con datos útiles).

**Errores:**
- Lanza `Error` con mensaje contextual para mostrar en interfaz.

---

#### 3) `renderTopCards(items)`

**Propósito:**
- Dibujar en pantalla el grid de tarjetas del Top 10.

**Entrada:**
- `items` (array): lista de animes con campos de título, imagen, score, etc.

**Proceso interno:**
1. Limpia el contenedor `#top-anime`.
2. Clona el template `#anime-card-template` por cada anime.
3. Inserta portada, título, metadatos y descripción corta.
4. Conecta el botón de cada tarjeta con `renderDetails(anime)`.
5. Añade cada tarjeta al DOM.

**Salida:**
- No retorna valor; actualiza la UI.

---

#### 4) `renderDetails(anime)`

**Propósito:**
- Mostrar información completa del anime seleccionado en el bloque `#details`.

**Entrada:**
- `anime` (object): objeto del anime pulsado.

**Datos mostrados:**
- Portada.
- Título.
- Descripción.
- Estado.
- Número de capítulos.
- Puntuación.
- Géneros.
- Estudio principal.
- Popularidad.

**Comportamiento adicional:**
- Quita la clase `hidden`.
- Hace scroll suave hacia la sección de detalle.

---

#### 5) `loadTopAnime()` *(async)*

**Propósito:**
- Cargar automáticamente el Top 10 al iniciar la aplicación.

**Proceso interno:**
1. Muestra estado de carga en `#top-status`.
2. Ejecuta consulta GraphQL con `Page(perPage: 10)` y orden por popularidad/score.
3. Llama a `renderTopCards(topAnime)`.
4. Actualiza estado visual a “Top actualizado”.

**Manejo de errores:**
- Si falla la petición, pinta mensaje de error en el grid y estado “Error”.

---

### Eventos y listeners

#### Formulario de búsqueda de anime (`animeForm`)

- Evento: `submit`.
- Pasos:
  1. Evita recarga de página (`preventDefault`).
  2. Lee `#anime-query`.
  3. Consulta AniList (máximo 6 resultados).
  4. Renderiza resultados en `#anime-results`.
  5. Si no hay resultados, muestra mensaje informativo.

#### Formulario de búsqueda de personajes (`characterForm`)

- Evento: `submit`.
- Pasos:
  1. Evita recarga de página.
  2. Lee `#character-query`.
  3. Llama a Jikan con query y límite de 6.
  4. Renderiza nombre y apodos en `#character-results`.
  5. Si no hay resultados, muestra mensaje informativo.

### Inicialización

- Al final del archivo se ejecuta:

```js
loadTopAnime();
```

Esto dispara la carga inicial de la portada.

---

## 6) Contratos de datos (resumen)

### Anime (AniList) esperado en tarjetas/detalle
- `id`
- `title.romaji` / `title.english`
- `description`
- `coverImage.large` / `coverImage.extraLarge`
- `averageScore`
- `episodes`
- `seasonYear`
- `status`
- `genres[]`
- `popularity`
- `studios.nodes[].name`

### Personaje (Jikan) esperado en búsqueda
- `name`
- `nicknames[]`

---

## 7) Ejecución local

Al ser un proyecto estático puedes abrir `index.html` directamente, pero se recomienda servidor local:

```bash
python3 -m http.server 8000
```

Después abre:

```text
http://localhost:8000
```

---

## 8) Posibles mejoras futuras

- Paginación en búsquedas.
- Filtros por género, año, temporada y estado.
- Vista dedicada de personaje con más campos.
- Caché local para reducir peticiones repetidas.
- Internacionalización (ES/EN/JP).

---

## 9) Licencia y uso de APIs

- Este proyecto usa APIs públicas de terceros (AniList/Jikan).
- Revisa límites de uso y políticas de cada servicio antes de llevarlo a producción.
