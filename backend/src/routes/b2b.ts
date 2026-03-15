import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";

const b2bRouter = new Hono();

// ─── Types ──────────────────────────────────────────────────────────────────

interface B2BLead {
  id: string;
  structure: string;
  name: string;
  email: string;
  phone?: string;
  residents?: string;
  message?: string;
  created_at: string;
  status: "new" | "contacted" | "demo_scheduled" | "converted" | "lost";
}

// In-memory fallback when Supabase is not configured
const memoryLeads = new Map<string, B2BLead>();

// ─── Storage Helpers ────────────────────────────────────────────────────────

async function createLead(lead: B2BLead): Promise<B2BLead> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2b_leads")
      .insert(lead)
      .select()
      .single();
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    return data as B2BLead;
  }
  memoryLeads.set(lead.id, lead);
  return lead;
}

async function getAllLeads(): Promise<B2BLead[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2b_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase select error: ${error.message}`);
    return (data || []) as B2BLead[];
  }
  return Array.from(memoryLeads.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function getLeadById(id: string): Promise<B2BLead | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2b_leads")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as B2BLead;
  }
  return memoryLeads.get(id) || null;
}

async function updateLeadStatus(
  id: string,
  status: B2BLead["status"]
): Promise<B2BLead | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2b_leads")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return data as B2BLead;
  }
  const lead = memoryLeads.get(id);
  if (!lead) return null;
  lead.status = status;
  memoryLeads.set(id, lead);
  return lead;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const lead = await createLead({
      id,
      structure,
      name,
      email,
      phone,
      residents,
      message,
      created_at: new Date().toISOString(),
      status: "new",
    });

    console.log(`[B2B] New lead received:`, {
      id: lead.id,
      structure,
      name,
      email,
      residents,
    });

    return c.json({
      success: true,
      message:
        "Votre demande a été envoyée. Notre équipe vous contactera sous 24h.",
      leadId: lead.id,
    });
  } catch (error) {
    console.error("[B2B] Error processing contact:", error);
    return c.json({ error: "Failed to process contact request" }, 500);
  }
});

/**
 * GET /api/b2b/leads
 * Get all leads (admin endpoint)
 */
b2bRouter.get("/leads", async (c) => {
  try {
    const allLeads = await getAllLeads();
    return c.json({
      success: true,
      count: allLeads.length,
      leads: allLeads,
    });
  } catch (error) {
    console.error("[B2B] Error fetching leads:", error);
    return c.json({ error: "Failed to fetch leads" }, 500);
  }
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

    const validStatuses = [
      "new",
      "contacted",
      "demo_scheduled",
      "converted",
      "lost",
    ];
    if (status && !validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const lead = await updateLeadStatus(id, status);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    return c.json({ success: true, lead });
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
      id: "starter",
      name: "Starter",
      price: 49,
      currency: "EUR",
      interval: "month",
      maxResidents: 20,
      features: [
        "Scan illimité de courriers",
        "Analyse IA des documents",
        "Alertes échéances",
        "Support email",
        "1 compte gestionnaire",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      currency: "EUR",
      interval: "month",
      maxResidents: 50,
      features: [
        "Tout Starter +",
        "Dashboard multi-résidents",
        "Notifications familles",
        "Export rapports PDF",
        "3 comptes gestionnaires",
        "Support prioritaire",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      currency: "EUR",
      interval: "month",
      maxResidents: 150,
      features: [
        "Tout Pro +",
        "Multi-établissements",
        "API & intégrations",
        "Formation sur site",
        "Gestionnaires illimités",
        "Account manager dédié",
        "SLA garanti 99.9%",
      ],
    },
  ];

  return c.json({
    success: true,
    plans,
    customPricing: {
      available: true,
      minResidents: 150,
      contactEmail: "pro@monadmin.fr",
    },
  });
});

export { b2bRouter };
