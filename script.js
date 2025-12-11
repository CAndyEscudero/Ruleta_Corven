/* ============================================================
   SISTEMA DE SORTEO PREMIUM CORVEN (SIN RULETA)
   ============================================================ */

/* ======== VARIABLES GLOBALES ======== */
let participants = [];
let winners = [];
let raffleHistory = []; // <--- AGREGAR ESTA LÍNEA (Aquí guardaremos los grupos)
let freezeOdometer = false;
let isResultAnimating = false;


let odometers = [
    { reel: null, current: 0, speed: 0.5, spinning: true },
    { reel: null, current: 0, speed: 0.7, spinning: true },
    { reel: null, current: 0, speed: 0.6, spinning: true }
];

let globalSpin = false;   // cuando aprieto Sortear cambia a true
let finalWinnerIndex = 0; // lo calculamos después
let spinPhase = "idle";   // idle → fast → slowDown


/* ======== AL INICIAR ======== */
window.onload = () => {
    // 1. Capturamos los elementos primero para validar
    const reel1 = document.getElementById("odometerReel1");
    const reel2 = document.getElementById("odometerReel2");
    const reel3 = document.getElementById("odometerReel3");

    // 2. SEGURIDAD: Si falla algún ID, te avisa en pantalla
    if (!reel1 || !reel2 || !reel3) {
        alert("ERROR CRÍTICO: Falta un odómetro en el HTML. Revisa que los IDs sean: odometerReel1, odometerReel2, odometerReel3");
        console.error("Faltan elementos:", { reel1, reel2, reel3 });
        return;
    }

    // 3. Asignamos a la variable global
    odometers[0].reel = reel1;
    odometers[1].reel = reel2;
    odometers[2].reel = reel3;

    // 4. Inicializamos contadores visuales
    initNumericStrips();
    updateCounter();
    updateWinnersCounter();

    // 5. CRUCIAL: Primero llenamos la lista de nombres...
    updateOdometerList();

    // 6. ...y RECIÉN AHORA arrancamos el motor de animación.
    // (Si lo pones antes, la animación intenta mover una lista vacía y falla)
    startOdometerLoop();
};

/* EN TU SCRIPT.JS - Reemplaza startOdometerLoop entera */

function startOdometerLoop() {
    function loop() {
        // Si estamos en la animación final, no intervenir
        if (isResultAnimating) {
            requestAnimationFrame(loop);
            return;
        }

        const itemHeight = 60;
        // Altura real de la lista original
        const singleSetHeight = participants.length * itemHeight;

        odometers.forEach((od, index) => {
            // Si la lista está vacía, no animar
            if (singleSetHeight === 0) return;

            // --- Velocidad Base ---
            if (!globalSpin) {
                od.speed = 0.8 + (index * 0.3);
            }

            // --- Aceleración (Al sortear) ---
            if (globalSpin && spinPhase === "fast") {
                if (od.speed < 35) od.speed += 1.5; 
            }

            // Aumentamos el contador de "distancia recorrida"
            od.current += od.speed;

            // --- LOOP INFINITO ---
            // Si pasamos la altura de la lista, volvemos a 0
            if (od.current >= singleSetHeight) {
                od.current -= singleSetHeight;
            }

            // === AQUÍ ESTÁ EL TRUCO DEL GIRO INVERSO ===
            if (index === 1) { 
                // ODOMETRO 2 (CENTRAL): GIRA HACIA ABAJO
                // Calculamos la posición inversa: Empezamos desde el fondo (-singleSetHeight)
                // y le sumamos el avance. Esto hace que visualmente "caiga".
                const reversePos = singleSetHeight - od.current;
                od.reel.style.transform = `translateY(-${reversePos}px)`;
            } else {
                // ODOMETROS 1 y 3: GIRAN HACIA ARRIBA (Normal)
                od.reel.style.transform = `translateY(-${od.current}px)`;
            }
        });

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

/* ======== RELLENAR LOS RODILLOS 0-9 ======== */
function initNumericStrips() {
    const ids = [
        "strip1", "strip2", "strip3", "strip4",   // <-- PARTICIPANTES (4 columnas)
        "winStrip1", "winStrip2"                 // <-- GANADORES (2 columnas)
    ];

    ids.forEach(id => {
        const strip = document.getElementById(id);
        if (!strip) return;

        strip.innerHTML = "";

        // crear los números 0–9
        for (let i = 0; i <= 9; i++) {
            const span = document.createElement("span");
            span.textContent = i;
            strip.appendChild(span);
        }
    });
}


/* ============================================================
   1) AGREGAR PARTICIPANTES MANUAL
   ============================================================ */
function addName() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();

    if (!name) return;

    if (participants.includes(name)) {
        alert(`⚠️ El participante "${name}" ya está en la lista.`);
        return;
    }

    participants.push(name);
    input.value = "";

    updateCounter();
    updateOdometerList();
}


/* ============================================================
   2) IMPORTAR ARCHIVO (TXT, CSV)
   ============================================================ */
/* ============================================================
   FUNCIÓN LIMPIAR TODO (Participantes + Ganadores)
   ============================================================ */
function clearList() {
    if (confirm("¿Seguro que deseas reiniciar TODO (Participantes y Ganadores)?")) {
        
        // 1. LIMPIEZA DE DATOS (Arrays)
        participants = [];
        winners = []; 

        // 2. ACTUALIZAR CONTADORES VISUALES
        updateCounter();        // Pone el contador grande en 0000
        updateWinnersCounter(); // Pone el contador mini en 00

        // 3. LIMPIAR ODOMETROS DE NOMBRES
        updateOdometerList(); 

        // 4. LIMPIAR PANEL VISUAL DE GANADORES
        const list = document.getElementById("winnersList");
        if (list) {
            // Quitamos la clase de modo compacto si estaba activa
            list.classList.remove("compact-mode");
            
            // Borramos las tarjetas y restauramos el mensaje de espera animado
            list.innerHTML = '<div class="empty-state">Esperando ganador...</div>';
        }
        
        alert("✔ Sistema reiniciado correctamente.");
    }
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        const lines = e.target.result.split(/\r?\n/);

        let added = 0;
        let duplicates = {};

        lines.forEach(line => {
            const clean = line.trim();
            if (!clean) return;

            const processName = n => {
                const finalName = n.trim();
                if (!finalName) return;

                if (participants.includes(finalName)) {
                    duplicates[finalName] = (duplicates[finalName] || 0) + 1;
                } else {
                    participants.push(finalName);
                    added++;
                }
            };

            if (clean.includes(",")) clean.split(",").forEach(processName);
            else if (clean.includes(";")) clean.split(";").forEach(processName);
            else processName(clean);
        });

        updateCounter();
        updateOdometerList();

        if (Object.keys(duplicates).length > 0) {
            showDupesModal(added, duplicates);
        } else if (added > 0) {
            alert(`✔ Se agregaron ${added} participantes nuevos.`);
        } else {
            alert("⚠ No se agregaron participantes.");
        }

        input.value = "";
    };

    reader.readAsText(file);
}
/* ============================================================
   GESTIÓN DEL MODAL "VER LISTA DE PARTICIPANTES"
   ============================================================ */

function showParticipantsModal() {
    const modal = document.getElementById("participantsModal");
    const listContainer = document.getElementById("fullParticipantsList");
    const badge = document.getElementById("totalParticipantsBadge");
    
    // 1. Limpiar lista anterior
    listContainer.innerHTML = "";
    
    // 2. Si no hay nadie, mostrar mensaje
    if (participants.length === 0) {
        listContainer.innerHTML = '<li style="color: #666; text-align: center; padding: 20px;">La lista está vacía.</li>';
        badge.innerText = "0";
    } else {
        // 3. Generar la lista HTML (Optimizada)
        // Usamos un fragmento para no redibujar 1100 veces (es más rápido)
        const fragment = document.createDocumentFragment();
        
        // Ordenamos alfabéticamente para facilitar la búsqueda
        const sortedList = [...participants].sort(); 

        sortedList.forEach((name, index) => {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${name}`;
            li.style.borderBottom = "1px solid #222";
            li.style.padding = "5px";
            li.style.color = "#ddd";
            li.style.fontSize = "14px";
            fragment.appendChild(li);
        });
        
        listContainer.appendChild(fragment);
        badge.innerText = participants.length;
    }

    modal.style.display = "flex";
}

function closeParticipantsModal() {
    document.getElementById("participantsModal").style.display = "none";
}

// Función de búsqueda en tiempo real
function filterParticipants() {
    const input = document.getElementById("searchParticipant");
    const filter = input.value.toLowerCase();
    const ul = document.getElementById("fullParticipantsList");
    const li = ul.getElementsByTagName("li");

    for (let i = 0; i < li.length; i++) {
        const txtValue = li[i].textContent || li[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

/* ============================================================
   IMPORTAR ARCHIVOS EXCEL (.xlsx / .xls)
   ============================================================ */
/* ============================================================
   IMPORTAR ARCHIVOS EXCEL INTELIGENTE (Detecta Columnas)
   ============================================================ */
/* ============================================================
   IMPORTAR EXCEL INTELIGENTE + CUIL
   ============================================================ */
function handleExcelUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertimos a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        let added = 0;
        let duplicates = {};

        jsonData.forEach(row => {
            // 1. Normalizar claves
            const keys = Object.keys(row);
            const normalizedRow = {};
            keys.forEach(key => normalizedRow[key.toLowerCase().trim()] = row[key]);

            // 2. Buscar columnas clave
            let nombreCompleto = "";
            let cuil = "";

            // Buscadores de columnas (flexibles)
            const keyNombre = keys.find(k => k.toLowerCase().includes("nombre") && !k.toLowerCase().includes("apellido"));
            const keyApellido = keys.find(k => k.toLowerCase().includes("apellido"));
            const keyFull = keys.find(k => k.toLowerCase().includes("apenom") || (k.toLowerCase().includes("nombre") && k.toLowerCase().includes("apellido")));
            const keyCuil = keys.find(k => k.toLowerCase().includes("cuil") || k.toLowerCase().includes("dni") || k.toLowerCase().includes("legajo") || k.toLowerCase().includes("documento"));

            // 3. Extraer Nombre
            if (keyFull) {
                nombreCompleto = String(row[keyFull]).trim();
            } else if (keyApellido && keyNombre) {
                nombreCompleto = `${String(row[keyNombre]).trim()} ${String(row[keyApellido]).trim()}`;
            }

            // 4. Extraer CUIL (Si existe)
            if (keyCuil && row[keyCuil]) {
                cuil = String(row[keyCuil]).trim();
            }

            // Limpieza
            nombreCompleto = nombreCompleto.replace(/\s+/g, " ").trim();
            if (!nombreCompleto || nombreCompleto.length < 3) return;

            // 5. CREAR IDENTIFICADOR ÚNICO (NOMBRE + CUIL)
            // Esto soluciona el problema de los homónimos
            let entry = nombreCompleto;
            if (cuil) {
                entry = `${nombreCompleto} (${cuil})`;
            }

            // 6. Agregar si no existe
            if (participants.includes(entry)) {
                duplicates[entry] = (duplicates[entry] || 0) + 1;
            } else {
                participants.push(entry);
                added++;
            }
        });

        updateCounter();
        updateOdometerList(); // Actualiza la cinta visual

        if (Object.keys(duplicates).length > 0) {
            showDupesModal(added, duplicates);
        } else {
            alert(`✔ Se importaron ${added} participantes con éxito.`);
        }
        input.value = "";
    };
    reader.readAsArrayBuffer(file);
}

/* === CERRAR MODAL DE DUPLICADOS === */
function closeDupesModal() {
    const modal = document.getElementById("dupesModal");
    if (modal) {
        modal.style.display = "none";
    }
}

/* ============================================================
   3) CONTADOR DE 3 DÍGITOS (PARTICIPANTES)
   ============================================================ */
function updateCounter() {
    const count = participants.length;
    // 4 columnas → hasta 9999
    const str = count.toString().padStart(4, '0');

    // AJUSTE: Asegúrate que coincida con tu CSS (80px u 85px)
    const digitHeight = 80; 

    const setDigit = (id, digitChar) => {
        const strip = document.getElementById(id);
        if (strip) {
            const digit = parseInt(digitChar, 10);
            const offset = -digitHeight * digit;
            strip.style.transform = `translateY(${offset}px)`;
        }
    };

    // Actualizamos los rodillos visuales
    setDigit("strip1", str[0]);
    setDigit("strip2", str[1]);
    setDigit("strip3", str[2]);
    setDigit("strip4", str[3]);

    /* ========================================================
       CÁLCULO DE PROBABILIDAD DE ALTA PRECISIÓN (AUDITORÍA)
       ======================================================== */
    const probElement = document.getElementById("probDisplay");
    
    if (probElement) {
        let probHTML = "";
        
        if (count > 0) {
            // 1. CÁLCULO PORCENTUAL (Con 6 decimales para detectar cambios mínimos)
            // Ejemplo: 1100 part. = 0.090909%
            // Ejemplo: 1101 part. = 0.090826%
            const percentage = (1 / count) * 100;
            const percentageStr = percentage.toFixed(5); // 5 decimales

            // 2. TEXTO COMPLETO
            // Mostramos: "0.09091% (1 en 1100)"
            // Usamos una fuente monoespaciada para los números para que parezca dato técnico
            probHTML = `
                Probabilidad: <span style="color:#FF6600; font-weight:bold;">${percentageStr}%</span> 
                <span style="color:#666; font-size:12px; margin-left:8px;">(1 en ${count})</span>
            `;
        } else {
            probHTML = `Probabilidad: <span style="color:#FF6600;">0%</span>`;
        }

        probElement.innerHTML = probHTML;
    }
}



/* ============================================================
   4) CONTADOR MINI DE GANADORES (2 dígitos)
   ============================================================ */
function updateWinnersCounter() {
    const count = winners.length;
    const str = count.toString().padStart(2, '0');

    const digitHeight = 70; // ✔ igual al CSS

    const setDigit = (id, digitChar) => {
        const strip = document.getElementById(id);
        if (!strip) return;

        const digit = parseInt(digitChar, 10);
        const offset = -(digit * digitHeight);

        strip.style.transform = `translateY(${offset}px)`;
    };

    setDigit("winStrip1", str[0]);
    setDigit("winStrip2", str[1]);
}



/* ============================================================
   5) ODOMETRO VERTICAL DE NOMBRES
   ============================================================ */




/* REEMPLAZA TU FUNCIÓN updateOdometerList POR ESTA */
/* REEMPLAZA TU FUNCIÓN updateOdometerList POR ESTA VERSIÓN OPTIMIZADA */
function updateOdometerList() {
    const reelIds = ["odometerReel1", "odometerReel2", "odometerReel3"];
    const itemHeight = 60; 
    const TARGET_PIXEL_HEIGHT = 20000; 

    reelIds.forEach(id => {
        const reel = document.getElementById(id);
        if (!reel) return;
        reel.innerHTML = "";

        if (participants.length === 0) return;

        // Cálculos de copias (Igual que antes)
        const singleListHeight = participants.length * itemHeight;
        let copiesNeeded = Math.ceil(TARGET_PIXEL_HEIGHT / singleListHeight);
        if (copiesNeeded < 4) copiesNeeded = 4;
        const maxItems = 5000;
        const totalItemsPredicted = copiesNeeded * participants.length;
        if (totalItemsPredicted > maxItems) {
            copiesNeeded = Math.floor(maxItems / participants.length);
            if (copiesNeeded < 3) copiesNeeded = 3; 
        }

        // Generar los clones
        for (let i = 0; i < copiesNeeded; i++) {
            participants.forEach(fullText => {
                const li = document.createElement("li");
                
                // === CAMBIO AQUÍ: FILTRO VISUAL ===
                // Tomamos "Juan Perez (20-...)" y lo partimos en el parentesis
                // Nos quedamos solo con la parte [0] (el nombre)
                const cleanName = fullText.split('(')[0].trim();
                
                li.textContent = cleanName; // Mostramos solo el nombre
                reel.appendChild(li);
            });
        }
        
        reel.style.transform = `translateY(0px)`;
        reel.dataset.copies = copiesNeeded;
    });

    resetOdometersAfterLoad();
}


/* EN TU SCRIPT.JS - Ajusta esta función */
function resetOdometersAfterLoad() {
    const itemHeight = 60;
    odometers.forEach((od, idx) => {
        if (!od.reel) return;

        // Reiniciar variables
        od.current = 0; 
        od.speed = 0.8 + idx * 0.3;
        od.spinning = true;

        // Reset visual inmediato
        od.reel.style.transition = "none";
        od.reel.style.transform = `translateY(0px)`;
    });

    globalSpin = false;
    spinPhase = "idle";
}/* REEMPLAZA O AGREGA ESTA FUNCIÓN AL FINAL DE SCRIPT.JS */

function resetOdometersAfterLoad() {
    odometers.forEach((od, idx) => {
        if (!od.reel) return;
        
        od.current = 0;         // Reseteamos el contador de pixeles
        od.speed = 0.8 + (idx * 0.3); // Velocidad base
        
        // Quitamos cualquier transición vieja para que el reset sea instantáneo
        od.reel.style.transition = "none";
        od.reel.style.transform = "translateY(0px)";
    });
    
    // Aseguramos que el estado global esté listo
    globalSpin = false;
    isResultAnimating = false;
    spinPhase = "idle";
    
    // Si el loop se había detenido, lo reactivamos (opcional, por seguridad)
    // startOdometerLoop(); 
}

/* ============================================================
   7) ANIMACIÓN DEL ODOMETRO AL GANADOR
   ============================================================ */
/* --- REEMPLAZA TU FUNCIÓN SORTEAR ENTERA --- */
/* REEMPLAZA TU FUNCIÓN sortear POR ESTA */
function sortear() {
    if (participants.length < 2) {
        alert("⚠ Necesitas al menos 2 participantes para sortear.");
        return;
    }

    if (isResultAnimating || globalSpin) return; 

    // Bloqueamos el botón
    globalSpin = true;
    
    // Elegimos ganador inmediatamente (pero no lo mostramos aún)
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winnerName = participants[winnerIndex];

    // Detenemos el loop infinito de JS
    isResultAnimating = true; 
    
    // Lanzamos la animación CSS de larga duración
    animateOdometerToIndex(winnerIndex);

    // Calculamos el tiempo máximo (el del 3er rodillo que dura 8s) para mostrar el modal
    setTimeout(() => {
        showWinner(winnerName);
        
        // Dejamos el estado 'animando' un poco más para evitar clicks accidentales
        setTimeout(() => {
            isResultAnimating = false;
            globalSpin = false;
        }, 1000);

    }, 8500); // 8.5 segundos (coincide con el rodillo más lento + un respiro)
}

/* --- REEMPLAZA TU FUNCIÓN ANIMATEODOMETERTOINDEX ENTERA --- */
/* PEGA ESTO EN TU SCRIPT.JS (Reemplaza la función animateOdometerToIndex anterior) */

/* REEMPLAZA TU FUNCIÓN animateOdometerToIndex POR ESTA */
/* REEMPLAZA TU FUNCIÓN animateOdometerToIndex POR ESTA VERSIÓN SEGURA */
function animateOdometerToIndex(index) {
    const reelIds = ["odometerReel1", "odometerReel2", "odometerReel3"];
    const itemHeight = 60; 
    const singleListHeight = participants.length * itemHeight;

    reelIds.forEach((id, reelIndex) => {
        const reel = document.getElementById(id);
        if (!reel) return;

        // Recuperamos copias reales o default
        const totalCopies = parseInt(reel.dataset.copies) || 4;

        // --- LÓGICA DE DIRECCIÓN ---
        let targetCopyIndex;

        if (reelIndex === 1) {
            // === ODOMETRO 2: INVERSO (BAJA) ===
            
            // 1. TRUCO DE MAGIA: 
            // Para que baje, primero tenemos que teletransportarlo al FONDO de la cinta
            // sin que el usuario se de cuenta (quitamos transición).
            reel.style.transition = "none";
            // Lo mandamos a la penúltima copia del fondo
            const jumpToPos = ((totalCopies - 1) * singleListHeight);
            reel.style.transform = `translateY(-${jumpToPos}px)`;
            
            // Forzamos al navegador a aplicar el cambio instantáneo
            reel.offsetHeight; 

            // 2. DEFINIR DESTINO:
            // Queremos aterrizar en una copia DE ARRIBA (Copia 1).
            // Al ir de -20000px a -1000px, el valor Y aumenta, 
            // por lo que visualmente la cinta BAJA.
            targetCopyIndex = 1; 

        } else {
            // === ODOMETROS 1 y 3: NORMAL (SUBEN) ===
            // Aterrizamos en una copia DEL FONDO.
            targetCopyIndex = totalCopies - 2; 
        }

        // --- CÁLCULO FINAL ---
        const totalDistance = (targetCopyIndex * singleListHeight) + (index * itemHeight);
        const finalPos = 60 - totalDistance; 

        // --- TIEMPOS ---
        const duration = 6 + reelIndex; // 6s, 7s, 8s

        // Activamos la animación suave
        // Usamos una curva especial 'cubic-bezier' para que frene con elegancia
        reel.style.transition = `transform ${duration}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
        
        // Ejecutamos el movimiento
        reel.style.transform = `translateY(${finalPos}px)`;

        // --- RESALTADO FINAL ---
        setTimeout(() => {
            const allItems = reel.querySelectorAll("li");
            allItems.forEach(li => li.classList.remove("winner-odometer", "winner-zoom"));

            const winnerName = participants[index];
            allItems.forEach(li => {
                if (li.textContent === winnerName) {
                    li.classList.add("winner-odometer", "winner-zoom");
                }
            });
        }, duration * 1000);
    });
}



/* ============================================================
   8) MOSTRAR MODAL DE GANADOR + CONFETTI
   ============================================================ */
/* ============================================================
   8) MOSTRAR MODAL DE GANADOR + CONFETTI CORPORATIVO
   ============================================================ */
function showWinner(fullText) {

    if (typeof confetti === "function") {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.7 },
            colors: ['#FF6600', '#D4AF37', '#FFFFFF'], 
            zIndex: 9999
        });
    }

    const modal = document.getElementById("winnerModal");
    
    // === CAMBIO AQUÍ: LIMPIAR NOMBRE PARA EL CARTEL ===
    // Guardamos el dato completo (con CUIL) en la variable global para el PDF
    window.currentWinner = fullText; 
    
    // Pero en el cartel mostramos solo el nombre
    const displayName = fullText.split('(')[0].trim();
    document.getElementById("winnerName").innerText = displayName;

    modal.style.display = "flex";
}


/* ============================================================
   9) CONFIRMAR GANADOR / CERRAR MODAL
   ============================================================ */
function confirmWinner() {
    const name = window.currentWinner;
    if (!name) return;

    // 1) Eliminar al ganador del array de participantes
    const idx = participants.indexOf(name);
    if (idx !== -1) {
        participants.splice(idx, 1);   // lo sacamos del array
        updateCounter();               // actualiza odómetro de participantes
        updateOdometerList();          // vuelve a rellenar los 3 odómetros de nombres
    }

    // 2) Agregar a la lista de ganadores
    winners.push(name);

    addWinnerCard(name);
    updateWinnersCounter();
    autoResizeWinners();

    // 3) Cerrar modal
    document.getElementById("winnerModal").style.display = "none";
}


function closeWinnerModal() {
    document.getElementById("winnerModal").style.display = "none";
}

function addWinnerCard(fullText) {
    const list = document.getElementById("winnersList");

    const empty = list.querySelector(".empty-state");
    if (empty) empty.remove();

    const div = document.createElement("div");
    div.classList.add("winner-card");
    
    // === CAMBIO AQUÍ: LIMPIAR NOMBRE PARA LA LISTA LATERAL ===
    const displayName = fullText.split('(')[0].trim();

    div.innerHTML = `<span class="trophy-icon">🏆</span> <span class="w-name">${displayName}</span>`;

    list.appendChild(div);
}


/* ============================================================
   10) AJUSTE AUTOMÁTICO DE LISTA DE GANADORES
   ============================================================ */
function autoResizeWinners() {
    const list = document.getElementById("winnersList");
    list.classList.toggle("compact-mode", winners.length >= 5);
}


/* ============================================================
   11) MODAL DE DUPLICADOS
   ============================================================ */
function showDupesModal(added, map) {
    const modal = document.getElementById("dupeModal");
    const list = document.getElementById("dupeList");

    list.innerHTML = "";

    Object.keys(map).forEach(name => {
        const li = document.createElement("li");
        li.textContent = `${name} — repetido ${map[name]} veces`;
        list.appendChild(li);
    });

    modal.style.display = "flex";
}

function closeDupeModal() {
    document.getElementById("dupeModal").style.display = "none";
}

/* ============================================================
   NUEVA FUNCIÓN: GESTIÓN DE GRUPOS / RONDAS
   ============================================================ */
function archiveCurrentBatch() {
    // 1. Validar que haya ganadores en pantalla
    if (winners.length === 0) {
        alert("⚠ No hay ganadores en la lista actual para guardar.");
        return;
    }

    // 2. Pedir nombre del grupo (Ej: "Televisores", "Motos")
    const groupName = prompt("Ingresa un nombre para este grupo (ej: 'Televisores'):", `Grupo ${raffleHistory.length + 1}`);
    
    if (!groupName) return; // Si cancela, no hacemos nada

    // 3. Guardar en el Historial (Hacemos una copia [...winners] para no perder datos)
    raffleHistory.push({
        title: groupName,
        list: [...winners]
    });

    // 4. Limpiar la lista VISUAL (Winners) pero MANTENER los Participantes
    winners = []; 
    
    // 5. Resetear contadores visuales de ganadores
    updateWinnersCounter();
    
    // 6. Limpiar el HTML de la lista lateral
    const list = document.getElementById("winnersList");
    list.innerHTML = '<div class="empty-state" style="color: var(--corven-gold)">✔ Grupo guardado. Listo para el siguiente.</div>';
    list.classList.remove("compact-mode");

    // Pequeño feedback
    // (Opcional) Si quieres un alert visual
    // alert(`✔ Se guardó el grupo "${groupName}". Ahora puedes sortear el siguiente premio.`);
}


/* ============================================================
   MODIFICACIÓN: EXPORTAR PDF CON GRUPOS
   (Reemplaza tu función exportPDF actual por esta)
   ============================================================ */
function exportPDF() {
    if (typeof window.jspdf === "undefined") {
        alert("Error: jsPDF no cargado.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;
    let y = 20; // Cursor vertical

    // --- Función para escribir el encabezado ---
    const printHeader = () => {
        doc.setFontSize(22);
        doc.setTextColor(255, 102, 0); // Naranja
        doc.text("Reporte de Sorteos Corven", 10, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 10, 28);
        y = 40; 
    };

    // Imprimimos cabecera inicial
    printHeader();

    // --- 1. PREPARAMOS LOS DATOS ---
    // Unimos el historial guardado + lo que haya en pantalla actualmente (si te olvidaste de guardar el último)
    let allGroupsToPrint = [...raffleHistory];

    if (winners.length > 0) {
        allGroupsToPrint.push({
            title: "Otros Ganadores (Sin agrupar)",
            list: [...winners]
        });
    }

    if (allGroupsToPrint.length === 0) {
        alert("No hay ganadores para exportar.");
        return;
    }

    // --- 2. BUCLE POR GRUPOS ---
    allGroupsToPrint.forEach((group) => {
        
        // Verificar si cabe el TÍTULO del grupo (dejamos 30mm de espacio)
        if (y > pageHeight - 30) { 
            doc.addPage(); 
            printHeader(); 
        }

        // Escribir Título del Grupo
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); 
        doc.setFont(undefined, 'bold'); 
        doc.text(`📂 ${group.title} (${group.list.length})`, 10, y);
        y += 10; 

        // Configurar fuente para la lista de nombres
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        // Bucle por NOMBRES dentro del grupo
        group.list.forEach((name, i) => {
            // Verificar fin de página para los nombres
            if (y > pageHeight - marginBottom) {
                doc.addPage();
                y = 20; // Reseteamos arriba
                // Opcional: repetir título del grupo si corta justo
            }

            doc.text(`   ${i + 1}. ${name}`, 10, y); 
            y += 7; // Renglón
        });

        y += 10; // Espacio extra entre grupos
    });

    doc.save("Reporte_Grupal_Corven.pdf");
}

/* ============================================================
   MODIFICACIÓN: LIMPIAR TODO (Incluyendo Historial)
   (Reemplaza tu función clearList actual por esta)
   ============================================================ */
function clearList() {
    if (confirm("⚠ ATENCIÓN: Esto borrará los participantes, los ganadores Y EL HISTORIAL DE GRUPOS.\n\n¿Deseas reiniciar el sistema a cero?")) {
        
        // 1. Limpieza total
        participants = [];
        winners = [];
        raffleHistory = []; // <--- IMPORTANTE: Borramos el historial

        // 2. Visuales
        updateCounter();
        updateWinnersCounter();
        updateOdometerList(); 

        const list = document.getElementById("winnersList");
        if (list) {
            list.classList.remove("compact-mode");
            list.innerHTML = '<div class="empty-state">Esperando ganador...</div>';
        }
        
        alert("✔ Sistema reiniciado completamente.");
    }
}


/* ============================================================
   NUEVA LÓGICA DE SELECCIÓN DE SORTEO
   ============================================================ */
function checkSorteoType() {
    const qtyInput = document.getElementById("winnerQty");
    const qty = parseInt(qtyInput.value) || 1;

    // Validación básica
    if (participants.length < qty) {
        alert(`⚠ No hay suficientes participantes. Tienes ${participants.length} y quieres sacar ${qty}.`);
        return;
    }

    if (qty === 1) {
        // Si es 1, usamos tu animación ORIGINAL de Odómetro
        sortear();
    } else {
        // Si son varios, usamos el nuevo sorteo MÚLTIPLE
        sortearMultiples(qty);
    }
}

function sortearMultiples(quantity) {
    // === YA NO HAY CONFIRMACIÓN, EJECUTA DIRECTO ===

    const currentBatchWinners = [];

    // Lanzar confetti (opcional)
    if (typeof confetti === "function") {
        confetti({ particleCount: 200, spread: 150, zIndex: 9999 });
    }

    // Seleccionar ganadores
    for (let i = 0; i < quantity; i++) {
        // Elegir índice al azar
        const randomIndex = Math.floor(Math.random() * participants.length);
        const winnerName = participants[randomIndex];

        // 1. Lo sacamos de participantes
        participants.splice(randomIndex, 1);

        // 2. Lo agregamos a ganadores globales y al lote actual
        winners.push(winnerName);
        currentBatchWinners.push(winnerName);

        // 3. Agregamos a la lista lateral derecha (visual)
        addWinnerCard(winnerName);
    }

    // Actualizar contadores visuales
    updateCounter();          // Odómetro de participantes (resta los que salieron)
    updateWinnersCounter();   // Contador de ganadores (suma los nuevos)
    updateOdometerList();     // Refresca la cinta de nombres para el próximo tiro

    // Ajustar tamaño de tarjetas si son muchas (Importante para que no se rompa el diseño)
    autoResizeWinners();

    // Mostrar el Modal con la lista
    showMultiWinnerModal(currentBatchWinners);
}

function showMultiWinnerModal(winnersList) {
    const modal = document.getElementById("multiWinnerModal");
    const listContainer = document.getElementById("multiWinnersList");
    
    listContainer.innerHTML = ""; // Limpiar lista anterior

    winnersList.forEach((name, index) => {
        const li = document.createElement("li");
        li.className = "multi-winner-item";
        
        // Limpiamos el nombre para quitar el CUIL si lo tiene, para que se vea más lindo
        const cleanName = name.split('(')[0].trim();

        li.innerHTML = `<span class="multi-winner-number">#${index + 1}</span> ${cleanName}`;
        listContainer.appendChild(li);
    });

    modal.style.display = "flex";
}

function closeMultiWinnerModal() {
    document.getElementById("multiWinnerModal").style.display = "none";
}