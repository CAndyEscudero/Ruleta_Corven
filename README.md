# 🎯 Sorteador Corporativo | Grupo Corven

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Guía de Uso e Interfaz](#-guía-de-uso-e-interfaz)
3. [Auditoría y Transparencia Algorítmica](#-auditoría-y-transparencia-algorítmica)
4. [Lógica de Probabilidades](#-lógica-de-probabilidades)
5. [Experiencia Visual y Animaciones](#-experiencia-visual-y-animaciones)
6. [Tecnologías Utilizadas](#-tecnologías-utilizadas)

---

## 🚀 Descripción General

El sistema permite la **carga masiva de participantes** (soporte probado para +2000 registros) mediante archivos Excel, CSV o TXT. Cuenta con un motor de **importación inteligente** que detecta columnas, sanea datos y elimina duplicados u homónimos mediante la validación de CUIL/DNI.

El sorteo se visualiza mediante un sistema de **"Triple Odómetro"** (*Slot Machine*) que genera tensión y entretenimiento, culminando en la selección de un ganador aleatorio y la generación automática de actas notariales en PDF.

---

## 🖱️ Guía de Uso e Interfaz

A continuación se detalla la funcionalidad de cada control disponible en la interfaz de usuario:

### 1. Panel de Control (Header)
* **Input Manual:** Campo de texto para ingresar participantes singulares.
* `AGREGAR`: Inserta el nombre manual en la lista y recalcula la probabilidad en tiempo real.
* `LIMPIAR`: Realiza un **Hard Reset** del sistema. Elimina participantes, borra el historial de ganadores, reinicia contadores a cero y limpia el almacenamiento en memoria.
* `IMPORTAR TXT/CSV`: Abre el selector de archivos para listas planas.
* `IMPORTAR EXCEL`: **Importación inteligente**. El algoritmo escanea el archivo buscando columnas clave como "Apellido", "Nombre", "CUIL" o "Legajo" sin importar el orden, y fusiona los datos para crear un registro único inequívoco (Ej: *Juan Perez (20-334455-9)*).
* `📋 VER LISTA`: Abre un **Modal de Auditoría** con buscador en tiempo real, permitiendo verificar la existencia de cualquier participante cargado antes del sorteo.

### 2. Panel Central (El Juego)
* **Contador de Participantes:** Panel digital estilo neón que muestra el total de registros habilitados.
* **Indicador de Probabilidad:** Muestra en tiempo real la chance matemática que tiene cada participante de ganar (Ej: *0.09091% - 1 en 1100*).
* **Odómetros (Slot Machine):** Tres columnas giratorias con física simulada.
    * *Izquierda y Derecha:* Giran hacia arriba.
    * *Centro:* Gira hacia abajo (**Efecto Inverso**) para mayor dinamismo visual.
* `🎯 SORTEAR`: Gatilla el algoritmo de selección aleatoria, inicia la animación de frenado progresivo (8 segundos) y lanza los efectos de celebración (Confeti y Modal).

### 3. Panel Lateral (Ganadores)
* **Contador de Ganadores:** Visualizador digital de premios entregados.
* **Lista Histórica:** Tarjetas visuales con los nombres de los ganadores previos.
* `🖨️ EXPORTAR PDF`: Genera un documento oficial con la lista numerada de ganadores, incluyendo sus datos completos (**Nombre + CUIL**) para el acta notarial.

---

## 🔍 Auditoría y Transparencia Algorítmica

Para garantizar la imparcialidad del sorteo, el sistema utiliza el objeto `Math` nativo de JavaScript, implementando un generador de números pseudoaleatorios de alta entropía.

### Código de Selección del Ganador
La selección se realiza matemáticamente **antes** de que termine la animación visual. Lo que se ve en pantalla es una representación dramática de un resultado ya calculado.

```javascript
function sortear() {
    // 1. Validación de seguridad
    if (participants.length < 2) {
        alert("⚠ Necesitas al menos 2 participantes.");
        return;
    }

    // 2. Bloqueo de concurrencia (evita doble click)
    if (isResultAnimating || globalSpin) return;
    globalSpin = true;
    
    // 3. ALGORITMO DE SELECCIÓN (CORE)
    // Se elige un índice aleatorio entre 0 y el total de participantes
    // Math.random() genera un decimal entre 0 (inclusive) y 1 (exclusivo)
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winnerName = participants[winnerIndex];

    // 4. Iniciar secuencia de animación visual hacia el índice elegido
    animateOdometerToIndex(winnerIndex);
}
```

📊 Lógica de Probabilidades, (Desactivado Visualmente)

La probabilidad matemática de ganar es:

P = (1 / N) × 100

Ejemplos:

1000 participantes → 0.10000%

1100 participantes → 0.09091% (1 en 1100)

El sistema trabaja con hasta 5 decimales para reflejar cambios incluso mínimos. 

⚙️ Arquitectura Técnica y Rendimiento

El sistema está optimizado para mantener 60 FPS y alto rendimiento incluso en PCs corporativas.

🏎️ Técnicas Implementadas

Virtual Scrolling (Odómetro Infinito)
Solo renderiza un subconjunto de elementos, evitando lag en listas enormes.

Curvas Bezier personalizadas
cubic-bezier(0.1, 0.9, 0.2, 1) para fricción mecánica realista.

Gradient Masking con CSS
Simula profundidad 3D sin usar WebGL.

Escalado Inteligente para TV 4K

transform: scale(2.5);


Se activa dinámicamente según resolución detectada.

🛠️ Instalación y Tecnologías

Este proyecto no requiere backend y funciona totalmente como aplicación estática.

🔹 Tecnologías Principales

HTML5

CSS3 (Grid / Flexbox / Animaciones avanzadas)

JavaScript ES6+

🔹 Librerías Externas (CDN)

SheetJS (xlsx) → Parseo de Excel.

Canvas-Confetti → Efectos visuales.

jsPDF → Generación de documentos PDF.

🔹 Ejecutar Localmente

Clonar o descargar el repositorio.

Abrir index.html en el navegador.

(Opcional) Usar:

Live Server

o un servidor simple:

python -m http.server

🏁 Desarrollado para Grupo Corven – 2025

Aplicación optimizada, auditable y lista para producción corporativa.
