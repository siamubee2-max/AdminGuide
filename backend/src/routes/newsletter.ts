import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";

const newsletterRouter = new Hono();

// ─── Types ──────────────────────────────────────────────────────────────────

interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  created_at: string;
  unsubscribed_at?: string | null;
  resubscribed_at?: string | null;
}

// In-memory fallback when Supabase is not configured
const memorySubscribers = new Map<string, NewsletterSubscriber>();

// ─── Storage Helpers ────────────────────────────────────────────────────────

async function getSubscriberByEmail(
  email: string
): Promise<NewsletterSubscriber | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", email)
      .single();
    if (error || !data) return null;
    return data as NewsletterSubscriber;
  }
  return memorySubscribers.get(email) || null;
}

async function upsertSubscriber(
  subscriber: NewsletterSubscriber
): Promise<NewsletterSubscriber> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert(subscriber, { onConflict: "email" })
      .select()
      .single();
    if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    return data as NewsletterSubscriber;
  }
  memorySubscribers.set(subscriber.email, subscriber);
  return subscriber;
}

async function getAllSubscribers(): Promise<NewsletterSubscriber[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase select error: ${error.message}`);
    return (data || []) as NewsletterSubscriber[];
  }
  return Array.from(memorySubscribers.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/newsletter/subscribe
 */
newsletterRouter.post("/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, source } = body;

    if (!email || !email.includes("@")) {
      return c.json({ error: "Invalid email" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await getSubscriberByEmail(normalizedEmail);
    if (existing) {
      if (existing.unsubscribed_at) {
        existing.unsubscribed_at = null;
        existing.resubscribed_at = new Date().toISOString();
        await upsertSubscriber(existing);
        console.log(`[Newsletter] Re-subscribed: ${normalizedEmail}`);
        return c.json({
          success: true,
          message: "Bon retour ! Vous êtes à nouveau inscrit.",
        });
      }
      return c.json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter.",
      });
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscriber = await upsertSubscriber({
      id,
      email: normalizedEmail,
      name: name || undefined,
      source: source || "app",
      created_at: new Date().toISOString(),
    });

    console.log(
      `[Newsletter] New subscriber: ${normalizedEmail} (source: ${source || "app"})`
    );

    return c.json({
      success: true,
      message: "Bienvenue ! Vous recevrez nos conseils chaque semaine.",
      subscriber: { id: subscriber.id, email: subscriber.email },
    });
  } catch (error) {
    console.error("[Newsletter] Subscribe error:", error);
    return c.json({ error: "Failed to subscribe" }, 500);
  }
});

/**
 * POST /api/newsletter/unsubscribe
 */
newsletterRouter.post("/unsubscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await getSubscriberByEmail(normalizedEmail);

    if (!subscriber) {
      return c.json({ error: "Subscriber not found" }, 404);
    }

    subscriber.unsubscribed_at = new Date().toISOString();
    await upsertSubscriber(subscriber);

    console.log(`[Newsletter] Unsubscribed: ${normalizedEmail}`);

    return c.json({
      success: true,
      message: "Vous avez été désinscrit avec succès.",
    });
  } catch (error) {
    console.error("[Newsletter] Unsubscribe error:", error);
    return c.json({ error: "Failed to unsubscribe" }, 500);
  }
});

/**
 * GET /api/newsletter/stats
 */
newsletterRouter.get("/stats", async (c) => {
  try {
    const allSubscribers = await getAllSubscribers();
    const activeSubscribers = allSubscribers.filter(
      (s) => !s.unsubscribed_at
    );

    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const newThisMonth = activeSubscribers.filter(
      (s) => new Date(s.created_at).getTime() >= oneMonthAgo
    ).length;
    const newThisWeek = activeSubscribers.filter(
      (s) => new Date(s.created_at).getTime() >= oneWeekAgo
    ).length;

    const bySource = activeSubscribers.reduce(
      (acc, s) => {
        acc[s.source] = (acc[s.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return c.json({
      success: true,
      stats: {
        totalSubscribers: activeSubscribers.length,
        totalUnsubscribed: allSubscribers.filter((s) => s.unsubscribed_at)
          .length,
        newThisMonth,
        newThisWeek,
        bySource,
        growthRate:
          activeSubscribers.length > 0
            ? ((newThisMonth / activeSubscribers.length) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("[Newsletter] Stats error:", error);
    return c.json({ error: "Failed to get stats" }, 500);
  }
});

/**
 * GET /api/newsletter/subscribers
 */
newsletterRouter.get("/subscribers", async (c) => {
  try {
    const allSubscribers = await getAllSubscribers();

    return c.json({
      success: true,
      count: allSubscribers.length,
      subscribers: allSubscribers.map((s) => ({
        id: s.id,
        email: s.email,
        name: s.name,
        source: s.source,
        createdAt: s.created_at,
        status: s.unsubscribed_at ? "unsubscribed" : "active",
      })),
    });
  } catch (error) {
    console.error("[Newsletter] Subscribers error:", error);
    return c.json({ error: "Failed to get subscribers" }, 500);
  }
});

export { newsletterRouter };
