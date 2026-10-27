# PadelMatch: Estándares de Producto, UX Deportiva, Base de Datos y Código

## 1. Ergonomía en Cancha y Jerarquía del Marcador (Scoreboard)
- **Puntos (Primario / Héroe):** Debe ocupar el >70% del área de cada equipo con dígitos colosales (`font-size: clamp(6.5rem, 22vw, 13rem)` en horizontal y `clamp(4.6rem, 16vw, 7.8rem)` en vertical). Legibilidad obligatoria desde 10-15 metros a través del vidrio.
- **Juegos (Secundario):** Indicador refinado y compacto (`1.75rem - 2.1rem`) en caja deportiva contrastada.
- **Sets (Terciario):** Cinta o pastilla compacta (`0.65rem - 0.85rem`) para seguimiento del partido sin robar foco visual.
- **Modo Horizontal (Landscape) y Pantalla Completa:** Soporte de rotación con botón de pantalla completa y solicitud de bloqueo horizontal (`screen.orientation.lock('landscape')`).
- **Control Táctil In-Game:** La tarjeta completa del equipo funciona como zona táctil de puntuación con animación `scorePop` y vibración háptica (`navigator.vibrate(35)`).

## 2. Estética Atlética de Alta Gama, Tarjetas Sólidas y Alto Contraste
- **Alto Contraste y Dualidad Día/Noche:**
  - `[data-theme='day']`: Fondo gris pizarra suave (`#f1f5f9`), tarjetas en blanco sólido (`var(--bg-card)` = `#ffffff`), paneles secundarios (`var(--bg-elevated)` = `#f8fafc`) y textos en alto contraste anti-reflejo (`var(--text-main)` = `#0f172a`).
  - `[data-theme='night']`: Fondo carbón profundo (`#070a10`) con resplandor neón verde pádel (`#00E676`) y azul zafiro (`#00B0FF`).
- **Diseño Sólido y Glassmorphism Minimalista (Reglas Estrictas):**
  - **Cero Degradados Sucios en Fondo Claro:** Prohibido el uso de degradados oscuros o radiales en contenedores principales y tarjetas en modo claro. Los fondos deben ser limpios y uniformes.
  - **Inputs y Selects Nítidos:** Todos los campos de entrada deben tener fondo blanco sólido (`var(--bg-input, #ffffff)`), borde nítido de `1.5px solid var(--border-medium)` y texto de contraste total `var(--text-main)`. Queda prohibido el uso de `rgba(0, 0, 0, 0.35)` sobre fondos claros.
  - **Prohibición de `color: '#fff'` Residual:** Nunca hardcodear texto blanco en modales, inputs o tarjetas sin verificar el contraste contra el fondo blanco del modo día. Usar siempre `var(--text-main)` y `var(--text-muted)`.
  - **Jerarquía con Franjas Deportivas:** Destacar tarjetas y paneles importantes mediante bordes de acento sólido (`borderLeft: 4px solid var(--team1-primary)` o `var(--gold-primary)`), en lugar de cajas con degradados densos que degradan la legibilidad.
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

## 5. Monetización, Comunidad y Referidos
- **Invitados por QR:** Entrada 100% libre sin barreras de pago ni formularios obligatorios.
- **Anfitrión (Host):** 3 partidos de cortesía gratuitos antes de solicitar suscripción.
- **Reclamación de Historial (Guest History):** Toda cuenta registrada debe ejecutar `claimGuestHistory` para asociar retroactivamente estadísticas y victorias previas de partidos jugados como invitado.
- **Atribución de Referidos:** Registrar invitaciones cursadas por WhatsApp (`referralService.ts`). Cuando un invitado se registra y actualiza a PRO, computar la conversión a favor del anfitrión para futuras campañas de incentivos y premiación.

## 6. Programación de Partidos & Múltiplos de 4
- **Convocatorias y Cupos:** Todo partido programado consta de 4 cupos obligatorios (Slot 0: Anfitrión, Slots 1-3: Invitados).
- **Invitaciones Externas:** Compartir textos optimizados con URL directa para responder vía web o WhatsApp.
- **Transición a la Cancha:** Al confirmarse los 4 cupos, cualquiera de los 4 participantes puede abrir el partido desde su panel e iniciar el marcador sincronizado (`matchSyncRoomId`).

## 7. Panel de Administración y Seguridad
- **Autorización Restringida:** El panel de administración (`admin` view) está limitado estrictamente a `mariolabbes@gmail.com` y correos validados en `authService.isAdmin()`.
- **Acceso Discreto:** No mostrar botones de administración a usuarios regulares. Solo desplegar el acceso en la barra superior, el menú lateral y el perfil si el usuario cumple la autorización.
- **Capacidades del Administrador:** Modificación directa de planes y categorías de usuarios, alta y verificación de clubes, moderación de grupos de la comunidad y auditoría de partidos.

## 8. Arquitectura de Modales y Prevención de Bloqueos de Scroll
- **Estructura Tripartita Obligatoria:**
  1. **Header Fijo (`flexShrink: 0`):** Título, subtítulo y botón `(X)` siempre visibles en el tope.
  2. **Cuerpo Scrollable (`flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch'`):** Permite desplazamiento completo sin recortar campos en pantallas móviles o teclados virtuales abiertos.
  3. **Footer Sticky (`position: 'sticky', bottom: 0, flexShrink: 0, borderTop`):** Botones de acción siempre visibles.
- **Backdrop y Contenedor:** El backdrop debe tener `overflowY: 'auto'` y el `modalBox` debe usar `margin: 'auto'` y `maxHeight: 'min(92vh, 880px)'` para evitar recortes en coordenadas negativas causados por `alignItems: 'center'`.

## 9. Guardarraíles de Git y Pre-Despliegue
- **Archivos Grandes:** NUNCA añadir al staging de Git archivos superiores a 50 MB (incluirlos siempre en `.gitignore`).
- **Verificación Pre-Deploy:** Antes de cualquier push o despliegue a Firebase Hosting, deben pasar todas las suites de test y el build limpio:
  1. `npx tsx src/engine/testFlow.ts`
  2. `npx tsx src/engine/testSocial.ts` (Red social atlética, mensajería y privacidad)
  3. `npx tsx src/engine/testMonetization.ts`
  4. `npx tsx src/engine/testGroups.ts`
  5. `npx tsx src/engine/testSchedule.ts`
  6. `npx tsx src/engine/testReferrals.ts`
  7. `npx tsx src/engine/testAdmin.ts`
  8. `npm run build` (debe compilar con 0 errores TypeScript).

## 10. Red Social Atlética, Privacidad y Mensajería In-App
- **Mensajería Directa In-App (Anti-Caos WhatsApp):**
  - Mantener la comunicación entre partners dentro de la plataforma para preservar el foco deportivo y evitar la mezcla de temas ajenos a la cancha.
  - Los canales de mensajería directa se identifican de manera determinista e idempotente mediante `getChatId(userA, userB)`.
- **Gobernanza de Privacidad:**
  - El usuario tiene control estricto de su información mediante tres niveles: `public`, `partners` y `private` para su perfil, estadísticas y partidos.
- **Muro Atlético:**
  - Publicaciones centradas en eventos de clubes, actividades de partners y partidos completados, con soporte de reacciones deportivas nativas (`👏 Chócala`, `🔥 Puntazo`).

## 11. Periféricos Bluetooth y Smartwatches (Apple Watch & Galaxy Watch)
- **Debounce y Prevención de Eventos Fantasma:**
  - Todo evento de teclado o tecla multimedia proveniente de controles Bluetooth o smartwatches debe tener un filtro de rebote (debouncing de mínimo 350ms).
- **Separación de Lógica de Marcador:**
  - La acción de incremento de puntos para Pareja 1 o Pareja 2 no debe desencadenar reducciones de puntaje ni reseteos accidentales de set.
