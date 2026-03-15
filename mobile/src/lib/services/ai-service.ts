import { Document, UrgenceLevel, DocumentCategory } from '../types';
import type { Language } from '../i18n/translations';
import { getLanguageName } from '../i18n';

// Backend URL — all AI calls go through the secure backend proxy
const BACKEND_URL =
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'http://localhost:3000';

interface AnalysisResult {
  type: string;
  organisme: string;
  titre: string;
  categorie: DocumentCategory;
  urgence: UrgenceLevel;
  urgenceLabel: string;
  montant?: string;
  dateLimite?: string;
  explication: string;
  action: string;
  contenuBrut?: string;
}

interface GeneratedResponse {
  objet: string;
  corps: string;
  signature: string;
}

// New types for enhanced features
export interface DetectedDeadline {
  date: Date;
  type: 'payment' | 'response' | 'appointment' | 'renewal' | 'other';
  description: string;
  daysUntil: number;
  isUrgent: boolean;
}

export interface AutoReminder {
  id: string;
  title: string;
  description: string;
  scheduledDate: Date;
  type: 'deadline' | 'followup' | 'action';
  priority: 'low' | 'medium' | 'high';
}

export interface ResponseTemplate {
  id: string;
  type: 'accept' | 'refuse' | 'info_request' | 'confirm' | 'delay' | 'complaint';
  label: string;
  icon: string;
  description: string;
  subject: string;
  body: string;
}

// ─── Document Analysis (via backend proxy) ──────────────────────────────────

export async function analyzeDocumentWithAI(
  imageBase64: string,
  _imageUri: string,
  language: Language = 'fr'
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, language }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      return data.result as AnalysisResult;
    }

    throw new Error('Invalid response from backend');
  } catch (error) {
    console.error('AI analysis error (via backend):', error);
    return mockAnalysis(language);
  }
}

// ─── Generate Response (via backend proxy) ──────────────────────────────────

export async function generateResponseWithAI(
  document: Document,
  userInfo: { prenom: string; nom: string; adresse: string },
  language: Language = 'fr'
): Promise<GeneratedResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/generate-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, userInfo, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.result) {
        return data.result as GeneratedResponse;
      }
    }
  } catch (error) {
    console.error('Error generating response via backend:', error);
  }

  // Fallback responses per language
  const fallbackResponses: Record<Language, GeneratedResponse> = {
    fr: {
      objet: `Réponse à votre courrier - ${document.titre}`,
      corps: `Madame, Monsieur,

Je fais suite à votre courrier concernant ${document.titre.toLowerCase()}.

${document.action.toLowerCase().includes('payer')
        ? `Je vous informe que je procéderai au règlement dans les délais impartis.`
        : `J'ai bien pris note des informations communiquées.`}

Je reste à votre disposition pour tout renseignement complémentaire.`,
      signature: `Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${userInfo.prenom} ${userInfo.nom}`,
    },
    en: {
      objet: `Response to your letter - ${document.titre}`,
      corps: `Dear Sir or Madam,

I am writing in response to your letter regarding ${document.titre.toLowerCase()}.

${document.action.toLowerCase().includes('pay')
        ? `I would like to inform you that I will proceed with the payment within the specified timeframe.`
        : `I have taken note of the information provided.`}

Please do not hesitate to contact me if you require any further information.`,
      signature: `Yours faithfully,

${userInfo.prenom} ${userInfo.nom}`,
    },
    es: {
      objet: `Respuesta a su carta - ${document.titre}`,
      corps: `Estimados señores,

Me dirijo a ustedes en respuesta a su carta sobre ${document.titre.toLowerCase()}.

${document.action.toLowerCase().includes('pagar')
        ? `Les informo que procederé al pago dentro del plazo establecido.`
        : `He tomado nota de la información proporcionada.`}

Quedo a su disposición para cualquier información adicional.`,
      signature: `Atentamente,

${userInfo.prenom} ${userInfo.nom}`,
    },
  };

  return fallbackResponses[language] || fallbackResponses.fr;
}

// ─── Speech-to-Text (via backend proxy) ─────────────────────────────────────

export async function transcribeAudio(
  audioBase64: string,
  language: Language = 'fr'
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/speech-to-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.transcription) {
        return data.transcription;
      }
    }

    throw new Error('Transcription failed');
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw error;
  }
}

// ─── Text-to-Speech (via backend proxy) ─────────────────────────────────────

export async function synthesizeSpeech(
  text: string,
  language: Language = 'fr'
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.audioBase64) {
        return data.audioBase64;
      }
    }

    throw new Error('Text-to-speech failed');
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}

// ─── Voice Command Processing (local — no API keys needed) ──────────────────

export async function processVoiceCommand(
  transcription: string,
  context: { documentsCount: number; currentPage: string },
  language: Language = 'fr'
): Promise<{
  intention: string;
  reponse: string;
  action?: { type: string; cible?: string };
}> {
  const text = transcription.toLowerCase().trim();

  const patterns: Record<Language, {
    scanner: string[];
    read: string[];
    recent: string[];
    search: string[];
    actions: string[];
    help: string[];
    call: string[];
    greeting: string[];
  }> = {
    fr: {
      scanner: ['scanner', 'photo', 'prendre'],
      read: ['lis', 'lire'],
      recent: ['dernier', 'récent', 'nouveau'],
      search: ['où', 'trouve', 'cherche'],
      actions: ['faire', 'attente', 'urgent', 'semaine'],
      help: ['aide', 'comment'],
      call: ['appel', 'téléphone', 'famille'],
      greeting: ['bonjour', 'salut', 'coucou'],
    },
    en: {
      scanner: ['scan', 'photo', 'take', 'capture'],
      read: ['read', 'tell'],
      recent: ['last', 'recent', 'latest', 'new'],
      search: ['where', 'find', 'search', 'look'],
      actions: ['do', 'pending', 'urgent', 'week'],
      help: ['help', 'how'],
      call: ['call', 'phone', 'family'],
      greeting: ['hello', 'hi', 'hey'],
    },
    es: {
      scanner: ['escanear', 'foto', 'tomar', 'capturar'],
      read: ['lee', 'leer', 'dime'],
      recent: ['último', 'reciente', 'nuevo'],
      search: ['dónde', 'encuentra', 'busca', 'buscar'],
      actions: ['hacer', 'pendiente', 'urgente', 'semana'],
      help: ['ayuda', 'cómo'],
      call: ['llamar', 'teléfono', 'familia'],
      greeting: ['hola', 'buenos días'],
    },
  };

  const responses: Record<Language, {
    scanner: string;
    readLast: string;
    search: string;
    actions: (count: number) => string;
    help: string;
    call: string;
    greeting: string;
    unknown: string;
  }> = {
    fr: {
      scanner: "D'accord, je vous emmène au scanner.",
      readLast: 'Je vais vous lire votre dernier courrier.',
      search: 'Je recherche dans vos documents...',
      actions: (count) => `Vous avez ${count} documents à traiter.`,
      help: "Je peux scanner vos courriers, vous les expliquer et vous aider à répondre. Dites par exemple : scanner un courrier, ou lis-moi mon dernier courrier.",
      call: 'Je prépare un appel vers votre aidant.',
      greeting: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      unknown: "Je n'ai pas bien compris. Vous pouvez me demander de scanner un courrier, de lire vos documents ou de chercher une facture.",
    },
    en: {
      scanner: "Alright, I'll take you to the scanner.",
      readLast: "I'll read your latest letter to you.",
      search: 'Searching through your documents...',
      actions: (count) => `You have ${count} documents to process.`,
      help: "I can scan your letters, explain them to you, and help you respond. For example, say: scan a letter, or read me my latest letter.",
      call: "I'm preparing a call to your helper.",
      greeting: 'Hello! How can I help you today?',
      unknown: "I didn't quite understand. You can ask me to scan a letter, read your documents, or search for an invoice.",
    },
    es: {
      scanner: 'De acuerdo, te llevo al escáner.',
      readLast: 'Voy a leerte tu última carta.',
      search: 'Buscando en tus documentos...',
      actions: (count) => `Tienes ${count} documentos por procesar.`,
      help: 'Puedo escanear tus cartas, explicártelas y ayudarte a responder. Por ejemplo, di: escanear una carta, o léeme mi última carta.',
      call: 'Estoy preparando una llamada a tu ayudante.',
      greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?',
      unknown: 'No entendí bien. Puedes pedirme que escanee una carta, lea tus documentos o busque una factura.',
    },
  };

  const p = patterns[language] || patterns.fr;
  const r = responses[language] || responses.fr;

  if (p.scanner.some((word) => text.includes(word))) {
    return { intention: 'scanner', reponse: r.scanner, action: { type: 'navigation', cible: 'scanner' } };
  }
  if (p.read.some((word) => text.includes(word)) && p.recent.some((word) => text.includes(word))) {
    return { intention: 'lire_dernier', reponse: r.readLast, action: { type: 'lire_document', cible: 'dernier' } };
  }
  if (p.search.some((word) => text.includes(word))) {
    return { intention: 'rechercher', reponse: r.search, action: { type: 'recherche' } };
  }
  if (p.actions.some((word) => text.includes(word))) {
    return { intention: 'actions_attente', reponse: r.actions(context.documentsCount), action: { type: 'lister_actions' } };
  }
  if (p.help.some((word) => text.includes(word))) {
    return { intention: 'aide', reponse: r.help };
  }
  if (p.call.some((word) => text.includes(word))) {
    return { intention: 'appeler', reponse: r.call, action: { type: 'appeler', cible: 'aidant' } };
  }
  if (p.greeting.some((word) => text.includes(word))) {
    return { intention: 'salutation', reponse: r.greeting };
  }

  return { intention: 'incompris', reponse: r.unknown };
}

// ─── Mock Analysis (offline fallback) ───────────────────────────────────────

function mockAnalysis(language: Language = 'fr'): AnalysisResult {
  const mockData: Record<Language, AnalysisResult[]> = {
    fr: [
      {
        type: 'Facture',
        organisme: 'Engie',
        titre: 'Facture de régularisation',
        categorie: 'energie' as DocumentCategory,
        urgence: 'orange' as UrgenceLevel,
        urgenceLabel: 'Cette semaine',
        montant: '89,50\u20ac',
        dateLimite: '25 janvier 2026',
        explication: "C'est votre facture de régularisation pour l'électricité. Le montant tient compte de votre consommation réelle. Vous devez payer 89,50\u20ac.",
        action: 'Payer 89,50\u20ac avant le 25 janvier par virement ou prélèvement',
        contenuBrut: "ENGIE\nService Clients\n\nFacture de régularisation\nRéférence client : 1234567890\nDate : 10 janvier 2026",
      },
    ],
    en: [
      {
        type: 'Invoice',
        organisme: 'Engie',
        titre: 'Adjustment Invoice',
        categorie: 'energie' as DocumentCategory,
        urgence: 'orange' as UrgenceLevel,
        urgenceLabel: 'This week',
        montant: '\u20ac89.50',
        dateLimite: 'January 25, 2026',
        explication: "This is your electricity adjustment invoice. The amount reflects your actual consumption. You need to pay \u20ac89.50.",
        action: 'Pay \u20ac89.50 before January 25 by transfer or direct debit',
        contenuBrut: "ENGIE\nCustomer Service\n\nAdjustment Invoice\nClient reference: 1234567890\nDate: January 10, 2026",
      },
    ],
    es: [
      {
        type: 'Factura',
        organisme: 'Engie',
        titre: 'Factura de regularización',
        categorie: 'energie' as DocumentCategory,
        urgence: 'orange' as UrgenceLevel,
        urgenceLabel: 'Esta semana',
        montant: '89,50\u20ac',
        dateLimite: '25 de enero de 2026',
        explication: "Esta es su factura de regularización de electricidad. El importe refleja su consumo real. Debe pagar 89,50\u20ac.",
        action: 'Pagar 89,50\u20ac antes del 25 de enero por transferencia o domiciliación',
        contenuBrut: "ENGIE\nServicio al Cliente\n\nFactura de regularización\nReferencia cliente: 1234567890\nFecha: 10 de enero de 2026",
      },
    ],
  };

  const mocks = mockData[language] || mockData.fr;
  return mocks[Math.floor(Math.random() * mocks.length)];
}

// ─── Deadline Detection (local — no API needed) ─────────────────────────────

export function detectDeadlines(document: Document): DetectedDeadline[] {
  const deadlines: DetectedDeadline[] = [];
  const now = new Date();

  if (document.dateLimite) {
    const parsedDate = parseDate(document.dateLimite);
    if (parsedDate) {
      const daysUntil = Math.ceil((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let type: DetectedDeadline['type'] = 'other';
      const actionLower = document.action.toLowerCase();
      const titleLower = document.titre.toLowerCase();

      if (actionLower.includes('payer') || actionLower.includes('pay') || actionLower.includes('règlement') || titleLower.includes('facture') || titleLower.includes('invoice')) {
        type = 'payment';
      } else if (actionLower.includes('répondre') || actionLower.includes('respond') || actionLower.includes('retourner')) {
        type = 'response';
      } else if (titleLower.includes('rendez-vous') || titleLower.includes('convocation') || titleLower.includes('appointment')) {
        type = 'appointment';
      } else if (titleLower.includes('renouvellement') || titleLower.includes('renewal') || titleLower.includes('échéance')) {
        type = 'renewal';
      }

      deadlines.push({ date: parsedDate, type, description: document.action, daysUntil, isUrgent: daysUntil <= 7 });
    }
  }

  return deadlines;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim().toLowerCase();

  const frenchMonths: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
    'jan': 0, 'fév': 1, 'fev': 1, 'mar': 2, 'avr': 3, 'jun': 5,
    'juil': 6, 'jul': 6, 'aoû': 7, 'aou': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'déc': 11, 'dec': 11,
  };
  const spanishMonths: Record<string, number> = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  };
  const englishMonths: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
  };
  const allMonths = { ...frenchMonths, ...spanishMonths, ...englishMonths };

  // Pattern: "25 janvier 2026" or "25 de enero de 2026"
  const longDatePattern = /(\d{1,2})\s*(?:de\s+)?([a-zéèûô]+)\s*(?:de\s+)?(\d{4})/i;
  const longMatch = cleaned.match(longDatePattern);
  if (longMatch) {
    const day = parseInt(longMatch[1], 10);
    const monthStr = longMatch[2].toLowerCase();
    const year = parseInt(longMatch[3], 10);
    const month = allMonths[monthStr];
    if (month !== undefined) return new Date(year, month, day);
  }

  // Pattern: "January 25, 2026"
  const englishDatePattern = /([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/i;
  const englishMatch = cleaned.match(englishDatePattern);
  if (englishMatch) {
    const monthStr = englishMatch[1].toLowerCase();
    const day = parseInt(englishMatch[2], 10);
    const year = parseInt(englishMatch[3], 10);
    const month = allMonths[monthStr];
    if (month !== undefined) return new Date(year, month, day);
  }

  // Pattern: "25/01/2026" or "25-01-2026"
  const numericPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const numericMatch = cleaned.match(numericPattern);
  if (numericMatch) {
    return new Date(parseInt(numericMatch[3], 10), parseInt(numericMatch[2], 10) - 1, parseInt(numericMatch[1], 10));
  }

  // Pattern: "2026-01-25" (ISO format)
  const isoPattern = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/;
  const isoMatch = cleaned.match(isoPattern);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  }

  return null;
}

// ─── Auto Reminders (local — no API needed) ─────────────────────────────────

export function generateAutoReminders(document: Document, reminderDaysConfig: number[] = [1, 3, 7]): AutoReminder[] {
  const reminders: AutoReminder[] = [];
  const deadlines = detectDeadlines(document);

  for (const deadline of deadlines) {
    const { date, type, daysUntil, isUrgent } = deadline;

    for (const daysBefore of reminderDaysConfig) {
      if (daysUntil >= daysBefore) {
        const reminderDate = new Date(date);
        reminderDate.setDate(reminderDate.getDate() - daysBefore);
        reminderDate.setHours(9, 0, 0, 0);

        if (reminderDate > new Date()) {
          let priority: AutoReminder['priority'] = 'low';
          if (daysBefore === 1) priority = 'high';
          else if (daysBefore <= 3) priority = 'medium';

          const typeLabels: Record<DetectedDeadline['type'], string> = {
            payment: 'Paiement', response: 'Réponse', appointment: 'Rendez-vous',
            renewal: 'Renouvellement', other: 'Échéance',
          };

          reminders.push({
            id: `auto_${document.id}_${daysBefore}`,
            title: `${typeLabels[type]} - J-${daysBefore}`,
            description: `${document.titre} (${document.organisme})`,
            scheduledDate: reminderDate,
            type: 'deadline',
            priority,
          });
        }
      }
    }

    if (isUrgent && daysUntil > 0 && daysUntil <= 3 && reminders.length === 0) {
      const immediateDate = new Date();
      immediateDate.setHours(immediateDate.getHours() + 2);
      reminders.push({
        id: `urgent_${document.id}`,
        title: 'Action urgente requise',
        description: `${document.titre} - Date limite dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
        scheduledDate: immediateDate,
        type: 'deadline',
        priority: 'high',
      });
    }
  }

  return reminders.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
}

// ─── Response Templates (local — no API needed) ─────────────────────────────

export function generateResponseTemplates(
  document: Document,
  userInfo: { prenom: string; nom: string; adresse: string },
  language: Language = 'fr'
): ResponseTemplate[] {
  const templates: ResponseTemplate[] = [];
  const { organisme, titre, action, montant, dateLimite } = document;

  if (language === 'fr') {
    templates.push(
      { id: 'accept', type: 'accept', label: 'Accepter', icon: '✓', description: 'Confirmer la demande ou accepter les conditions', subject: `Acceptation - ${titre}`, body: `Madame, Monsieur,\n\nJe fais suite à votre courrier concernant ${titre.toLowerCase()}.\n\nJ'ai bien pris connaissance des informations communiquées et je vous confirme mon accord.${montant ? `\n\nJe procéderai au règlement de ${montant} dans les meilleurs délais.` : ''}\n\nJe reste à votre disposition pour tout renseignement complémentaire.\n\nCordialement,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'refuse', type: 'refuse', label: 'Refuser', icon: '✕', description: 'Contester ou refuser la demande', subject: `Contestation - ${titre}`, body: `Madame, Monsieur,\n\nJe fais suite à votre courrier concernant ${titre.toLowerCase()}.\n\nAprès examen attentif, je souhaite contester cette demande pour les raisons suivantes :\n[Précisez vos raisons]\n\nJe vous prie de bien vouloir réexaminer ce dossier et me tenir informé(e) de votre décision.\n\nDans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'info_request', type: 'info_request', label: 'Demander des précisions', icon: '?', description: 'Demander des informations supplémentaires', subject: `Demande de renseignements - ${titre}`, body: `Madame, Monsieur,\n\nJe fais suite à votre courrier concernant ${titre.toLowerCase()}.\n\nAfin de pouvoir traiter cette demande correctement, je vous serais reconnaissant(e) de bien vouloir me fournir les informations complémentaires suivantes :\n- [Précisez vos questions]\n\nJe reste dans l'attente de votre réponse.\n\nCordialement,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'confirm', type: 'confirm', label: 'Accuser réception', icon: '\ud83d\udce8', description: 'Confirmer la bonne réception du courrier', subject: `Accusé de réception - ${titre}`, body: `Madame, Monsieur,\n\nJe vous confirme la bonne réception de votre courrier concernant ${titre.toLowerCase()}, reçu le [date].\n\nJ'ai bien noté les informations communiquées.${dateLimite ? ` Je m'engage à effectuer les démarches nécessaires avant le ${dateLimite}.` : ''}\n\nCordialement,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'delay', type: 'delay', label: 'Demander un délai', icon: '\u23f1', description: 'Solliciter un délai supplémentaire', subject: `Demande de délai - ${titre}`, body: `Madame, Monsieur,\n\nJe fais suite à votre courrier concernant ${titre.toLowerCase()}.\n\nJe me permets de solliciter un délai supplémentaire pour [traiter cette demande / effectuer le paiement] en raison de [expliquez votre situation].\n\nJe vous propose de [nouvelle date ou arrangement].\n\nJe vous remercie de votre compréhension et reste à votre disposition pour convenir d'une solution.\n\nCordialement,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
    );
  } else if (language === 'en') {
    templates.push(
      { id: 'accept', type: 'accept', label: 'Accept', icon: '✓', description: 'Confirm the request or accept the conditions', subject: `Acceptance - ${titre}`, body: `Dear Sir or Madam,\n\nI am writing in response to your letter regarding ${titre.toLowerCase()}.\n\nI acknowledge receipt of the information provided and confirm my agreement.${montant ? `\n\nI will proceed with the payment of ${montant} at my earliest convenience.` : ''}\n\nPlease do not hesitate to contact me if you require any further information.\n\nYours faithfully,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'refuse', type: 'refuse', label: 'Refuse', icon: '✕', description: 'Contest or refuse the request', subject: `Dispute - ${titre}`, body: `Dear Sir or Madam,\n\nI am writing in response to your letter regarding ${titre.toLowerCase()}.\n\nAfter careful consideration, I wish to dispute this request for the following reasons:\n[Please specify your reasons]\n\nI kindly request that you review this matter and inform me of your decision.\n\nYours faithfully,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'info_request', type: 'info_request', label: 'Request information', icon: '?', description: 'Request additional information', subject: `Information Request - ${titre}`, body: `Dear Sir or Madam,\n\nI am writing in response to your letter regarding ${titre.toLowerCase()}.\n\nIn order to process this request properly, I would be grateful if you could provide the following additional information:\n- [Please specify your questions]\n\nI look forward to hearing from you.\n\nYours faithfully,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'confirm', type: 'confirm', label: 'Acknowledge receipt', icon: '\ud83d\udce8', description: 'Confirm receipt of the letter', subject: `Acknowledgement - ${titre}`, body: `Dear Sir or Madam,\n\nI confirm receipt of your letter regarding ${titre.toLowerCase()}, received on [date].\n\nI have noted the information provided.${dateLimite ? ` I will complete the necessary steps before ${dateLimite}.` : ''}\n\nYours faithfully,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'delay', type: 'delay', label: 'Request extension', icon: '\u23f1', description: 'Request additional time', subject: `Extension Request - ${titre}`, body: `Dear Sir or Madam,\n\nI am writing in response to your letter regarding ${titre.toLowerCase()}.\n\nI would like to request an extension to [process this request / make the payment] due to [explain your situation].\n\nI propose [new date or arrangement].\n\nThank you for your understanding.\n\nYours faithfully,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
    );
  } else {
    // Spanish
    templates.push(
      { id: 'accept', type: 'accept', label: 'Aceptar', icon: '✓', description: 'Confirmar la solicitud o aceptar las condiciones', subject: `Aceptación - ${titre}`, body: `Estimados señores,\n\nMe dirijo a ustedes en respuesta a su carta sobre ${titre.toLowerCase()}.\n\nHe tomado nota de la información proporcionada y confirmo mi acuerdo.${montant ? `\n\nProcederé al pago de ${montant} a la mayor brevedad.` : ''}\n\nQuedo a su disposición para cualquier información adicional.\n\nAtentamente,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'refuse', type: 'refuse', label: 'Rechazar', icon: '✕', description: 'Impugnar o rechazar la solicitud', subject: `Impugnación - ${titre}`, body: `Estimados señores,\n\nMe dirijo a ustedes en respuesta a su carta sobre ${titre.toLowerCase()}.\n\nTras un examen detenido, deseo impugnar esta solicitud por las siguientes razones:\n[Por favor, especifique sus razones]\n\nLes ruego que revisen este asunto y me informen de su decisión.\n\nAtentamente,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'info_request', type: 'info_request', label: 'Solicitar información', icon: '?', description: 'Solicitar información adicional', subject: `Solicitud de información - ${titre}`, body: `Estimados señores,\n\nMe dirijo a ustedes en respuesta a su carta sobre ${titre.toLowerCase()}.\n\nPara poder tramitar correctamente esta solicitud, les agradecería que me proporcionaran la siguiente información adicional:\n- [Por favor, especifique sus preguntas]\n\nQuedo a la espera de su respuesta.\n\nAtentamente,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'confirm', type: 'confirm', label: 'Acusar recibo', icon: '\ud83d\udce8', description: 'Confirmar la recepción de la carta', subject: `Acuse de recibo - ${titre}`, body: `Estimados señores,\n\nLes confirmo la recepción de su carta sobre ${titre.toLowerCase()}, recibida el [fecha].\n\nHe tomado nota de la información proporcionada.${dateLimite ? ` Me comprometo a realizar los trámites necesarios antes del ${dateLimite}.` : ''}\n\nAtentamente,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
      { id: 'delay', type: 'delay', label: 'Solicitar prórroga', icon: '\u23f1', description: 'Solicitar tiempo adicional', subject: `Solicitud de prórroga - ${titre}`, body: `Estimados señores,\n\nMe dirijo a ustedes en respuesta a su carta sobre ${titre.toLowerCase()}.\n\nMe permito solicitar una prórroga para [tramitar esta solicitud / efectuar el pago] debido a [explique su situación].\n\nLes propongo [nueva fecha o acuerdo].\n\nLes agradezco su comprensión.\n\nAtentamente,\n${userInfo.prenom} ${userInfo.nom}${userInfo.adresse ? `\n${userInfo.adresse}` : ''}` },
    );
  }

  return templates;
}
