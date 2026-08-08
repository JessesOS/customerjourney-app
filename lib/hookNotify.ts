/**
 * Fail-loud channel for the GHL webhook endpoints. Provisioning fires roughly
 * monthly, so every fire — success or failure — posts to Slack (Jesse's DM,
 * same webhook the brain's notify path uses, stored as the Worker secret
 * PORTAL_SLACK_WEBHOOK).
 *
 * A notify failure must never fail the provisioning itself: the client is
 * already created and GHL would retry a 5xx into a duplicate-looking replay.
 * Returns "sent" | "failed" | "unconfigured" so the response can carry the
 * truth instead of hiding it.
 */
export async function notifyHook(message: string): Promise<"sent" | "failed" | "unconfigured"> {
  const webhook = process.env.PORTAL_SLACK_WEBHOOK;
  if (!webhook) {
    console.error("PORTAL_SLACK_WEBHOOK is not set — hook event not notified:", message);
    return "unconfigured";
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      console.error(`Slack notify failed (${res.status}):`, message);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Slack notify threw:", error, "message:", message);
    return "failed";
  }
}
