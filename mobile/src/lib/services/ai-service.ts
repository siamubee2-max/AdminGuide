import { Document, UrgenceLevel, DocumentCategory } from '../types';
import type { Language } from '../i18n/translations';
import { getLanguageName } from '../i18n';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

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

const SYSTEM_PROMPT_ANALYSE = `Tu es MonAdmin, un assistant administratif bienveillant.
Tu analyses des documents administratifs et les expliques simplement.

Règles importantes:
- Parle simplement, comme à un ami
- Maximum 3 phrases pour expliquer
- Utilise des mots du quotidien (pas de jargon administratif)
- Sois rassurant, jamais alarmiste
- Indique toujours l'action concrète à faire

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "type": "Facture|Courrier|Convocation|Attestation|Information|Relevé|Contrat|Avis d'imposition|Mise en demeure|Autre",
  "organisme": "Nom de l'organisme (EDF, Mutuelle, Banque, Impôts, Assurance...)",
  "titre": "Titre court du document",
  "categorie": "sante|energie|pension|banque|impots|assurance|juridique|medical|tous",
  "urgence": "vert|orange|rouge",
  "urgenceLabel": "Pas urgent|Cette semaine|Urgent",
  "montant": "Montant si applicable ou null",
  "dateLimite": "Date limite si applicable ou null",
  "explication": "Explication simple en 2-3 phrases",
  "action": "Ce que la personne doit faire concrètement",
  "contenuBrut": "Transcription complète et fidèle du texte visible sur le document, mot pour mot, en conservant la structure (paragraphes, sauts de ligne). Ne résume pas, recopie tout le texte."
}

Catégories disponibles:
- sante: Sécurité sociale, mutuelles, remboursements soins
- energie: EDF, Engie, eau, gaz, électricité
- pension: Retraite, caisses de pension
- banque: Banques, relevés, crédits
- impots: Impôts, taxes, avis d'imposition, DGFIP, Trésor Public
- assurance: Assurance habitation, auto, vie, contrats d'assurance
- juridique: Huissiers, tribunaux, avocats, mises en demeure, convocations judiciaires
- medical: Convocations médicales, rendez-vous médecins, hôpitaux, examens
- tous: Autre type de document

Critères d'urgence:
- vert: Information, rien à faire, à conserver
- orange: Action requise cette semaine ou dans les 15 jours
- rouge: Urgent, action immédiate requise, date limite proche (< 7 jours), huissier, mise en demeure`;

function getSystemPromptAnalyse(language: Language): string {
  const langName = getLanguageName(language);

  if (language === 'fr') {
    return SYSTEM_PROMPT_ANALYSE;
  }

  return `You are MonAdmin, a friendly administrative assistant.
You analyze administrative documents and explain them simply.

IMPORTANT: You MUST respond in ${langName}. All text fields (titre, explication, action, urgenceLabel, type) MUST be in ${langName}.

Important rules:
- Speak simply, like to a friend
- Maximum 3 sentences to explain
- Use everyday words (no administrative jargon)
- Be reassuring, never alarmist
- Always indicate the concrete action to take

Respond ONLY in valid JSON with this exact structure:
{
  "type": "Invoice|Letter|Summons|Certificate|Information|Statement|Contract|Tax Notice|Formal Notice|Other",
  "organisme": "Name of the organization",
  "titre": "Short title of the document in ${langName}",
  "categorie": "sante|energie|pension|banque|impots|assurance|juridique|medical|tous",
  "urgence": "vert|orange|rouge",
  "urgenceLabel": "Not urgent|This week|Urgent (translate to ${langName})",
  "montant": "Amount if applicable or null",
  "dateLimite": "Deadline if applicable or null",
  "explication": "Simple explanation in 2-3 sentences in ${langName}",
  "action": "What the person should do concretely in ${langName}",
  "contenuBrut": "Complete and faithful transcription of the visible text on the document, word for word, keeping the structure."
}

Available categories:
- sante: Social security, health insurance, medical reimbursements
- energie: Electricity, water, gas utilities
- pension: Retirement, pension funds
- banque: Banks, statements, loans
- impots: Taxes, tax notices, treasury
- assurance: Home insurance, car insurance, life insurance
- juridique: Bailiffs, courts, lawyers, formal notices, legal summons
- medical: Medical appointments, doctor visits, hospital, examinations
- tous: Other document types

Urgency criteria:
- vert: Information, nothing to do, keep it
- orange: Action required this week or within 15 days
- rouge: Urgent, immediate action required, deadline close (< 7 days), bailiff, formal notice`;
}

const SYSTEM_PROMPT_REPONSE = `Tu es MonAdmin, un assistant qui aide les seniors à rédiger des réponses aux courriers administratifs.
Rédige une lettre de réponse formelle mais accessible.
Le ton doit être poli et professionnel.
Utilise un langage simple que tout le monde peut comprendre.

Réponds en JSON avec cette structure:
{
  "objet": "Objet de la lettre",
  "corps": "Corps de la lettre avec paragraphes",
  "signature": "Formule de politesse"
}`;

function getSystemPromptReponse(language: Language): string {
  const langName = getLanguageName(language);

  if (language === 'fr') {
    return SYSTEM_PROMPT_REPONSE;
  }

  return `You are MonAdmin, an assistant that helps seniors write responses to administrative letters.
Write a formal but accessible response letter.
The tone should be polite and professional.
Use simple language that everyone can understand.

IMPORTANT: Write the entire response in ${langName}.

Respond in JSON with this structure:
{
  "objet": "Subject of the letter in ${langName}",
  "corps": "Body of the letter with paragraphs in ${langName}",
  "signature": "Polite closing formula in ${langName}"
}`;
}

export async function analyzeDocumentWithAI(
  imageBase64: string,
  imageUri: string,
  language: Language = 'fr'
): Promise<AnalysisResult> {
  // Try Anthropic first, then OpenAI
  if (ANTHROPIC_API_KEY) {
    return analyzeWithClaude(imageBase64, language);
  } else if (OPENAI_API_KEY) {
    return analyzeWithOpenAI(imageBase64, language);
  } else {
    // Fallback to mock analysis
    return mockAnalysis(language);
  }
}

async function analyzeWithClaude(imageBase64: string, language: Language): Promise<AnalysisResult> {
  const langName = getLanguageName(language);
  const userPrompt = language === 'fr'
    ? 'Analyse ce document administratif et fournis les informations demandées. Inclus la transcription complète du texte visible dans le champ contenuBrut.'
    : `Analyze this administrative document and provide the requested information in ${langName}. Include the complete transcription of visible text in the contenuBrut field.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        system: getSystemPromptAnalyse(language),
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnalysisResult;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Claude analysis error:', error);
    return mockAnalysis(language);
  }
}

async function analyzeWithOpenAI(imageBase64: string, language: Language): Promise<AnalysisResult> {
  const langName = getLanguageName(language);
  const userPrompt = language === 'fr'
    ? 'Analyse ce document administratif et fournis les informations demandées. Inclus la transcription complète du texte visible dans le champ contenuBrut.'
    : `Analyze this administrative document and provide the requested information in ${langName}. Include the complete transcription of visible text in the contenuBrut field.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: getSystemPromptAnalyse(language),
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnalysisResult;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return mockAnalysis(language);
  }
}

function mockAnalysis(language: Language = 'fr'): AnalysisResult {
  // Mock responses per language
  const mockData: Record<Language, AnalysisResult[]> = {
    fr: [
      {
        type: 'Facture',
        organisme: 'Engie',
        titre: 'Facture de régularisation',
        categorie: 'energie' as DocumentCategory,
        urgence: 'orange' as UrgenceLevel,
        urgenceLabel: 'Cette semaine',
        montant: '89,50€',
        dateLimite: '25 janvier 2026',
        explication: "C'est votre facture de régularisation pour l'électricité. Le montant tient compte de votre consommation réelle. Vous devez payer 89,50€.",
        action: 'Payer 89,50€ avant le 25 janvier par virement ou prélèvement',
        contenuBrut: "ENGIE\nService Clients\n\nFacture de régularisation\nRéférence client : 1234567890\nDate : 10 janvier 2026",
      },
      {
        type: 'Courrier',
        organisme: 'Mutuelle Santé',
        titre: 'Remboursement soins',
        categorie: 'sante' as DocumentCategory,
        urgence: 'vert' as UrgenceLevel,
        urgenceLabel: 'Pas urgent',
        explication: "C'est le récapitulatif de vos remboursements de soins du mois dernier. Tout a été traité correctement.",
        action: 'Rien à faire, à conserver pour vos archives',
        contenuBrut: "MUTUELLE SANTÉ PLUS\nVotre relevé de remboursements\nPériode : Décembre 2025",
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
        montant: '€89.50',
        dateLimite: 'January 25, 2026',
        explication: "This is your electricity adjustment invoice. The amount reflects your actual consumption. You need to pay €89.50.",
        action: 'Pay €89.50 before January 25 by transfer or direct debit',
        contenuBrut: "ENGIE\nCustomer Service\n\nAdjustment Invoice\nClient reference: 1234567890\nDate: January 10, 2026",
      },
      {
        type: 'Letter',
        organisme: 'Health Insurance',
        titre: 'Healthcare Reimbursement',
        categorie: 'sante' as DocumentCategory,
        urgence: 'vert' as UrgenceLevel,
        urgenceLabel: 'Not urgent',
        explication: "This is the summary of your healthcare reimbursements from last month. Everything has been processed correctly.",
        action: 'Nothing to do, keep for your records',
        contenuBrut: "HEALTH INSURANCE PLUS\nYour reimbursement statement\nPeriod: December 2025",
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
        montant: '89,50€',
        dateLimite: '25 de enero de 2026',
        explication: "Esta es su factura de regularización de electricidad. El importe refleja su consumo real. Debe pagar 89,50€.",
        action: 'Pagar 89,50€ antes del 25 de enero por transferencia o domiciliación',
        contenuBrut: "ENGIE\nServicio al Cliente\n\nFactura de regularización\nReferencia cliente: 1234567890\nFecha: 10 de enero de 2026",
      },
      {
        type: 'Carta',
        organisme: 'Mutua de Salud',
        titre: 'Reembolso de atención médica',
        categorie: 'sante' as DocumentCategory,
        urgence: 'vert' as UrgenceLevel,
        urgenceLabel: 'No urgente',
        explication: "Este es el resumen de sus reembolsos de atención médica del mes pasado. Todo se ha procesado correctamente.",
        action: 'Nada que hacer, guardar para sus archivos',
        contenuBrut: "MUTUA DE SALUD PLUS\nSu extracto de reembolsos\nPeríodo: Diciembre 2025",
      },
    ],
  };

  const mocks = mockData[language] || mockData.fr;
  return mocks[Math.floor(Math.random() * mocks.length)];
}

export async function generateResponseWithAI(
  document: Document,
  userInfo: { prenom: string; nom: string; adresse: string },
  language: Language = 'fr'
): Promise<GeneratedResponse> {
  const langName = getLanguageName(language);

  const prompt = language === 'fr'
    ? `Contexte du document:
- Type: ${document.type}
- Organisme: ${document.organisme}
- Titre: ${document.titre}
- Action demandée: ${document.action}
${document.montant ? `- Montant: ${document.montant}` : ''}
${document.dateLimite ? `- Date limite: ${document.dateLimite}` : ''}

Informations de l'utilisateur:
- Nom: ${userInfo.prenom} ${userInfo.nom}
- Adresse: ${userInfo.adresse}

Rédige une lettre de réponse appropriée.`
    : `Document context:
- Type: ${document.type}
- Organization: ${document.organisme}
- Title: ${document.titre}
- Required action: ${document.action}
${document.montant ? `- Amount: ${document.montant}` : ''}
${document.dateLimite ? `- Deadline: ${document.dateLimite}` : ''}

User information:
- Name: ${userInfo.prenom} ${userInfo.nom}
- Address: ${userInfo.adresse}

Write an appropriate response letter in ${langName}.`;

  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: getSystemPromptReponse(language),
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0]?.text || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as GeneratedResponse;
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }
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

  // Patterns by language
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

  // Responses by language
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

  // Check patterns
  if (p.scanner.some((word) => text.includes(word))) {
    return {
      intention: 'scanner',
      reponse: r.scanner,
      action: { type: 'navigation', cible: 'scanner' },
    };
  }

  if (p.read.some((word) => text.includes(word)) && p.recent.some((word) => text.includes(word))) {
    return {
      intention: 'lire_dernier',
      reponse: r.readLast,
      action: { type: 'lire_document', cible: 'dernier' },
    };
  }

  if (p.search.some((word) => text.includes(word))) {
    return {
      intention: 'rechercher',
      reponse: r.search,
      action: { type: 'recherche' },
    };
  }

  if (p.actions.some((word) => text.includes(word))) {
    return {
      intention: 'actions_attente',
      reponse: r.actions(context.documentsCount),
      action: { type: 'lister_actions' },
    };
  }

  if (p.help.some((word) => text.includes(word))) {
    return {
      intention: 'aide',
      reponse: r.help,
    };
  }

  if (p.call.some((word) => text.includes(word))) {
    return {
      intention: 'appeler',
      reponse: r.call,
      action: { type: 'appeler', cible: 'aidant' },
    };
  }

  if (p.greeting.some((word) => text.includes(word))) {
    return {
      intention: 'salutation',
      reponse: r.greeting,
    };
  }

  // Default
  return {
    intention: 'incompris',
    reponse: r.unknown,
  };
}
