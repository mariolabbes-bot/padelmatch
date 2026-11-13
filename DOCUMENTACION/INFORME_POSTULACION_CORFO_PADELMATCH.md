# INFORME TÉCNICO Y ESTRATÉGICO DE PROYECTO: PADELMATCH
**Evaluación de Alcance, Funcionalidades y Elegibilidad para Postulación a Capital Semilla de CORFO (Semilla Inicia / Semilla Expande)**

---

## 1. RESUMEN EJECUTIVO Y CONCEPTO DE LA IDEA

### 1.1. Propuesta de Valor y Filosofía
**PadelMatch** es una solución **SportTech integral basada en Progressive Web App (PWA) e Internet de las Cosas (IoT)** diseñada para digitalizar la experiencia deportiva del pádel tanto **dentro de la cancha** (*in-game*) como **fuera de ella** (*post-game* y gestión comunitaria).

A diferencia de las plataformas tradicionales de la industria que se limitan exclusivamente a ser motores de reserva de pistas (como Easycancha o Playtomic) o redes sociales estáticas, PadelMatch se define como una **herramienta de asistencia invisible, interactiva y en tiempo real** que conecta a los tres pilares del ecosistema:
1. **Jugadores (Anfitriones e Invitados):** Asistencia en cancha sin fricción, arbitraje automático, seguimiento estadístico y convocatorias inteligentes.
2. **Clubes y Complejos Deportivos:** Tecnología de visualización (*Court TV Display*), fidelización de usuarios y optimización de ocupación en horarios valle.
3. **Marcas y Proveedores:** Canal directo y segmentado para patrocinio, equipamiento y torneos en el entorno del *"Tercer Tiempo"*.

* **Lema de producto:** *"PadelMatch: Te conecta con cada punto del juego."*
* **Pilares de marca:** Deporte, profesionalismo, camaradería y cero fricción en cancha.

---

## 2. ARQUITECTURA TÉCNICA Y NIVEL DE MADUREZ (TRL)

El desarrollo del proyecto no se encuentra en fase conceptual ni de maqueta en diseño; cuenta con una base de software altamente desarrollada y funcional:

* **Arquitectura Frontend:** React + TypeScript + Vite, estructurado en arquitectura modular de componentes y servicios desacoplados.
* **Modelo PWA (Progressive Web App):** Instalable en teléfonos móviles (iOS/Android), tablets, ordenadores y Smart TVs de clubes sin requerir descargas pesadas de tiendas comerciales. Soporta funcionamiento adaptativo y modo oscuro/claro de alto contraste para visibilidad bajo luz solar o nocturna.
* **Backend y Sincronización en la Nube:** Firebase Firestore con suscripciones reactivas en tiempo real (`onSnapshot`) para control de salas de partidos, perfiles comunitarios, convocatorias y mensajería.
* **Nivel de Madurez Tecnológica (TRL):** **TRL 5 - TRL 6** (Tecnología validada en entorno relevante y prototipo funcional operativo con backend real). Esto sitúa a PadelMatch por encima de la media de proyectos que postulan a fondos de etapas tempranas.

---

## 3. INFORME DETALLADO DE FUNCIONALIDADES Y ALCANCE

### MÓDULO 1: Motor Oficial de Marcador y Arbitraje en Cancha (`padelEngine.ts` & `Scoreboard.tsx`)
* **Cumplimiento Reglamentario FIP (Federación Internacional de Pádel):**
  * Modos de juego: Al mejor de 3 sets, al mejor de 5 sets o set único.
  * Regla de juego: **Punto de Oro (Golden Point)** oficial World Padel Tour / Premier Padel vs. Ventaja tradicional.
  * Definición de sets: Tie-break estándar a 7 puntos o ventaja por 2 games.
  * Definición de partido: Tercer set completo o **Súper Tie-break a 10, 12 o 13 puntos**.
* **Árbitro Inteligente por Voz en Tiempo Real (TTS Engine):**
  * Locución auditiva del tanteador instantáneo (ej. *"15-30"*, *"40 iguales, Punto de Oro"*, *"Punto de quiebre"*, *"Juego y set Pareja 1"*).
  * Avisos automáticos de rotación de saque (jugador al servicio) y cambio de lado de cancha con cuenta regresiva para tiempo reglamentario de descanso (90 segundos).
* **Pila de Deshacer ("Undo Stack"):**
  * Historial paso a paso de cada punto con descripción de jugada, permitiendo revertir cualquier marcación errónea sin reiniciar el set.
* **Modos de Visualización:**
  * Modo vertical táctil con botones gigantes aptos para toques con guante/muñequera.
  * Modo horizontal adaptativo de alta visibilidad para apoyar el dispositivo en la red o banco.

---

### MÓDULO 2: Integración IoT, Wearables y Control Remoto Invisible (`smartwatchService.ts` & `hardwareInput.ts`)
Resuelve el problema de tener que desplazarse al teléfono tras cada punto disputado:
* **Control Nativo desde Smartwatch (Apple Watch & Wear OS / Samsung):**
  * **Innovación técnica destacada:** No requiere instalar apps propietarias complejas. Utiliza la API HTML5 *Media Session* combinada con bucles de audio en segundo plano de ultra bajo consumo (`/silence.wav`).
  * Permite sumar puntos al Equipo 1 (pista previa), Equipo 2 (pista siguiente), o deshacer puntos (pausa/play) directamente desde la pantalla de reproducción multimedia del reloj.
* **Compatibilidad con Botoneras y Remotos Bluetooth Genéricos:**
  * Soporte *Plug & Play* precalibrado para disparadores tipo selfie (AB Shutter), anillos de pulgar (TikTok ring controllers), punteros inalámbricos fijados en la reja de la cancha y teclados numéricos.
  * Interfaz de calibración personalizada para mapear cualquier botón Bluetooth de bajo costo ($3.000 a $5.000 CLP).

---

### MÓDULO 3: Sincronización Multipantalla y Modo TV para Clubes (`matchSyncService.ts` & `CourtTvDisplay.tsx`)
* **Modo Court TV:**
  * Interfaz visual en alta definición diseñada para Smart TVs o monitores instalados fuera o dentro de la cancha.
  * Muestra en tiempo real: nombres de parejas, tanteador gigante, pareja al servicio, cronómetro de duración del encuentro y banners animados para "Punto de Oro" y "Cambio de Lado".
* **Arquitectura de Sala P2P (Host / Guest):**
  * El anfitrión (*Host*) crea el partido y la app genera un código alfanumérico y un código QR dinámico.
  * **Onboarding Cero Fricción para Jugadores Invitados:** Los 3 acompañantes escanean el código QR y entran de inmediato al partido como espectadores o jugadores acreditados sin necesidad de pagar ni completar formularios extensos.

---

### MÓDULO 4: Algoritmo de Habilidad (ELO) y Analítica Avanzada (`eloEngine.ts` & `UserProfileView.tsx`)
* **Cálculo Matemático de ELO Adaptado a Pádel:**
  * Cálculo logístico ponderado por el promedio de la pareja y ajustado por el margen de dominio en games (factor de aplastamiento).
  * Escalas de nivel dinámicas: *Amateur* (600–1149), *Intermedio* (1150–1349), *Avanzado* (1350–1599), *Competición* (1600–1849) y *Master / Élite* (1850+).
* **Métricas Situacionales Avanzadas:**
  * **Rendimiento Día vs. Noche:** Comparativa de efectividad bajo Luz Natural (08:00 - 18:30) vs. Luz Artificial (18:30+).
  * **Factor Clutch (Puntos de Oro):** Porcentaje de conversión de Puntos de Oro disputados y ganados.
  * **Desempeño en Tie-Breaks:** Estadísticas de victorias bajo presión en muerte súbita.
* **Algoritmo de Sinergia y Rivalidad:**
  * Detección automática de la **"Mejor Pareja" (Best Partner)** según tasa de victorias conjunta.
  * Identificación del **"Némesis"** (rival más difícil según historial de derrotas directas).

---

### MÓDULO 5: Gestión de Grupos y Convocatorias Inteligentes (`groupService.ts` & `GroupsView.tsx`)
* **Algoritmo de Convocatorias en Múltiplos de 4:**
  * El gran dolor del pádel amateur es armar partidos con números incompletos (3 o 5 jugadores). El sistema gestiona las listas de confirmación y alerta al creador si la cantidad de confirmados cierra en múltiplos de 4 (4, 8, 12 jugadores), sugiriendo invitar reservas cuando falta 1 integrante.
* **Generación de Enlaces Virales para WhatsApp:**
  * Mensajes estructurados para compartir en grupos de chat con llamado a la acción (`#join-group=...` o `#match-invite=...`) que inscriben automáticamente al jugador al abrir la aplicación.

---

### MÓDULO 6: "Tercer Tiempo", Red Social Deportiva y Canal B2B (`partnerService.ts`)
* **Feed Deportivo Personalizado:** Muro de publicaciones para celebrar victorias, resultados de partidos, comentarios y reacciones de ánimo (*Clap, Fire, Trophy, Muscle*).
* **Vitrina B2B para Clubes y Marcas:** Publicación de clínicas deportivas, torneos americanos y promociones en horarios de baja demanda (valle), vinculando a los jugadores con el comercio local.
* **Gobernanza y Privacidad de Datos:** Control granular para el usuario (definir si su número de WhatsApp, historial deportivo, ELO o presencia en cancha es público, exclusivo para sus *partners* o privado).

---

### MÓDULO 7: Modelo de Negocio y Monetización (`SubscriptionPlansModal.tsx` & `AdminDashboardView.tsx`)
* **Estrategia B2C (Freemium):**
  * Los usuarios invitados disfrutan de la app 100% gratis de forma indefinida.
  * El anfitrión (*Host*) dispone de **3 partidos de cortesía gratuitos**.
  * Planes de suscripción Pro para organizadores:
    * *Plan Temporada (6 meses):* $9.990 CLP (~$1.665/mes).
    * *Plan Anual (12 meses):* $16.990 CLP (~$1.415/mes).
    * *Plan Mensual Flexible:* $1.990 CLP/mes.
    * *Pase Fundador Vitalicio:* $24.990 CLP (cupo limitado para tracción inicial).
* **Estrategia B2B (Complejos Deportivos):**
  * Venta SaaS para clubes: Software para pantallas *Court TV*, tableros de visualización de torneos y canal prioritario de campañas publicitarias.
* **Módulo de Administración Central (`AdminDashboardView.tsx`):**
  * Panel de control para visualizar KPIs de negocio: total de usuarios registrados, ingresos proyectados, clubes afiliados, partidos disputados, tasa de conversión freemium a Pro y trazabilidad del sistema de referidos.

---

## 4. ANÁLISIS DE ELEGIBILIDAD PARA CAPITAL SEMILLA DE CORFO

### 4.1. Dictamen de Elegibilidad
**DICTAMEN: SÍ, CALZA CON ELEVADO POTENCIAL EN "SEMILLA INICIA" DE CORFO** (y posteriormente en **Semilla Expande** una vez iniciadas las ventas formales).

| Criterio de Evaluación CORFO | Peso / Enfoque | Evaluación de PadelMatch | Veredicto |
| :--- | :---: | :--- | :---: |
| **1. Innovación y Diferenciación** | **Alto (30-35%)** | Rompe con el paradigma de "app de reservas". Introduce innovación tecnológica tangible: arbitraje por voz en tiempo real, integración IoT con wearables vía Media Session API sin app nativa, algoritmo situacional (día/noche, clutch) y control inteligente de convocatorias en múltiplos de 4. | **Sobresaliente** |
| **2. Escalabilidad del Modelo** | **Alto (25-30%)** | Al estar construida como PWA con backend Cloud Serverless, el costo marginal de atender a 10.000 o 100.000 jugadores en Chile, Argentina, España o México es cercano a cero. Modelo SaaS B2C (suscripción) + B2B (clubes) con efecto de red viral (cada partido jugado incorpora a 3 usuarios nuevos). | **Sobresaliente** |
| **3. Tamaño de Mercado y Oportunidad** | **Medio-Alto (20%)** | El pádel es el deporte de mayor crecimiento mundial en la última década. En Chile se ha consolidado como el segundo deporte más practicado con cientos de clubes y más de 300.000 jugadores frecuentes con poder adquisitivo medio y alto. | **Favorable** |
| **4. Grado de Madurez y Factibilidad (TRL)** | **Crítico** | La gran mayoría de los postulantes a Semilla Inicia postulan con ideas en papel o maquetas no funcionales. PadelMatch cuenta con un software operable (TRL 5-6) con motor de reglas, base de datos en tiempo real y UI responsiva terminada. | **Muy Alto** |
| **5. Coherencia en el uso de los fondos** | **Operacional** | El subsidio de CORFO (hasta $15.000.000 CLP en Semilla Inicia) no se gastaría en adivinar cómo programar el MVP, sino en validación comercial, pasarela de pagos nacional (WebPay/MercadoPago), marketing de adquisición en clubes de la Región de Coquimbo/Metropolitana y propiedad intelectual. | **Óptimo** |

---

### 4.2. Fortalezas Clave frente a Evaluadores CORFO
1. **Efecto de Red Viral Orgánico (Factor 1 a 3):** Por cada usuario que compra la suscripción para organizar partidos (*Host*), se incorporan 3 jugadores a la plataforma de manera obligada pero amigable (escaneando el QR). Esto reduce drásticamente el Costo de Adquisición de Clientes (CAC).
2. **Solución a un Dolor Real y Frecuente:** Evita las discusiones de tanteador en cancha (arbitraje neutro) y soluciona la desorganización de partidos incompletos en WhatsApp.
3. **Cero Dependencia de Hardware Costoso Propietario:** A diferencia de startups que intentan vender cámaras de $2.000 USD por cancha, PadelMatch corre en cualquier teléfono inteligente, Smart TV económica y controles Bluetooth de bajo costo.

---

### 4.3. Riesgos a Prevenir en el Formulario CORFO y Cómo Mitigarlos
* **Riesgo 1: Que el evaluador piense *"es solo otra app de reservas como Easycancha"*.**
  * *Cómo mitigarlo:* Debe explicarse explícitamente en el formulario: *"PadelMatch no compite con los sistemas de agendamiento de canchas; es una capa de tecnología complementaria que opera DURANTE el juego (SportTech IoT, arbitraje auditivo, estadísticas) y en la interacción social comunitaria posterior."*
* **Riesgo 2: Que el evaluador piense *"es solo una red social donde nadie publicará nada"*.**
  * *Cómo mitigarlo:* Destacar que el contenido se autogenera mediante la actividad deportiva (partidos jugados, ascensos de ELO, resultados oficiales exportables), complementado con ofertas B2B de los clubes.
* **Riesgo 3: Formación y dedicación del equipo.**
  * *Requisito CORFO:* Es mandatorio presentar un equipo de trabajo balanceado (perfil técnico de desarrollo de software + perfil de ventas/comercialización en el ecosistema deportivo).

---

## 5. RECOMENDACIÓN DEL PLAN DE TRABAJO PARA POSTULAR A CORFO

Con un fondo **Semilla Inicia de CORFO** (hasta $15.000.000 CLP con 75% subsidio CORFO y 25% aporte de la beneficiaria), el presupuesto y plan de trabajo sugerido a 8 meses es:

1. **Meses 1 - 2: Integración de Medios de Pago y Seguridad Transaccional:**
   * Integración de pasarela de pago chilena (Transbank WebPay Plus / Mercado Pago / Fintoc) para automatizar el cobro recurrente de suscripciones.
   * Registro de marca comercial en INAPI y protección de propiedad intelectual del software.
2. **Meses 3 - 5: Plan Piloto y Validación Comercial en Terreno:**
   * Alianza piloto con 5 a 10 clubes de pádel en la Región de Coquimbo (La Serena / Coquimbo) y Región Metropolitana.
   * Instalación y homologación del módulo *Court TV* en pistas centrales de los clubes asociados.
3. **Meses 6 - 8: Campaña de Adquisición de Usuarios y Escalabilidad:**
   * Activaciones en torneos oficiales y distribución de kits con botoneras Bluetooth a anfitriones referentes.
   * Optimización del motor analítico para recomendaciones automáticas basadas en inteligencia artificial.
   * Cierre con métricas de tracción (usuarios activos mensuales MAU y tasa de conversión a planes Pro) para postular a la fase siguiente: **Semilla Expande** ($25.000.000 CLP adicionales).

---

## 6. CONCLUSIÓN

El proyecto **PadelMatch cuenta con todas las credenciales técnicas, funcionales y de modelo de negocio para calzar con éxito en la postulación de Capital Semilla de CORFO**. 

El alto grado de desarrollo actual (código fuente limpio, modular, reactivo y con funcionalidades IoT de vanguardia) le otorga una ventaja competitiva decisiva respecto a la mayoría de postulaciones que se presentan en etapas meramente teóricas. La clave de la postulación radicará en estructurar la narrativa en torno al concepto **SportTech / IoT accesible**, el **efecto de red viral (1 anfitrión = 3 invitados)** y el **gran mercado en expansión del pádel**.
