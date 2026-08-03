export interface NewsletterConfig {
  provider: "beehiiv" | "convertkit" | "mailchimp" | "resend";
  apiKey: string;
  listId?: string; // Mailchimp Audience ID or Beehiiv Publication ID
  formId?: string; // ConvertKit Form ID
}

export async function subscribeToNewsletter(email: string, config: NewsletterConfig): Promise<{ success: boolean; message: string }> {
  const { provider, apiKey, listId, formId } = config;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Invalid email address format." };
  }

  try {
    switch (provider) {
      case "resend": {
        // Resend API subscription handler
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: "newsletter@ravi-intelligence.com",
            to: email,
            subject: "Welcome to Ravi Intelligence Newsletter!",
            html: "<p>Thank you for subscribing to weekly analytics, AI prompts, and Excel resources.</p>",
          }),
        });
        return { success: res.ok, message: res.ok ? "Successfully subscribed via Resend." : "Subscription API failed." };
      }

      case "beehiiv": {
        // Beehiiv API v2 subscription handler
        const res = await fetch(`https://api.beehiiv.com/v2/publications/${listId}/subscriptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ email, reactivate_existing: true }),
        });
        return { success: res.ok, message: res.ok ? "Successfully subscribed via Beehiiv." : "Beehiiv subscription failed." };
      }

      case "convertkit": {
        // ConvertKit API v3 subscriber handler
        const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ api_key: apiKey, email }),
        });
        return { success: res.ok, message: res.ok ? "Successfully subscribed via ConvertKit." : "ConvertKit subscription failed." };
      }

      case "mailchimp": {
        // Mailchimp Marketing API handler (datacenter parsed from key)
        const datacenter = apiKey.split("-")[1] || "us1";
        const res = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `apikey ${apiKey}`,
          },
          body: JSON.stringify({ email_address: email, status: "subscribed" }),
        });
        return { success: res.ok, message: res.ok ? "Successfully subscribed via Mailchimp." : "Mailchimp subscription failed." };
      }

      default:
        return { success: false, message: "Newsletter provider configuration unsupported." };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Newsletter subscription network exception." };
  }
}
