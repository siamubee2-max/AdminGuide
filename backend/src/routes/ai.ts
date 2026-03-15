import { Hono } from "hono";

const aiRouter = new Hono();

// API keys are server-side only — never exposed to the client
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ─── System Prompts ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT_ANALYSE_FR = `Tu es MonAdmin, un assistant administratif bienveillant.
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

function getSystemPromptAnalyse(language: string): string {
  if (language === "fr") return SYSTEM_PROMPT_ANALYSE_FR;

  const langName =
    language === "en" ? "English" : language === "es" ? "Spanish" : "French";

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

const SYSTEM_PROMPT_REPONSE_FR = `Tu es MonAdmin, un assistant qui aide les seniors à rédiger des réponses aux courriers administratifs.
Rédige une lettre de réponse formelle mais accessible.
Le ton doit être poli et professionnel.
Utilise un langage simple que tout le monde peut comprendre.

Réponds en JSON avec cette structure:
{
  "objet": "Objet de la lettre",
  "corps": "Corps de la lettre avec paragraphes",
  "signature": "Formule de politesse"
}`;

function getSystemPromptReponse(language: string): string {
  if (language === "fr") return SYSTEM_PROMPT_REPONSE_FR;

  const langName =
    language === "en" ? "English" : language === "es" ? "Spanish" : "French";

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

// ─── Analyze Document Endpoint ──────────────────────────────────────────────

aiRouter.post("/analyze", async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, language = "fr" } = body;

    if (!imageBase64) {
      return c.json({ error: "imageBase64 is required" }, 400);
    }

    // Try Anthropic first, then OpenAI
    if (ANTHROPIC_API_KEY) {
      const result = await analyzeWithClaude(imageBase64, language);
      return c.json({ success: true, result });
    } else if (OPENAI_API_KEY) {
      const result = await analyzeWithOpenAI(imageBase64, language);
      return c.json({ success: true, result });
    } else {
      console.error("[AI] No AI API key configured");
      return c.json({ error: "AI service not configured" }, 503);
    }
  } catch (error) {
    console.error("[AI] Analyze error:", error);
    return c.json({ error: "Analysis failed" }, 500);
  }
});

// ─── Generate Response Endpoint ─────────────────────────────────────────────

aiRouter.post("/generate-response", async (c) => {
  try {
    const body = await c.req.json();
    const { document, userInfo, language = "fr" } = body;

    if (!document || !userInfo) {
      return c.json({ error: "document and userInfo are required" }, 400);
    }

    const prompt =
      language === "fr"
        ? `Contexte du document:
- Type: ${document.type}
- Organisme: ${document.organisme}
- Titre: ${document.titre}
- Action demandée: ${document.action}
${document.montant ? `- Montant: ${document.montant}` : ""}
${document.dateLimite ? `- Date limite: ${document.dateLimite}` : ""}

Informations de l'utilisateur:
- Nom: ${userInfo.prenom} ${userInfo.nom}
- Adresse: ${userInfo.adresse}

Rédige une lettre de réponse appropriée.`
        : `Document context:
- Type: ${document.type}
- Organization: ${document.organisme}
- Title: ${document.titre}
- Required action: ${document.action}
${document.montant ? `- Amount: ${document.montant}` : ""}
${document.dateLimite ? `- Deadline: ${document.dateLimite}` : ""}

User information:
- Name: ${userInfo.prenom} ${userInfo.nom}
- Address: ${userInfo.adresse}

Write an appropriate response letter.`;

    if (ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: getSystemPromptReponse(language),
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content: Array<{ text: string }> };
        const content = data.content[0]?.text || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return c.json({ success: true, result: JSON.parse(jsonMatch[0]) });
        }
      }
    }

    return c.json({ error: "Response generation failed" }, 500);
  } catch (error) {
    console.error("[AI] Generate response error:", error);
    return c.json({ error: "Response generation failed" }, 500);
  }
});

// ─── Speech-to-Text Endpoint ────────────────────────────────────────────────

aiRouter.post("/speech-to-text", async (c) => {
  try {
    const body = await c.req.json();
    const { audioBase64, language = "fr" } = body;

    if (!audioBase64) {
      return c.json({ error: "audioBase64 is required" }, 400);
    }

    if (!OPENAI_API_KEY) {
      return c.json({ error: "Speech-to-text service not configured" }, 503);
    }

    // Decode base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: "audio/m4a" });
    formData.append("file", audioBlob, "audio.m4a");
    formData.append("model", "whisper-1");
    formData.append("language", language);

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Whisper API error:", response.status, errorText);
      return c.json({ error: "Transcription failed" }, 500);
    }

    const data = await response.json() as { text: string };
    return c.json({ success: true, transcription: data.text });
  } catch (error) {
    console.error("[AI] Speech-to-text error:", error);
    return c.json({ error: "Transcription failed" }, 500);
  }
});

// ─── Text-to-Speech Endpoint ────────────────────────────────────────────────

aiRouter.post("/text-to-speech", async (c) => {
  try {
    const body = await c.req.json();
    const { text, language = "fr" } = body;

    if (!text) {
      return c.json({ error: "text is required" }, 400);
    }

    if (!OPENAI_API_KEY) {
      return c.json({ error: "Text-to-speech service not configured" }, 503);
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "nova", // Warm, friendly voice suitable for seniors
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] TTS API error:", response.status, errorText);
      return c.json({ error: "Text-to-speech failed" }, 500);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return c.json({ success: true, audioBase64: base64Audio });
  } catch (error) {
    console.error("[AI] Text-to-speech error:", error);
    return c.json({ error: "Text-to-speech failed" }, 500);
  }
});

// ─── Helper Functions ───────────────────────────────────────────────────────

async function analyzeWithClaude(
  imageBase64: string,
  language: string
): Promise<Record<string, unknown>> {
  const userPrompt =
    language === "fr"
      ? "Analyse ce document administratif et fournis les informations demandées. Inclus la transcription complète du texte visible dans le champ contenuBrut."
      : `Analyze this administrative document and provide the requested information. Include the complete transcription of visible text in the contenuBrut field.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
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

  const data = await response.json() as { content: Array<{ text: string }> };
  const content = data.content[0]?.text || "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Invalid response format from Claude");
}

async function analyzeWithOpenAI(
  imageBase64: string,
  language: string
): Promise<Record<string, unknown>> {
  const userPrompt =
    language === "fr"
      ? "Analyse ce document administratif et fournis les informations demandées. Inclus la transcription complète du texte visible dans le champ contenuBrut."
      : `Analyze this administrative document and provide the requested information. Include the complete transcription of visible text in the contenuBrut field.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPromptAnalyse(language),
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
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

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content || "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Invalid response format from OpenAI");
}

export { aiRouter };
