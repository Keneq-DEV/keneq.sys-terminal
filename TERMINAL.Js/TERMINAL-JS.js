// ==========================================
//    VARIABLES GLOBALES Y AUDIO
// ==========================================
const clickSnd = document.getElementById('snd-click');
const errorSnd = document.getElementById('snd-error');
const closeSnd = document.getElementById('snd-close');
const ambienceSnd = document.getElementById('snd-ambience');
const sequencer = document.getElementById('terminal-sequencer');

const musicTracks = [
    "TERMINAL.Audio/Main Theme.mp3",
];

// ==========================================
//    INICIALIZACIÓN (WINDOW LOAD)
// ==========================================
window.addEventListener('load', () => {
    // 1. Configurar volúmenes
    if (ambienceSnd) {
        ambienceSnd.volume = 0.3;
        ambienceSnd.play().catch(e => console.log("Autoplay bloqueado por el navegador"));
    }
    if (clickSnd) clickSnd.volume = 0.4;
    if (closeSnd) closeSnd.volume = 0.4;
    if (errorSnd) errorSnd.volume = 0.6;

    // 2. Iniciar Reloj
    updateClock();
    setInterval(updateClock, 1000);

    // 3. Iniciar Música
    playRandomTrack();
});

// Respaldo para iniciar audio con clic si el autoplay falla
document.addEventListener('click', () => {
    if (sequencer && sequencer.paused) {
        sequencer.play();
    }
}, { once: true });


// ==========================================
//    SISTEMA DE MÚSICA
// ==========================================
function playRandomTrack() {
    if (musicTracks.length === 0) return;

    const randomIndex = Math.floor(Math.random() * musicTracks.length);
    const selectedTrack = musicTracks[randomIndex];

    sequencer.src = selectedTrack;
    sequencer.loop = true;
    sequencer.volume = 0.4;

    sequencer.play().catch(e => {
        console.log("El navegador bloqueó el autoplay. La música empezará al primer clic.");
    });

    console.log("Track cargado:", selectedTrack);
}


// ==========================================
//    NAVEGACIÓN Y MODALES
// ==========================================
function goToDashboard() {
    if (clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }

    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(m => {
        m.style.display = 'none';
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }
    
    modal.style.display = 'flex';
    modal.classList.remove('closing');
    modal.classList.add('opening');
    setTimeout(() => {
            modal.classList.remove('opening');
        }, 400);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (closeSnd) { closeSnd.currentTime = 0; closeSnd.play(); }

    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 300); // Sincronizado con tu animación CSS
}


// ==========================================
//    MOTOR DE CARPETAS (FETCH JSON)
// ==========================================
async function openFolderContent(folderId) {
    if (typeof clickSnd !== 'undefined') { clickSnd.currentTime = 0; clickSnd.play(); }

    const viewRoot = document.getElementById('view-root');
    const unitViewer = document.getElementById('unit-viewer');
    
    const currentActiveView = viewRoot.style.display === 'block' ? viewRoot : unitViewer;
    const nextView = (folderId === 'view-root' || folderId === 'main-explorer-root') ? viewRoot : unitViewer;

    // 1. Glitch de salida
    currentActiveView.classList.add('anim-closing');

    setTimeout(async () => {
        currentActiveView.style.display = 'none';
        currentActiveView.classList.remove('anim-closing');
        
        nextView.style.display = 'block';
        nextView.classList.add('anim-opening');

        if (nextView === unitViewer) {
            const grid = unitViewer.querySelector('.unit-grid');
            grid.innerHTML = '<p style="padding:20px; opacity:0.5;">DECRYPTING_DATA...</p>';
            
            try {
                const response = await fetch(`TERMINAL.DATA/UNITS.json?t=${new Date().getTime()}`);
                const data = await response.json();
                const botsList = data[folderId];

                if (botsList) {
                    grid.innerHTML = '';
                    botsList.forEach(bot => {
                        // CORRECCIÓN: Se cambia closeSnd por errorSnd para los bots bloqueados
                        const cardHTML = `
                            <div class="unit-card-wrapper ${bot.corrupted ? 'corrupted' : ''}">
                                <a href="${bot.corrupted ? 'javascript:void(0)' : bot.link}" 
                                   target="${bot.corrupted ? '_self' : '_blank'}" 
                                   class="unit-image-link"
                                   ${bot.corrupted ? `onclick="openModal('modal-error'); if(typeof errorSnd !== 'undefined'){errorSnd.currentTime=0;errorSnd.play();}"` : ""}>
                                    <img src="${bot.img}">
                                </a>
                                <div class="unit-info">
                                    <span class="unit-name">${bot.id}</span>
                                    <p class="unit-desc"></p>
                                </div>
                            </div>`;
                        grid.insertAdjacentHTML('beforeend', cardHTML);
                    });
                    generateUnitTechData();
                }
            } catch (e) { console.error("Error en el flujo de datos.", e); }
        }

        const pathName = folderId.replace('view-', '').toUpperCase();
        document.getElementById('current-path').innerText = `This PC > Local Disk (C:) > Units > ${folderId === 'view-root' ? '' : pathName}`;

        setTimeout(() => {
            nextView.classList.remove('anim-opening');
        }, 400);

    }, 300);
}


// ==========================================
//    GENERADOR DE DATOS TÉCNICOS
// ==========================================
function generateUnitTechData() {
    // Lista auxiliar por si hay bots estáticos fuera del JSON que necesiten corrupción manual
    const corruptedUnitsNames = ["MAKO", "NEPHTHYS", "NEMESIS", "HUCKLE-BERRY"];

    document.querySelectorAll('.unit-card-wrapper').forEach(card => {
        const descElement = card.querySelector('.unit-desc');
        const unitNameElement = card.querySelector('.unit-name');

        if (unitNameElement && descElement) {
            const name = unitNameElement.innerText.trim();
            // Verificamos si ya tiene la clase por el JSON o si está en la lista manual
            const isCorrupted = card.classList.contains('corrupted') || corruptedUnitsNames.includes(name);

            // Generador HEX
            const n = () => Math.floor(Math.random() * 10);
            const l = () => "ABCDEFGIHJKNLOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26));
            const idHex = `#${n()}${l()}${n()}${l()}${n()}${l()}`;

            // Valores
            const status = isCorrupted ? "CORRUPTED" : "OPERATIONAL";
            const core = "V." + (Math.random() * 9 + 1).toFixed(1) + (Math.random() * 10).toFixed(3);
            const sync = isCorrupted ? "00%" : (Math.floor(Math.random() * 11) + 90) + "%";

            descElement.innerText = `ID_HEX: ${idHex} // STATUS: ${status} // CORE: ${core} // SYNC: ${sync}`;
        }
    });
}

// ==========================================
//    UTILIDADES DE INTERFAZ
// ==========================================
function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}

function setViewSize(sizeClass) {
    if (clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }

    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if(window.event) window.event.target.classList.add('active');

    const allGrids = document.querySelectorAll('.explorer-grid, .unit-grid');
    allGrids.forEach(grid => {
        grid.classList.remove('size-s', 'size-m', 'size-l');
        grid.classList.add(sizeClass);
    });
}

function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) clock.innerText = new Date().toLocaleTimeString('es-ES', { hour12: false });
}

// Función auxiliar de manager manual
function applySecurityProtocols() {
    const corruptedUnits = ["MAKO", "NEPHTHYS", "NEMESIS", "HUCKLE-BERRY"];
    
    document.querySelectorAll('.unit-card-wrapper').forEach(card => {
        const unitNameElement = card.querySelector('.unit-name');
        if (unitNameElement) {
            const name = unitNameElement.innerText.trim();
            const link = card.querySelector('.unit-image-link');
            
            if (corruptedUnits.includes(name)) {
                card.classList.add('corrupted');
                if (link) {
                    link.onclick = function(e) {
                        e.preventDefault();
                        if(errorSnd) { errorSnd.currentTime = 0; errorSnd.play(); }
                        openModal('modal-error');
                        return false;
                    };
                }
            }
        }
    });
}

// --- SISTEMA DE ARCHIVOS CLASIFICADOS ---

let allBotsCache = []; // Para no cargar el JSON cada vez

async function loadArchives() {
    if(clickSnd) clickSnd.play();
    
    // 1. Cargar JSON y aplanar la lista (sacar bots de las carpetas)
    const response = await fetch(`TERMINAL.DATA/UNITS.json?t=${new Date().getTime()}`);
    const data = await response.json();
    
    allBotsCache = [];
    // Recorremos todas las categorías para hacer una sola lista
    Object.values(data).forEach(list => {
        allBotsCache = allBotsCache.concat(list);
    });

    // 2. Llenar la barra lateral
    const listContainer = document.getElementById('archive-list');
    listContainer.innerHTML = '';
    
    allBotsCache.forEach((bot, index) => {
        const item = document.createElement('div');
        item.className = 'archive-item';
        item.innerText = `> ${bot.id}`;
        item.onclick = () => showDossier(index);
        listContainer.appendChild(item);
    });
}

function showDossier(index) {
    if(clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }

    const bot = allBotsCache[index];
    const placeholder = document.getElementById('dossier-placeholder');
    const content = document.getElementById('dossier-content');
    
    // Switch de vista
    placeholder.style.display = 'none';
    content.style.display = 'block';
    
    // Llenar Datos
    document.getElementById('dos-name').innerText = bot.id;
    document.getElementById('dos-org').innerText = bot.org || "UNKNOWN ORIGIN";
    document.getElementById('dos-desc').innerText = bot.desc || "No data available.";
    
    // Estado
    const statusEl = document.getElementById('dos-status');
    if(bot.corrupted) {
        statusEl.innerText = "STATUS: CORRUPTED";
        statusEl.style.borderColor = "var(--rojo-error)";
        statusEl.style.color = "var(--rojo-error)";
    } else {
        statusEl.innerText = "STATUS: ONLINE";
        statusEl.style.borderColor = "var(--verde-base)";
        statusEl.style.color = "var(--verde-base)";
    }

    // Tags con clases dinámicas
    const tagsContainer = document.getElementById('dos-tags');
    tagsContainer.innerHTML = '';
    if(bot.tags) {
        bot.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = `tag-badge tag-${tag.toLowerCase()}`; // ej: tag-horror
            span.innerText = tag;
            tagsContainer.appendChild(span);
        });
    }

    // Galería
    const mainImg = document.getElementById('dos-main-img');
    const thumbsContainer = document.getElementById('dos-thumbnails');
    
    // Imagen principal
    mainImg.src = bot.img;
    
    // Miniaturas (Imagen base + Galería extra)
    thumbsContainer.innerHTML = '';
    
    // Array con todas las imagenes (Base + Extras)
    let images = [bot.img];
    if(bot.gallery) images = images.concat(bot.gallery);

    images.forEach(imgUrl => {
        const thumb = document.createElement('img');
        thumb.src = imgUrl;
        thumb.className = 'thumb-img';
        thumb.onclick = () => {
            mainImg.src = imgUrl; // Cambiar imagen grande al click
            if(clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }
        };
        thumbsContainer.appendChild(thumb);
    });

    // --- LÓGICA DE ARTISTA ---
    const orgElement = document.getElementById('dos-org');

    if (bot.org_link) {
        // SI TIENE LINK: Crea el enlace usando el nombre como texto
        orgElement.innerHTML = `<a href="${bot.org_link}" target="_blank" class="artist-link">${bot.org}</a>`;
    } else {
        // SI NO TIENE LINK: Pone solo el texto plano
        orgElement.innerText = bot.org || "UNKNOWN ORIGIN";
    }
}




/* ===================================================
   SISTEMA DE TEMAS Y AUDIO AVANZADO
   =================================================== */

// CONFIGURACIÓN DE LOS TEMAS Y SUS PLAYLISTS
// Asegúrate de que los archivos de audio existan en TERMINAL.Audio/
const systemThemes = [
    {
        name: "FRAGMENTED",
        className: "default",
        version: "2.0",
        folder: "Fragmented", // Carpeta: TERMINAL.Audio/Fragmented/
        tracks: [
            "default_soundtrack_1.mp3", 
            "default_soundtrack_2.mp3"
        ]
    },

    {
        name: "LEGACY",
        className: "theme-legacy",
        version: "3.5",
        folder: "Legacy", // Carpeta: TERMINAL.Audio/Legacy/
        tracks: [
            "legacy_soundtrack_1.mp3", 
            "legacy_soundtrack_2.mp3",
            "legacy_soundtrack_3.mp3",
            "legacy_soundtrack_4.mp3",
            "legacy_soundtrack_5.mp3"
        ]
    },

    {
        name: "UNITY",
        className: "theme-unity",
        version: "5.1",
        folder: "Unity", // Carpeta: TERMINAL.Audio/Unity/
        tracks: [
            "Unity_soundtrack_1.mp3", 
            "Unity_soundtrack_2.mp3",
            "Unity_soundtrack_3.mp3",
            "Unity_soundtrack_4.mp3",
            "Unity_soundtrack_5.mp3"
        ]
    },

    {
        name: "DEUS",
        className: "theme-deus",
        version: "7.7",
        folder: "Deus", // Carpeta: TERMINAL.Audio/Deus/
        tracks: [
            "Deus_soundtrack_1.mp3",
             "Deus_soundtrack_2.mp3"
            
        ]
    },

    {
        name: "EX",
        className: "theme-ex",
        version: "9.9",
        folder: "Ex", // Carpeta: TERMINAL.Audio/Ex/
        tracks: [
            "Ex_soundtrack_1.mp3" 
            
        ]
    },

    {
        name: "BRIDGES",
        className: "theme-bridges",
        version: "11.11",
        folder: "Bridges", // Carpeta: TERMINAL.Audio/Bridges/
        tracks: [
            "Bridges_soundtrack_1.mp3",
            "Bridges_soundtrack_2.mp3",
            "BB-Theme.mp3",
            "Tonight, Tonight, Tonight.mp3"


            
        ]
    }

];

let currentThemeIndex = 0;

// --- INICIALIZACIÓN ---
window.onload = function() {
    // 1. Cargar tema guardado
    const savedThemeName = localStorage.getItem('nightdrive_theme');
    if (savedThemeName) {
        // Buscar el índice del tema guardado
        const foundIndex = systemThemes.findIndex(t => t.name === savedThemeName);
        if (foundIndex !== -1) currentThemeIndex = foundIndex;
    }

    // 2. Aplicar el tema sin animación (carga inicial)
    applyTheme(false);

    // 3. Configurar volumen
    if (sequencer) sequencer.volume = 0.3;
    
    // 4. Iniciar reloj
    updateClock();
    setInterval(updateClock, 1000);
};


// --- FUNCIÓN DE CAMBIO DE TEMA (BOTÓN) ---
// --- NUEVO SISTEMA DE MENÚ DESPLEGABLE ---

// 1. Abrir / Cerrar el menú
function toggleThemeMenu() {
    // Sonido click
    if(document.getElementById('snd-click')) { 
        document.getElementById('snd-click').currentTime=0; 
        document.getElementById('snd-click').play(); 
    }

    const menu = document.getElementById('theme-menu');
    menu.classList.toggle('show');
}

// 2. Elegir un tema específico
function selectSpecificTheme(index) {
    // Si elegimos el mismo que ya está, solo cerramos y salimos
    if (index === currentThemeIndex) {
        document.getElementById('theme-menu').classList.remove('show');
        return;
    }

    // Actualizamos el índice
    currentThemeIndex = index;
    
    // Aplicamos el tema (con animación glitch)
    applyTheme(true);
    
    // Cerramos el menú
    document.getElementById('theme-menu').classList.remove('show');
}

// 3. Cerrar el menú si haces clic fuera (Mejora de UX)
window.onclick = function(event) {
    if (!event.target.matches('.theme-switcher-btn')) {
        const dropdowns = document.getElementsByClassName("theme-dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// --- FUNCION CORRECTORA DE CLASES (LIMPIEZA TOTAL) ---
function setBodyClass(className) {
    // 1. Buscamos todas las clases que tiene el body actualmente
    const currentClasses = Array.from(document.body.classList);
    
    // 2. Filtramos y eliminamos CUALQUIER clase que empiece con "theme-"
    currentClasses.forEach(c => {
        if (c.startsWith('theme-')) {
            document.body.classList.remove(c);
        }
    });

    // 3. Si el nuevo tema no es el de por defecto (Fragmented), añadimos la clase
    if (className !== 'default' && className !== '') {
        document.body.classList.add(className);
    }
    
    console.log("Sistema purgado. Clase actual:", document.body.className || "default");
}

// --- ACTUALIZACIÓN DE LA FUNCIÓN APPLYTHEME (Para el Glitch) ---
function applyTheme(animate) {
    const theme = systemThemes[currentThemeIndex];
    const transitionLayer = document.getElementById('theme-transition-layer');

    if (animate) {
        transitionLayer.classList.add('active');
        
        setTimeout(() => {
            setBodyClass(theme.className);
            
            // --- ESTO ES LO QUE HACE EL CAMBIO DEL LOGO ---
            const versionSpan = document.getElementById('sys-version');
            if (versionSpan) {
                const letter = theme.name.charAt(0).toUpperCase();
                versionSpan.innerText = `v${theme.version}-${letter}`;
                console.log("Versión actualizada a: " + theme.version + "-" + letter);
            }
            
            // Actualizar texto del botón
            const btn = document.getElementById('theme-btn');
            if (btn) btn.innerText = `[ THEME: ${theme.name} ] ▼`;

            changeMusic(theme);
        }, 250);

        setTimeout(() => { transitionLayer.classList.remove('active'); }, 600);
    } else {
        // Esto es para cuando cargas la página (F5)
        setBodyClass(theme.className);
        
        const versionSpan = document.getElementById('sys-version');
        if (versionSpan) {
            const letter = theme.name.charAt(0).toUpperCase();
            versionSpan.innerText = `v${theme.version}-${letter}`;
        }
        
        const btn = document.getElementById('theme-btn');
        if (btn) btn.innerText = `[ THEME: ${theme.name} ] ▼`;
        
        changeMusic(theme);
    }
    localStorage.setItem('nightdrive_theme', theme.name);
}




// Auxiliar: Texto del Botón
function updateButtonText(name) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerText = `[ THEME: ${name} ]`;
}

// Auxiliar: Motor de Audio
// Auxiliar: Motor de Audio
function changeMusic(theme) {
    if (!theme.tracks || theme.tracks.length === 0) return;

    // Elegir canción al azar
    const randomTrack = theme.tracks[Math.floor(Math.random() * theme.tracks.length)];
    
    // CONSTRUCCIÓN DE RUTA CORREGIDA:
    // TERMINAL.Audio / NombreCarpeta / NombreArchivo
    const path = `TERMINAL.Audio/${theme.folder}/${randomTrack}`;

    sequencer.src = path;
    sequencer.loop = true;
    sequencer.play().catch(e => console.log("Audio esperando interacción."));
    
    console.log("Reproduciendo:", path); // Para que verifiques en consola si la ruta está bien
}