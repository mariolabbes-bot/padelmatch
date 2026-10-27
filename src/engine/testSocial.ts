// ==========================================
// PADELMATCH - SOCIAL NETWORK & DIRECT CHAT TEST SUITE
// Tests Privacy Settings, Direct Messaging & Athlete Wall Reactions
// ==========================================

import { authService, type UserSession } from '../services/authService';
import { directChatService } from '../services/directChatService';
import { partnerService } from '../services/partnerService';
import { DEFAULT_USER_PRIVACY, type UserPrivacySettings } from '../types/padel';

declare const process: any;

console.log('🎾 ========================================');
console.log('🎾 INICIANDO TEST SUITE SOCIAL & DIRECT CHAT');
console.log('🎾 ========================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${errorDetail || 'Assertion failed'}`);
    testsFailed++;
  }
}

async function runSocialTests() {
  // Test Mock Users
  const userA: UserSession = {
    id: 'user_test_a',
    name: 'Mario Labbé',
    email: 'mario.test@padelmatch.cl',
    category: '4ta',
    favoritePosition: 'reves',
    elo: 1400,
    loggedInAt: Date.now(),
    plan: 'pro_founder'
  };

  const userB: UserSession = {
    id: 'user_test_b',
    name: 'Nicolás Jarry',
    email: 'nico.test@padelmatch.cl',
    category: '1ra',
    favoritePosition: 'drive',
    elo: 2100,
    loggedInAt: Date.now(),
    plan: 'pro_founder'
  };

  // ----------------------------------------------------
  // TEST PILLAR 1: GOBERNANZA & PRIVACIDAD DE DATOS
  // ----------------------------------------------------
  console.log('🛡️ --- 1. Probando Gobernanza & Privacidad de Datos ---');

  const defaultPrivacy = authService.getPrivacySettings('user_test_a');
  assert(
    defaultPrivacy.phoneVisibility === DEFAULT_USER_PRIVACY.phoneVisibility &&
    defaultPrivacy.eloVisibility === DEFAULT_USER_PRIVACY.eloVisibility &&
    defaultPrivacy.historyVisibility === DEFAULT_USER_PRIVACY.historyVisibility &&
    defaultPrivacy.presenceVisibility === DEFAULT_USER_PRIVACY.presenceVisibility,
    'Valores por defecto de privacidad inicializan correctamente (DEFAULT_USER_PRIVACY)'
  );

  const updatedSettings: UserPrivacySettings = {
    phoneVisibility: 'private',
    eloVisibility: 'partners',
    historyVisibility: 'partners',
    presenceVisibility: 'partners',
    invitesAllowed: 'partners',
    updatedAt: Date.now()
  };

  const saveRes = await authService.updatePrivacySettings(updatedSettings, userA);
  assert(saveRes === true, 'authService.updatePrivacySettings responde con éxito');

  const retrievedPrivacy = authService.getPrivacySettings(userA);
  assert(
    retrievedPrivacy.phoneVisibility === 'private' &&
    retrievedPrivacy.eloVisibility === 'partners' &&
    retrievedPrivacy.presenceVisibility === 'partners',
    'Configuración de privacidad modificada persiste y se recupera con fidelidad'
  );

  // ----------------------------------------------------
  // TEST PILLAR 2: MENSAJERÍA DIRECTA IN-APP (SIN WHATSAPP)
  // ----------------------------------------------------
  console.log('\n💬 --- 2. Probando Mensajería Directa In-App (Anti-Caos WhatsApp) ---');

  const chatId1 = directChatService.getChatId(userA.id, userB.id);
  const chatId2 = directChatService.getChatId(userB.id, userA.id);
  assert(
    chatId1 === chatId2 && chatId1.includes(userA.id) && chatId1.includes(userB.id),
    'getChatId es determinista e idempotente sin importar el orden de los usuarios'
  );

  // User A envía mensaje a User B
  const msg1 = await directChatService.sendMessage(
    userA,
    userB.id,
    '¡Hola Nico! ¿Jugamos un partido este jueves a las 19:00 en La Serena Padel?'
  );

  assert(
    msg1.senderId === userA.id &&
    msg1.recipientId === userB.id &&
    msg1.read === false &&
    msg1.text.includes('La Serena Padel'),
    'User A envía mensaje directo correctamente con estado read: false'
  );

  // Verificar mensajes del chat
  const chatMessages = directChatService.getMessages(userA.id, userB.id);
  assert(
    chatMessages.length >= 1 && chatMessages.some(m => m.id === msg1.id),
    'El mensaje enviado se almacena y se recupera en la conversación directa'
  );

  // Verificar conteo de no leídos para User B
  const unreadForB = directChatService.getUnreadCount(userB.id, userA.id);
  assert(unreadForB >= 1, `User B tiene al menos 1 mensaje no leído (conteo: ${unreadForB})`);

  // User B marca como leído
  await directChatService.markAsRead(userB.id, userA.id);
  const unreadAfterRead = directChatService.getUnreadCount(userB.id, userA.id);
  assert(unreadAfterRead === 0, 'Tras marcar como leído, el contador de no leídos para User B es 0');

  // User B responde a User A
  const msg2 = await directChatService.sendMessage(
    userB,
    userA.id,
    '¡De todas maneras Mario! Llevo las pelotas nuevas Bullpadel.'
  );

  assert(
    msg2.senderId === userB.id && msg2.recipientId === userA.id,
    'User B responde a User A dentro de la misma sala determinista'
  );

  // ----------------------------------------------------
  // TEST PILLAR 3: ATHLETE WALL / FEED CON REACCIONES
  // ----------------------------------------------------
  console.log('\n🔥 --- 3. Probando Feed Atlético & Reacciones (Chócala / Puntazo) ---');

  // Crear un post de partido
  const newPost = partnerService.createPost(
    userA,
    '¡Tremendo partido hoy en La Serena Padel! Triunfo 6-4, 7-6 contra una dupla durísima.',
    {
      type: 'match_result',
      matchSnippet: {
        courtName: 'Cancha Central - La Serena Padel',
        scoreSets: '6-4 / 7-6',
        isVictory: true,
        rivalsNames: 'González / Tapia'
      }
    }
  );

  assert(
    newPost.authorId === userA.id &&
    newPost.type === 'match_result' &&
    newPost.matchSnippet?.courtName === 'Cancha Central - La Serena Padel',
    'Post atlético con ficha de partido creada correctamente en el muro'
  );

  // Reacción 1: Chócala 👏
  partnerService.toggleReaction(newPost.id, userB, 'clap');
  let postAfterClap = partnerService.getFeedPosts().find(p => p.id === newPost.id);
  assert(
    Boolean(
      postAfterClap?.clapsCount === 1 &&
      postAfterClap?.reactions?.some(r => r.userId === userB.id && r.type === 'clap')
    ),
    'User B reacciona con "👏 Chócala" y se registra en reacciones'
  );

  // Reacción 2: Cambiar a Puntazo 🔥
  partnerService.toggleReaction(newPost.id, userB, 'fire');
  let postAfterFire = partnerService.getFeedPosts().find(p => p.id === newPost.id);
  assert(
    Boolean(
      postAfterFire?.reactions?.some(r => r.userId === userB.id && r.type === 'fire') &&
      postAfterFire?.reactions?.length === 1
    ),
    'User B actualiza su reacción a "🔥 Puntazo" con reemplazo limpio'
  );

  // Comentario deportivo
  partnerService.addComment(newPost.id, userB, '¡Qué tie-break sacaron al final!');
  const postWithComment = partnerService.getFeedPosts().find(p => p.id === newPost.id);
  assert(
    postWithComment?.comments.length === 1 &&
    postWithComment.comments[0].authorName === userB.name,
    'Comentario deportivo agregado exitosamente al post'
  );

  // Eliminar post
  partnerService.deletePost(newPost.id, userA.id, false);
  const postDeleted = partnerService.getFeedPosts().find(p => p.id === newPost.id);
  assert(postDeleted === undefined, 'El autor del post puede eliminarlo correctamente');

  // ----------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`TOTAL PRUEBAS: ${testsPassed + testsFailed}`);
  console.log(`PASADAS: ${testsPassed}`);
  console.log(`FALLIDAS: ${testsFailed}`);
  console.log('========================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSocialTests().catch(err => {
  console.error('Error fatal ejecutando test suite social:', err);
  process.exit(1);
});
