import { Hono } from "hono";

const linkingRouter = new Hono();

// In-memory store for linking codes (in production, use a database)
interface LinkingCode {
  code: string;
  helperName: string;
  helperPhone?: string;
  seniorConfig?: {
    prenom: string;
    avatar: string;
    fontSize: 'normal' | 'large' | 'xlarge';
    notifications: boolean;
    voiceSpeed: number;
  };
  createdAt: number;
  expiresAt: number;
  linkedAt?: number;
  seniorDeviceId?: string;
}

const linkingCodes = new Map<string, LinkingCode>();

// Generate a simple 6-digit code
function generateCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

// Clean up expired codes periodically
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of linkingCodes.entries()) {
    if (data.expiresAt < now) {
      linkingCodes.delete(code);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

/**
 * POST /api/linking/generate
 * Generate a new linking code for the helper
 */
linkingRouter.post("/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { helperName, helperPhone, seniorConfig } = body;

    if (!helperName) {
      return c.json({ error: "helperName is required" }, 400);
    }

    // Generate unique code
    let code: string;
    do {
      code = generateCode();
    } while (linkingCodes.has(code));

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const linkingData: LinkingCode = {
      code,
      helperName,
      helperPhone,
      seniorConfig,
      createdAt: now,
      expiresAt,
    };

    linkingCodes.set(code, linkingData);

    console.log(`[Linking] Generated code ${code} for helper ${helperName}`);

    return c.json({
      success: true,
      code,
      expiresAt,
      expiresIn: "24 heures",
    });
  } catch (error) {
    console.error("[Linking] Error generating code:", error);
    return c.json({ error: "Failed to generate code" }, 500);
  }
});

/**
 * POST /api/linking/update-config
 * Update the senior configuration for a linking code
 */
linkingRouter.post("/update-config", async (c) => {
  try {
    const body = await c.req.json();
    const { code, seniorConfig } = body;

    if (!code) {
      return c.json({ error: "code is required" }, 400);
    }

    const linkingData = linkingCodes.get(code);

    if (!linkingData) {
      return c.json({ error: "Code invalide ou expiré" }, 404);
    }

    if (linkingData.expiresAt < Date.now()) {
      linkingCodes.delete(code);
      return c.json({ error: "Code expiré" }, 410);
    }

    // Update the configuration
    linkingData.seniorConfig = seniorConfig;
    linkingCodes.set(code, linkingData);

    console.log(`[Linking] Updated config for code ${code}`);

    return c.json({
      success: true,
      message: "Configuration mise à jour",
    });
  } catch (error) {
    console.error("[Linking] Error updating config:", error);
    return c.json({ error: "Failed to update config" }, 500);
  }
});

/**
 * POST /api/linking/validate
 * Validate a linking code and get the configuration (for senior)
 */
linkingRouter.post("/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { code, seniorDeviceId } = body;

    if (!code) {
      return c.json({ error: "code is required" }, 400);
    }

    const linkingData = linkingCodes.get(code);

    if (!linkingData) {
      return c.json({ error: "Code invalide" }, 404);
    }

    if (linkingData.expiresAt < Date.now()) {
      linkingCodes.delete(code);
      return c.json({ error: "Code expiré" }, 410);
    }

    // Mark as linked
    linkingData.linkedAt = Date.now();
    linkingData.seniorDeviceId = seniorDeviceId;
    linkingCodes.set(code, linkingData);

    console.log(`[Linking] Code ${code} validated by senior device ${seniorDeviceId}`);

    return c.json({
      success: true,
      helperName: linkingData.helperName,
      helperPhone: linkingData.helperPhone,
      seniorConfig: linkingData.seniorConfig,
    });
  } catch (error) {
    console.error("[Linking] Error validating code:", error);
    return c.json({ error: "Failed to validate code" }, 500);
  }
});

/**
 * GET /api/linking/status/:code
 * Check the status of a linking code (for helper to see if senior has linked)
 */
linkingRouter.get("/status/:code", async (c) => {
  try {
    const code = c.req.param("code");

    const linkingData = linkingCodes.get(code);

    if (!linkingData) {
      return c.json({ error: "Code invalide" }, 404);
    }

    if (linkingData.expiresAt < Date.now()) {
      linkingCodes.delete(code);
      return c.json({ error: "Code expiré" }, 410);
    }

    return c.json({
      success: true,
      code,
      helperName: linkingData.helperName,
      isLinked: !!linkingData.linkedAt,
      linkedAt: linkingData.linkedAt,
      expiresAt: linkingData.expiresAt,
      seniorConfig: linkingData.seniorConfig,
    });
  } catch (error) {
    console.error("[Linking] Error checking status:", error);
    return c.json({ error: "Failed to check status" }, 500);
  }
});

export { linkingRouter };
