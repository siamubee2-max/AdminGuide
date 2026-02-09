import { Hono } from "hono";

const newsletterRouter = new Hono();

// In-memory store for newsletter subscribers (in production, use a database)
interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  createdAt: number;
  unsubscribedAt?: number;
  resubscribedAt?: number;
}

const subscribers = new Map<string, NewsletterSubscriber>();

/**
 * POST /api/newsletter/subscribe
 * Subscribe to the newsletter
 */
newsletterRouter.post("/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, source } = body;

    if (!email || !email.includes('@')) {
      return c.json({ error: "Invalid email" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = subscribers.get(normalizedEmail);

    if (existing) {
      if (existing.unsubscribedAt) {
        // Re-subscribe
        existing.unsubscribedAt = undefined;
        existing.resubscribedAt = Date.now();
        subscribers.set(normalizedEmail, existing);

        console.log(`[Newsletter] Re-subscribed: ${normalizedEmail}`);
        return c.json({
          success: true,
          message: "Bon retour ! Vous êtes à nouveau inscrit."
        });
      }
      return c.json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter."
      });
    }

    // Create new subscriber
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscriber: NewsletterSubscriber = {
      id,
      email: normalizedEmail,
      name: name || undefined,
      source: source || 'app',
      createdAt: Date.now(),
    };

    subscribers.set(normalizedEmail, subscriber);

    console.log(`[Newsletter] New subscriber: ${normalizedEmail} (source: ${source || 'app'})`);

    // In production, you would:
    // 1. Save to database
    // 2. Add to email marketing platform (Mailchimp, SendGrid, etc.)
    // 3. Send welcome email

    return c.json({
      success: true,
      message: "Bienvenue ! Vous recevrez nos conseils chaque semaine.",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
      },
    });
  } catch (error) {
    console.error("[Newsletter] Subscribe error:", error);
    return c.json({ error: "Failed to subscribe" }, 500);
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from the newsletter
 */
newsletterRouter.post("/unsubscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = subscribers.get(normalizedEmail);

    if (!subscriber) {
      return c.json({ error: "Subscriber not found" }, 404);
    }

    subscriber.unsubscribedAt = Date.now();
    subscribers.set(normalizedEmail, subscriber);

    console.log(`[Newsletter] Unsubscribed: ${normalizedEmail}`);

    return c.json({
      success: true,
      message: "Vous avez été désinscrit avec succès."
    });
  } catch (error) {
    console.error("[Newsletter] Unsubscribe error:", error);
    return c.json({ error: "Failed to unsubscribe" }, 500);
  }
});

/**
 * GET /api/newsletter/stats
 * Get newsletter statistics (admin endpoint)
 */
newsletterRouter.get("/stats", async (c) => {
  try {
    const allSubscribers = Array.from(subscribers.values());
    const activeSubscribers = allSubscribers.filter(s => !s.unsubscribedAt);

    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const newThisMonth = activeSubscribers.filter(s => s.createdAt >= oneMonthAgo).length;
    const newThisWeek = activeSubscribers.filter(s => s.createdAt >= oneWeekAgo).length;

    // Group by source
    const bySource = activeSubscribers.reduce((acc, s) => {
      acc[s.source] = (acc[s.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return c.json({
      success: true,
      stats: {
        totalSubscribers: activeSubscribers.length,
        totalUnsubscribed: allSubscribers.filter(s => s.unsubscribedAt).length,
        newThisMonth,
        newThisWeek,
        bySource,
        growthRate: activeSubscribers.length > 0
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
 * Get all subscribers (admin endpoint - should be protected in production)
 */
newsletterRouter.get("/subscribers", async (c) => {
  const allSubscribers = Array.from(subscribers.values())
    .sort((a, b) => b.createdAt - a.createdAt);

  return c.json({
    success: true,
    count: allSubscribers.length,
    subscribers: allSubscribers.map(s => ({
      id: s.id,
      email: s.email,
      name: s.name,
      source: s.source,
      createdAt: new Date(s.createdAt).toISOString(),
      status: s.unsubscribedAt ? 'unsubscribed' : 'active',
    })),
  });
});

export { newsletterRouter };
