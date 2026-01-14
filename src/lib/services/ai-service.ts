import { Document, UrgenceLevel, DocumentCategory } from '../types';

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
}

interface GeneratedResponse {
  objet: string;
  corps: string;
  signature: string;
}

const SYSTEM_PROMPT_ANALYSE = `Tu es MonAdmin, un assistant administratif bienveillant pour seniors français.
Tu analyses des documents administratifs et les expliques simplement.

Règles importantes:
- Parle simplement, comme à un ami
- Maximum 3 phrases pour expliquer
- Utilise des mots du quotidien (pas de jargon administratif)
- Sois rassurant, jamais alarmiste
- Indique toujours l'action concrète à faire

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "type": "Facture|Courrier|Convocation|Attestation|Information|Relevé|Contrat|Autre",
  "organisme": "Nom de l'organisme (EDF, Mutuelle, Banque...)",
  "titre": "Titre court du document",
  "categorie": "sante|energie|pension|banque|tous",
  "urgence": "vert|orange|rouge",
  "urgenceLabel": "Pas urgent|Cette semaine|Urgent",
  "montant": "Montant si applicable ou null",
  "dateLimite": "Date limite si applicable ou null",
  "explication": "Explication simple en 2-3 phrases",
  "action": "Ce que la personne doit faire concrètement"
}

Critères d'urgence:
- vert: Information, rien à faire, à conserver
- orange: Action requise cette semaine ou dans les 15 jours
- rouge: Urgent, action immédiate requise, date limite proche (< 7 jours)`;

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

export async function analyzeDocumentWithAI(
  imageBase64: string,
  imageUri: string
): Promise<AnalysisResult> {
  // Try Anthropic first, then OpenAI
  if (ANTHROPIC_API_KEY) {
    return analyzeWithClaude(imageBase64);
  } else if (OPENAI_API_KEY) {
    return analyzeWithOpenAI(imageBase64);
  } else {
    // Fallback to mock analysis
    return mockAnalysis();
  }
}

async function analyzeWithClaude(imageBase64: string): Promise<AnalysisResult> {
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
        max_tokens: 1024,
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
                text: 'Analyse ce document administratif français et fournis les informations demandées.',
              },
            ],
          },
        ],
        system: SYSTEM_PROMPT_ANALYSE,
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
    return mockAnalysis();
  }
}

async function analyzeWithOpenAI(imageBase64: string): Promise<AnalysisResult> {
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
            content: SYSTEM_PROMPT_ANALYSE,
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
                text: 'Analyse ce document administratif français et fournis les informations demandées.',
              },
            ],
          },
        ],
        max_tokens: 1024,
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
    return mockAnalysis();
  }
}

function mockAnalysis(): AnalysisResult {
  // Réponse simulée pour le développement
  const mockTypes = [
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
    },
  ];
  
  return mockTypes[Math.floor(Math.random() * mockTypes.length)];
}

export async function generateResponseWithAI(
  document: Document,
  userInfo: { prenom: string; nom: string; adresse: string }
): Promise<GeneratedResponse> {
  const prompt = `Contexte du document:
- Type: ${document.type}
- Organisme: ${document.organisme}
- Titre: ${document.titre}
- Action demandée: ${document.action}
${document.montant ? `- Montant: ${document.montant}` : ''}
${document.dateLimite ? `- Date limite: ${document.dateLimite}` : ''}

Informations de l'utilisateur:
- Nom: ${userInfo.prenom} ${userInfo.nom}
- Adresse: ${userInfo.adresse}

Rédige une lettre de réponse appropriée.`;

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
          system: SYSTEM_PROMPT_REPONSE,
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

  // Fallback response
  return {
    objet: `Réponse à votre courrier - ${document.titre}`,
    corps: `Madame, Monsieur,

Je fais suite à votre courrier concernant ${document.titre.toLowerCase()}.

${document.action.includes('Payer') 
  ? `Je vous informe que je procéderai au règlement dans les délais impartis.`
  : `J'ai bien pris note des informations communiquées.`}

Je reste à votre disposition pour tout renseignement complémentaire.`,
    signature: `Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${userInfo.prenom} ${userInfo.nom}`,
  };
}

export async function processVoiceCommand(
  transcription: string,
  context: { documentsCount: number; currentPage: string }
): Promise<{
  intention: string;
  reponse: string;
  action?: { type: string; cible?: string };
}> {
  const text = transcription.toLowerCase().trim();
  
  // Commandes simples basées sur des patterns
  if (text.includes('scanner') || text.includes('photo') || text.includes('prendre')) {
    return {
      intention: 'scanner',
      reponse: "D'accord, je vous emmène au scanner.",
      action: { type: 'navigation', cible: 'scanner' },
    };
  }
  
  if ((text.includes('lis') || text.includes('lire')) && 
      (text.includes('dernier') || text.includes('récent') || text.includes('nouveau'))) {
    return {
      intention: 'lire_dernier',
      reponse: 'Je vais vous lire votre dernier courrier.',
      action: { type: 'lire_document', cible: 'dernier' },
    };
  }
  
  if (text.includes('où') || text.includes('trouve') || text.includes('cherche')) {
    return {
      intention: 'rechercher',
      reponse: 'Je recherche dans vos documents...',
      action: { type: 'recherche' },
    };
  }
  
  if (text.includes('faire') || text.includes('attente') || text.includes('urgent') || text.includes('semaine')) {
    return {
      intention: 'actions_attente',
      reponse: `Vous avez ${context.documentsCount} documents à traiter.`,
      action: { type: 'lister_actions' },
    };
  }
  
  if (text.includes('aide') || text.includes('comment')) {
    return {
      intention: 'aide',
      reponse: "Je peux scanner vos courriers, vous les expliquer et vous aider à répondre. Dites par exemple : scanner un courrier, ou lis-moi mon dernier courrier.",
    };
  }
  
  if (text.includes('appel') || text.includes('téléphone') || text.includes('famille')) {
    return {
      intention: 'appeler',
      reponse: 'Je prépare un appel vers votre aidant.',
      action: { type: 'appeler', cible: 'aidant' },
    };
  }
  
  if (text.includes('bonjour') || text.includes('salut') || text.includes('coucou')) {
    return {
      intention: 'salutation',
      reponse: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    };
  }
  
  // Par défaut
  return {
    intention: 'incompris',
    reponse: "Je n'ai pas bien compris. Vous pouvez me demander de scanner un courrier, de lire vos documents ou de chercher une facture.",
  };
}
