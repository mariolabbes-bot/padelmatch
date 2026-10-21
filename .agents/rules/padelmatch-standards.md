# PadelMatch: Estándares de Producto, UX Deportiva y Reglas de Código

## 1. Ergonomía en Cancha y Jerarquía del Marcador (Scoreboard)
- **Jerarquía Estricta:**
  - **Puntos (Primario / Héroe):** Debe ocupar el >70% del área de cada equipo con dígitos colosales (`font-size: clamp(6.5rem, 22vw, 13rem)` en horizontal y `clamp(4.6rem, 16vw, 7.8rem)` en vertical). Legibilidad obligatoria desde 10-15 metros a través del vidrio.
  - **Juegos (Secundario):** Indicador refinado y compacto (`1.75rem - 2.1rem`) en una caja deportiva oscura.
  - **Sets (Terciario):** Cinta o pastilla compacta (`0.65rem - 0.85rem`) para seguimiento del partido sin robar protagonismo.
- **Modo Horizontal (Landscape) y Pantalla Completa:**
  - Soporte nativo para rotación apaisada y botón de pantalla completa con solicitud de bloqueo horizontal (`screen.orientation.lock('landscape')`).
- **Control Táctil In-Game:**
  - La tarjeta completa del equipo debe funcionar como zona táctil de puntuación con micro-animación `scorePop` y vibración física háptica (`navigator.vibrate(35)`).

## 2. Estética Atlética de Alta Gama (Apple / Adidas Tier)
- **Alto Contraste y Dualidad Día/Noche:**
  - `[data-theme='day']`: Fondo blanco/titanio puro con dígitos en alto contraste anti-reflejo para partidos a mediodía bajo sol directo.
  - `[data-theme='night']`: Fondo carbón profundo (`#070a10`) con resplandor neón verde pádel (`#00E676`) y azul zafiro (`#00B0FF`).
- **Componentes:**
  - Controles segmentados estilo iOS (`[ Iniciar Sesión | Crear Perfil ]`).
  - Tarjetas con clase `.apple-card` y micro-bordes luminosos translúcidos.

## 3. Modelo de Monetización y Comunidad
- **Invitados por QR:** Entrada 100% libre sin barreras de pago ni formularios obligatorios.
- **Anfitrión (Host):** 3 partidos de cortesía gratuitos. Pasado el límite, selector de planes (`season_6m`, `annual_12m`, `monthly`, `pro_founder`).
- **Reclamación de Historial (Guest History):** Toda cuenta registrada debe ejecutar `claimGuestHistory` para asociar retroactivamente estadísticas y victorias previas de partidos jugados como invitado.

## 4. Guardarraíles de Git y Despliegue
- **Archivos Grandes:** NUNCA añadir al staging de Git archivos de diseño o imágenes superiores a 50 MB (incluirlos siempre en `.gitignore`).
- **Verificación de Calidad Pre-Deploy:** Antes de cualquier push o despliegue a Firebase Hosting, ejecutar:
  1. `npx tsx src/engine/testFlow.ts`
  2. `npx tsx src/engine/testMonetization.ts`
  3. `npm run build` (debe compilar con 0 errores TypeScript).
