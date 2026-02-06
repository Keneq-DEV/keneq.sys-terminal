// ==========================================
//    VARIABLES GLOBALES Y AUDIO
// ==========================================
const clickSnd = document.getElementById('snd-click');
const errorSnd = document.getElementById('snd-error');
const closeSnd = document.getElementById('snd-close');
const ambienceSnd = document.getElementById('snd-ambience');
const sequencer = document.getElementById('terminal-sequencer');

const musicTracks = [
    "TERMINAL.Audio/Soundtrack_1.wav",
    "TERMINAL.Audio/Soundtrack_2.wav"
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
    if (clickSnd) { clickSnd.currentTime = 0; clickSnd.play(); }

    const viewRoot = document.getElementById('view-root');
    const unitViewer = document.getElementById('unit-viewer');
    const grid = unitViewer ? unitViewer.querySelector('.unit-grid') : null;

    // A) LOGICA HOME
    if (folderId === 'view-root' || folderId === 'main-explorer-root') {
        if (unitViewer) unitViewer.style.display = 'none';
        if (viewRoot) {
            viewRoot.style.display = 'block';
            viewRoot.classList.add('anim-opening');
        }
        const path = document.getElementById('current-path');
        if (path) path.innerText = "This PC > Local Disk (C:) > Units";
        return;
    }

    // B) LOGICA CARPETAS
    if (viewRoot) viewRoot.style.display = 'none';
    if (unitViewer) {
        unitViewer.style.display = 'block';
        unitViewer.classList.add('anim-opening');
    }

    if (grid) grid.innerHTML = '<p style="padding:20px; opacity:0.5;">LOADING_DATA...</p>';

    try {
        const response = await fetch('TERMINAL.DATA/UNITS.json');
        const data = await response.json();
        const botsList = data[folderId]; // Busca la llave (ej: view-scp)

        if (botsList && grid) {
            grid.innerHTML = ''; // Limpiar mensaje de carga

            botsList.forEach(bot => {
                // Generamos el HTML con la lógica de corrupción integrada
                const cardHTML = `
                    <div class="unit-card-wrapper ${bot.corrupted ? 'corrupted' : ''}">
                        <a href="${bot.corrupted ? 'javascript:void(0)' : bot.link}" 
                           target="${bot.corrupted ? '_self' : '_blank'}" 
                           class="unit-image-link"
                           ${bot.corrupted ? `onclick="openModal('modal-error'); if(typeof errorSnd !== 'undefined'){ errorSnd.currentTime=0; errorSnd.play(); } return false;"` : ""}>
                            <img src="${bot.img}">
                        </a>
                        <div class="unit-info">
                            <span class="unit-name">${bot.id}</span>
                            <p class="unit-desc"></p> <!-- Se llena con generateUnitTechData -->
                        </div>
                    </div>`;
                
                grid.insertAdjacentHTML('beforeend', cardHTML);
            });

            // Actualizar Ruta visualmente
            const pathElement = document.getElementById('current-path');
            if(pathElement) {
                pathElement.innerText = `This PC > Local Disk (C:) > Units > ${folderId.replace('view-', '').toUpperCase()}`;
            }

            // Generar los textos técnicos
            generateUnitTechData();
            
        } else {
            if (grid) grid.innerHTML = '<p style="padding:20px; color:var(--rojo-error);">[!] ERROR: DIRECTORY_EMPTY_OR_NOT_FOUND</p>';
        }

    } catch (e) {
        console.error("Fallo de acceso a la base de datos.", e);
        if (grid) grid.innerHTML = '<p style="color:red">CONNECTION_ERROR (Check Console)</p>';
    }
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

// Función auxiliar de manager manual (si tienes bots estáticos en el HTML)
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