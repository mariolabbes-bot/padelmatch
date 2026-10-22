# PadelMatch: Estándares de Producto, UX Deportiva, Base de Datos y Código

## 1. Ergonomía en Cancha y Jerarquía del Marcador (Scoreboard)
- **Puntos (Primario / Héroe):** Debe ocupar el >70% del área de cada equipo con dígitos colosales (`font-size: clamp(6.5rem, 22vw, 13rem)` en horizontal y `clamp(4.6rem, 16vw, 7.8rem)` en vertical). Legibilidad obligatoria desde 10-15 metros a través del vidrio.
- **Juegos (Secundario):** Indicador refinado y compacto (`1.75rem - 2.1rem`) en caja deportiva contrastada.
- **Sets (Terciario):** Cinta o pastilla compacta (`0.65rem - 0.85rem`) para seguimiento del partido sin robar foco visual.
- **Modo Horizontal (Landscape) y Pantalla Completa:** Soporte de rotación con botón de pantalla completa y solicitud de bloqueo horizontal (`screen.orientation.lock('landscape')`).
- **Control Táctil In-Game:** La tarjeta completa del equipo funciona como zona táctil de puntuación con animación `scorePop` y vibración háptica (`navigator.vibrate(35)`).

## 2. Estética Atlética de Alta Gama y Temas
- **Alto Contraste y Dualidad Día/Noche:**
  - `[data-theme='day']`: Fondo titanio/blanco puro con dígitos en alto contraste anti-reflejo para sol directo.
  - `[data-theme='night']`: Fondo carbón profundo (`#070a10`) con resplandor neón verde pádel (`#00E676`) y azul zafiro (`#00B0FF`).
- **Componentes:**
  - Controles segmentados estilo iOS (`[ Iniciar Sesión | Crear Perfil ]`).
  - Tarjetas con clase `.apple-card` y micro-bordes translúcidos.

## 3. Base de Datos, Cloud Firestore y Limpieza de Producción
- **Cero Placeholders en Producción:**
  - Las colecciones `groups`, `matches`, `completed_matches`, `partner_connections` y `partner_posts` deben estar limpias de mocks.
  - La sección de campañas y ofertas en el Dashboard solo se renderiza si existen convenios comerciales reales activos.
- **Sanitización de Datos (`cleanForFirestore`):**
  - Todo objeto enviado a Firestore debe procesarse con `cleanForFirestore()` para evitar errores por campos con valor `undefined`.
- **Reglas de Seguridad Explícitas:**
  - No usar comodines permisivos globales `match /{document=**}` si se requieren denegaciones o filtros por ID en colecciones específicas, ya que Firestore aplica lógica OR.
- **Limpieza en Tests:**
  - Los scripts de integración en Node que creen datos en Firestore deben borrar y limpiar los documentos y usuarios creados antes de llamar a `process.exit(0)`.

## 4. Gestión Territorial de Clubes y Componente Combobox
- **Base de Datos de Clubes:**
  - Mantener la colección `clubs` poblada con información real verificada (La Serena y Coquimbo: canchas, sector, dirección, Instagram).
- **Selector Combobox con Buscador:**
  - Todo selector de club debe usar `ClubSelectCombobox` con buscador interno, filtro por ciudad y opción para agregar o usar un club no listado (`+ Usar / Agregar club`), guardándolo en Firestore para enriquecer la base comunitaria.
  - En grupos, permitir selección múltiple de clubes preferidos mediante etiquetas/chips removibles.

## 5. Monetización y Comunidad
- **Invitados por QR:** Entrada 100% libre sin barreras de pago ni formularios obligatorios.
- **Anfitrión (Host):** 3 partidos de cortesía gratuitos antes de solicitar suscripción.
- **Reclamación de Historial (Guest History):** Toda cuenta registrada debe ejecutar `claimGuestHistory` para asociar retroactivamente estadísticas y victorias previas de partidos jugados como invitado.

## 6. Guardarraíles de Git y Pre-Despliegue
- **Archivos Grandes:** NUNCA añadir al staging de Git archivos superiores a 50 MB (incluirlos siempre en `.gitignore`).
- **Verificación Pre-Deploy:** Antes de cualquier push o despliegue a Firebase Hosting:
  1. `npx tsx src/engine/testFlow.ts`
  2. `npx tsx src/engine/testMonetization.ts`
  3. `npx tsx src/engine/testGroups.ts`
  4. `npm run build` (debe compilar con 0 errores TypeScript).
