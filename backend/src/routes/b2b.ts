import { Hono } from "hono";

const b2bRouter = new Hono();

// In-memory store for B2B leads (in production, use a database)
interface B2BLead {
  id: string;
  structure: string;
  name: string;
  email: string;
  phone?: string;
  residents?: string;
  message?: string;
  createdAt: number;
  status: 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'lost';
}

const leads = new Map<string, B2BLead>();

/**
 * POST /api/b2b/contact
 * Submit a contact request for MonAdmin Pro
 */
b2bRouter.post("/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { structure, name, email, phone, residents, message } = body;

    if (!structure || !name || !email) {
      return c.json({ error: "structure, name, and email are required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const lead: B2BLead = {
      id,
      structure,
      name,
      email,
      phone,
      residents,
      message,
      createdAt: Date.now(),
      status: 'new',
    };

    leads.set(id, lead);

    console.log(`[B2B] New lead received:`, {
      id,
      structure,
      name,
      email,
      residents,
    });

    // In production, you would:
    // 1. Save to database
    // 2. Send notification email to sales team
    // 3. Send confirmation email to prospect
    // 4. Add to CRM (HubSpot, Salesforce, etc.)

    return c.json({
      success: true,
      message: "Votre demande a été envoyée. Notre équipe vous contactera sous 24h.",
      leadId: id,
    });
  } catch (error) {
    console.error("[B2B] Error processing contact:", error);
    return c.json({ error: "Failed to process contact request" }, 500);
  }
});

/**
 * GET /api/b2b/leads
 * Get all leads (admin endpoint - should be protected in production)
 */
b2bRouter.get("/leads", async (c) => {
  const allLeads = Array.from(leads.values()).sort((a, b) => b.createdAt - a.createdAt);

  return c.json({
    success: true,
    count: allLeads.length,
    leads: allLeads,
  });
});

/**
 * PATCH /api/b2b/leads/:id
 * Update lead status (admin endpoint)
 */
b2bRouter.patch("/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;

    const lead = leads.get(id);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    if (status) {
      lead.status = status;
      leads.set(id, lead);
    }

    return c.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("[B2B] Error updating lead:", error);
    return c.json({ error: "Failed to update lead" }, 500);
  }
});

/**
 * GET /api/b2b/pricing
 * Get current pricing plans
 */
b2bRouter.get("/pricing", async (c) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      currency: 'EUR',
      interval: 'month',
      maxResidents: 20,
      features: [
        'Scan illimité de courriers',
        'Analyse IA des documents',
        'Alertes échéances',
        'Support email',
        '1 compte gestionnaire',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      currency: 'EUR',
      interval: 'month',
      maxResidents: 50,
      features: [
        'Tout Starter +',
        'Dashboard multi-résidents',
        'Notifications familles',
        'Export rapports PDF',
        '3 comptes gestionnaires',
        'Support prioritaire',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      currency: 'EUR',
      interval: 'month',
      maxResidents: 150,
      features: [
        'Tout Pro +',
        'Multi-établissements',
        'API & intégrations',
        'Formation sur site',
        'Gestionnaires illimités',
        'Account manager dédié',
        'SLA garanti 99.9%',
      ],
    },
  ];

  return c.json({
    success: true,
    plans,
    customPricing: {
      available: true,
      minResidents: 150,
      contactEmail: 'pro@monadmin.fr',
    },
  });
});

export { b2bRouter };
