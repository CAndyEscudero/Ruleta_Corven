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
let participants = ["Participante 1", "Participante 2", "Participante 3", "Participante 4"]; 
let winners = [];
let isSpinning = false;
let currentRotation = 0;

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
        let duplicatesList = []; 

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
                            duplicatesList.push(finalName);
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

        if (duplicatesList.length > 0) {
            showDupesModal(countAdded, duplicatesList);
        } else if (countAdded > 0) {
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
        if(participants.length < 2) alert("¡Necesitas al menos 2 participantes!");
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    if(spinBtn) {
        spinBtn.disabled = true;
        spinBtn.style.opacity = 0.7; // Opacidad visual
        spinBtn.style.cursor = 'not-allowed';
    }

    // Cálculo de vueltas
    const extraSpins = 360 * 8; // 8 vueltas rápidas
    const randomStop = Math.floor(Math.random() * 360); 
    const totalDegrees = extraSpins + randomStop; 
    const newRotation = currentRotation + totalDegrees;

    // Giramos el CANVAS
    canvas.style.transition = "transform 8s cubic-bezier(0.15, 0, 0.15, 1)"; // Curva de aceleración realista
    canvas.style.transform = `rotate(-${newRotation}deg)`;

    // Tiempo de espera (8 segundos)
    setTimeout(() => {
        isSpinning = false;
        currentRotation = newRotation;
        if(spinBtn) {
            spinBtn.disabled = false;
            spinBtn.style.opacity = 1;
            spinBtn.style.cursor = 'pointer';
        }
        
        // Cálculo matemático del ganador (considerando la flecha arriba)
        const actualRotation = newRotation % 360;
        const sliceDeg = 360 / participants.length;
        // La flecha está en 270 grados (arriba)
        let index = Math.floor(((360 - actualRotation + 270) % 360) / sliceDeg);
        index = index % participants.length;

        showWinner(participants[index]);

    }, 8000); // 8000ms = 8s
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
function showDupesModal(addedCount, dupesArray) {
    const modal = document.getElementById('dupesModal');
    const summary = document.getElementById('dupesSummary');
    const list = document.getElementById('dupesList');

    summary.innerHTML = `✅ Se agregaron <b>${addedCount}</b> nuevos.<br>⛔ Se detectaron <b>${dupesArray.length}</b> repetidos.`;
    list.innerHTML = ''; 
    dupesArray.forEach(name => {
        const li = document.createElement('li');
        li.innerText = `• ${name}`;
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