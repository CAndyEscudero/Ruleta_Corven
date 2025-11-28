// === CONFIGURACIÓN GLOBAL ===
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

// Colores Premium
// Colores Estilo "Starburst" (Imagen 2)
const colors = {
    bg: '#222222',      // Gris oscuro (para las líneas alternas)
    orange: '#FF7700',  // Naranja Vibrante (más brillante)
    white: '#FFFFFF',
    gold: '#D4AF37',    // Para el borde si es necesario
    black: '#000000'
};

// Variables de Estado
let participants = []; 
let winners = [];
let isSpinning = false;
let currentRotation = 0;
let idleRotation = 0;
let idleInterval = null;

// === AL CARGAR LA PÁGINA ===
window.onload = () => {
    updateCounter();
    updateWinnersCounter();
    drawWheel();
};

// === 1. AGREGAR PARTICIPANTE MANUAL ===
function addParticipant() {
    const input = document.getElementById('inputName');
    const name = input.value.trim();
    
    if (name) {
        if (participants.includes(name)) {
            alert(`⚠️ El participante "${name}" ya está en la lista.`);
            return;
        }
        participants.push(name);
        input.value = '';
        drawWheel();
        updateCounter();
    }
}

// === 2. IMPORTAR ARCHIVO (Lógica Robusta) ===
function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/);
        
        let countAdded = 0;
        let duplicatesMap = {};

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine) {
                const processName = (n) => {
                    const finalName = n.trim();
                    if (finalName) {
                        if (!participants.includes(finalName)) {
                            participants.push(finalName);
                            countAdded++;
                        } else {
                            duplicatesMap[finalName] = (duplicatesMap[finalName] || 0) + 1;
                        }
                    }
                };

                if (cleanLine.includes(',')) {
                    cleanLine.split(',').forEach(processName);
                } else if (cleanLine.includes(';')) {
                    cleanLine.split(';').forEach(processName);
                } else {
                    processName(cleanLine);
                }
            }
        });

        if (countAdded > 0) {
            drawWheel();
            updateCounter();
        }

        if (Object.keys(duplicatesMap).length > 0) {
            showDupesModal(countAdded, duplicatesMap);
        }else if (countAdded > 0) {
            alert(`✅ Éxito: Se agregaron ${countAdded} participantes nuevos.`);
        } else {
            alert("⚠️ No se agregaron participantes.");
        }
        
        input.value = ''; 
    };
    reader.readAsText(file);
}

// === 3. ACTUALIZAR CONTADORES (ANIMACIÓN RODILLOS) ===

// Contador Principal (4 Dígitos)
function updateCounter() {
    const count = participants.length;
    const str = count.toString().padStart(4, '0');
    
    // Altura de cada número (Sincronizado con CSS .digit-box height: 80px)
    const digitHeight = 80; 

    const rotateStrip = (stripId, digit) => {
        const strip = document.getElementById(stripId);
        if(strip) {
            const targetIndex = parseInt(digit);
            const offset = -(targetIndex * digitHeight);
            strip.style.transform = `translateY(${offset}px)`;
        }
    };

    rotateStrip('strip1', str[0]);
    rotateStrip('strip2', str[1]);
    rotateStrip('strip3', str[2]);
    rotateStrip('strip4', str[3]);
}

// Contador Ganadores (2 Dígitos - Mini)
function updateWinnersCounter() {
    const count = winners.length;
    const str = count.toString().padStart(2, '0');
    
    // Altura Mini (Sincronizado con CSS .mini-odometer height: 45px o 50px)
    // En el último CSS que pasé, la altura de .mini-odometer span es 45px
    const miniDigitHeight = 45; 

    const rotateMiniStrip = (stripId, digit) => {
        const strip = document.getElementById(stripId);
        if(strip) {
            const targetIndex = parseInt(digit);
            const offset = -(targetIndex * miniDigitHeight);
            strip.style.transform = `translateY(${offset}px)`;
        }
    };

    rotateMiniStrip('winStrip1', str[0]);
    rotateMiniStrip('winStrip2', str[1]);
}

// === 4. DIBUJAR RULETA (VERSIÓN HD) ===
// === 4. DIBUJAR RULETA (ESTILO RAYOS) ===
function drawWheel() {
    const num = participants.length;
    if (num === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Ajustamos el radio para que entre justo bajo el borde negro nuevo
    const radius = (canvas.width / 2) - 1; 
    
    const anglePerSlice = (2 * Math.PI) / num;
    
    // Solo mostramos texto si hay menos de 100 personas para mantener el look limpio
    const showText = num <= 100; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    participants.forEach((name, i) => {
        const startAngle = i * anglePerSlice;
        const endAngle = (i + 1) * anglePerSlice;

        // ESTILO DE COLORES: Naranja vs Gris Oscuro
        let sliceColor = (i % 2 === 0) ? colors.bg : colors.orange;
        
        // Si hay texto, usamos blanco en el fondo oscuro y negro en el naranja
        let textColor = (i % 2 === 0) ? colors.white : colors.black;

        // Corrección para impares (para que no queden dos oscuros juntos)
        if (num % 2 !== 0 && i === num - 1) {
            sliceColor = colors.gold; // Dorado sutil al final
            textColor = colors.black;
        }

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = sliceColor;
        ctx.fill();
        
        // IMPORTANTE: Sin stroke (bordes) para lograr el efecto de "rayos" limpios
        ctx.lineWidth = 0; 
        ctx.strokeStyle = "transparent";
        ctx.stroke();

        if (showText) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSlice / 2);
            ctx.textAlign = "left";
            ctx.fillStyle = textColor;
            
            // Texto adaptativo
            ctx.font = "bold 20px Montserrat, Arial"; 
            
            // Offset mayor porque el centro es más grande
            const OFFSET = 90; 
            ctx.fillText(name.length > 20 ? name.substring(0,18)+"..." : name, OFFSET, 6);
            
            ctx.restore();
        }
    });
}

// === 5. GIRO Y GANADOR ===
function spinWheel() {
    if (isSpinning || participants.length < 2) {
        if (participants.length < 2) alert("¡Necesitas al menos 2 participantes!");
        return;
    }

    isSpinning = true;

    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.style.opacity = 0.7;
        spinBtn.style.cursor = 'not-allowed';
    }

    // Detener rotación lenta
    const wheel = document.getElementById('wheelCanvas');
    wheel.style.transition = "";
    wheel.style.transform = `rotate(${idleRotation}deg)`;

    // ================================
    //   ETAPA 1: Giro rápido (6.5s)
    // ================================
    const fastSpins = 360 * 10;  // muchas vueltas
    const fastRotation = currentRotation + fastSpins;

    wheel.style.transition = "transform 6.5s cubic-bezier(0.05, 0.7, 0.1, 1)";
    wheel.style.transform = `rotate(-${fastRotation}deg)`;

    // ================================
    //   ETAPA 2: Frenado suave (3.5s)
    // ================================
    setTimeout(() => {
        const randomStop = Math.floor(Math.random() * 360);
        const finalRotation = fastRotation + randomStop;

        // Activar zoom final
        wheel.classList.add("zoom-wheel-final");

        wheel.style.transition = "transform 3.5s cubic-bezier(0.3, 0, 0.15, 1)";
        wheel.style.transform = `rotate(-${finalRotation}deg)`;

        // === ACTIVAR VISOR FINAL ===
        const viewer = document.getElementById("finalViewer");
        const vPrev = document.getElementById("viewer-prev");
        const vCurrent = document.getElementById("viewer-current");
        const vNext = document.getElementById("viewer-next");

        // mostrar caja
        viewer.style.opacity = 1;

        // función: obtener ángulo REAL de la ruleta
        function getWheelAngle() {
            const tr = getComputedStyle(wheel).transform;
            if (tr === "none") return 0;

            const values = tr.split('(')[1].split(')')[0].split(',');
            const a = parseFloat(values[0]);
            const b = parseFloat(values[1]);

            let angle = Math.atan2(b, a) * (180 / Math.PI);
            return angle < 0 ? angle + 360 : angle;
        }

        // actualizar nombres durante los 3.5s de frenado
        let tracking = setInterval(() => {

            const angle = getWheelAngle();
            const sliceDeg = 360 / participants.length;

            let index = Math.floor(((360 - angle + 270) % 360) / sliceDeg);
            index = (index + participants.length) % participants.length;

            const prev = participants[(index - 1 + participants.length) % participants.length];
            const curr = participants[index];
            const next = participants[(index + 1) % participants.length];

            vPrev.textContent = prev || "";
            vCurrent.textContent = curr || "";
            vNext.textContent = next || "";

            // efecto de zoom pulsante sobre el participante actual
            vCurrent.classList.add("viewer-zoom");
            setTimeout(() => vCurrent.classList.remove("viewer-zoom"), 200);

        }, 90);

        // ocultar visor al terminar el frenado
        setTimeout(() => {
            clearInterval(tracking);
            viewer.style.opacity = 0;
        }, 3500);


        // Final total después de 10s
        setTimeout(() => {
            wheel.classList.remove("zoom-wheel-final");

            isSpinning = false;
            currentRotation = finalRotation;

            if (spinBtn) {
                spinBtn.disabled = false;
                spinBtn.style.opacity = 1;
                spinBtn.style.cursor = 'pointer';
            }

           // === CALCULAR GANADOR (200ms después de apagar visor) ===
        setTimeout(() => {
        const actualRotation = finalRotation % 360;
        const sliceDeg = 360 / participants.length;

        let index = Math.floor(((360 - actualRotation + 270) % 360) / sliceDeg);
        index = index % participants.length;

        showWinner(participants[index]);
    }, 1000);


        }, 200); // <-- duración del frenado

    }, 7500); // <-- duración del giro rápido (7.5s)
}

function startIdleRotation() {
    const wheel = document.getElementById('wheelCanvas');

    // Si ya está girando en idle, no volver a iniciar
    if (idleInterval) return;

    idleInterval = setInterval(() => {
        if (!isSpinning) {  
            idleRotation = (idleRotation + 0.15) % 360; // velocidad lenta (ajustar si querés)
            wheel.style.transform = `rotate(${idleRotation}deg)`;
        }
    }, 20); // suavidad del giro
}


// === 6. MODAL Y FESTEJO ===
function showWinner(name) {
    // Confeti
    if(typeof confetti === 'function') {
        // Explosión central
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [colors.orange, colors.gold, colors.white] });
        // Lluvia lateral (opcional)
        setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } }), 500);
        setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } }), 500);
    }

    const modal = document.getElementById('winnerModal');
    if(modal) {
        document.getElementById('modalWinnerName').innerText = name;
        modal.style.display = 'flex'; // Usamos flex para centrar
    }
    window.currentWinner = name;
}

function closeModal(shouldRemove) {
    document.getElementById('winnerModal').style.display = 'none';

    // Agregar a la lista visual
    const list = document.getElementById('winnersList');
    if(list) {
        const emptyState = list.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const div = document.createElement('div');
        div.className = 'winner-card';
        div.innerHTML = `<span class="trophy-icon">🏆</span> <span class="w-name">${window.currentWinner}</span>`;
        // Animación CSS se encarga de la entrada suave
        list.prepend(div);
    }

    winners.push(window.currentWinner);

    // Ajustar tamaños
    if (typeof autoResizeWinners === 'function') autoResizeWinners();
    updateWinnersCounter();

    if (shouldRemove) {
        const idx = participants.indexOf(window.currentWinner);
        if (idx > -1) {
            participants.splice(idx, 1);
            drawWheel();
            updateCounter();
        }
    }
}

// === UTILIDADES ===

// Ajuste automático de lista de ganadores
function autoResizeWinners() {
    const list = document.getElementById('winnersList');
    const count = winners.length;
    if (count >= 5) {
        list.classList.add('compact-mode');
    } else {
        list.classList.remove('compact-mode');
    }
}

// Modal Duplicados
function showDupesModal(addedCount, dupesMap) {
    const modal = document.getElementById('dupesModal');
    const summary = document.getElementById('dupesSummary');
    const list = document.getElementById('dupesList');

    // Resumen elegante
    summary.innerHTML = `
        <span class="text-green-400">✔ Se agregaron ${addedCount} participantes nuevos.</span><br>
        <span class="text-red-400">✖ Se encontraron ${Object.keys(dupesMap).length} nombres repetidos.</span>
    `;

    // Limpiar lista
    list.innerHTML = '';

    // Crear UI de repetidos agrupados
    Object.entries(dupesMap).forEach(([name, count]) => {
        const li = document.createElement('li');

        li.innerHTML = `
            <span class="font-bold text-yellow-300">${name}</span>
            <span class="text-gray-400"> — ${count} ${count > 1 ? 'veces' : 'vez'}</span>
        `;

        list.appendChild(li);
    });

    modal.style.display = 'flex';
}


function closeDupesModal() {
    document.getElementById('dupesModal').style.display = 'none';
}

// Exportar PDF
function exportPDF() {
    if(typeof window.jspdf === 'undefined') {
        alert("Librería PDF no cargada.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(255, 102, 0); // Naranja
    doc.text("Ganadores Sorteo Grupo Corven", 10, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    let y = 40;
    winners.forEach((w, i) => {
        doc.text(`${i + 1}. ${w}`, 10, y);
        y += 10;
    });
    doc.save("ganadores_corven.pdf");
}

window.addEventListener('DOMContentLoaded', startIdleRotation);