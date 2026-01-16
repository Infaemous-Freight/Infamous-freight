const fetchImpl = globalThis.fetch
    ? globalThis.fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

function envBool(v, def = false) {
    if (v == null) return def;
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

async function postJson(url, payload, headers = {}) {
    const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

    try {
        return JSON.parse(text);
    } catch (_err) {
        return text;
    }
}

function notifier() {
    const expoEnabled = envBool(process.env.EXPO_PUSH_ENABLED, true);
    const twilioEnabled = envBool(process.env.TWILIO_ENABLED, false);

    return {
        async pushExpo(expoPushToken, msg) {
            if (!expoEnabled) return { skipped: true, reason: "EXPO_PUSH_DISABLED" };
            if (!expoPushToken) return { skipped: true, reason: "NO_TOKEN" };

            // Minimal token sanity check
            if (
                !expoPushToken.startsWith("ExponentPushToken") &&
                !expoPushToken.startsWith("ExpoPushToken")
            ) {
                return { skipped: true, reason: "INVALID_TOKEN_FORMAT" };
            }

            const message = {
                to: expoPushToken,
                title: msg.title,
                body: msg.body,
                data: msg.data ?? {},
            };

            return postJson("https://exp.host/--/api/v2/push/send", message);
        },

        async sms(to, body) {
            if (!twilioEnabled) return { skipped: true, reason: "TWILIO_DISABLED" };

            const sid = process.env.TWILIO_ACCOUNT_SID;
            const token = process.env.TWILIO_AUTH_TOKEN;
            const from = process.env.TWILIO_FROM_NUMBER;

            if (!sid || !token || !from)
                return { skipped: true, reason: "TWILIO_ENV_MISSING" };
            if (!to) return { skipped: true, reason: "NO_PHONE" };

            const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

            const form = new URLSearchParams();
            form.set("To", to);
            form.set("From", from);
            form.set("Body", body);

            const auth = Buffer.from(`${sid}:${token}`).toString("base64");

            const res = await fetchImpl(url, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: form.toString(),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(`Twilio HTTP ${res.status}: ${text}`);

            try {
                return JSON.parse(text);
            } catch (_err) {
                return text;
            }
        },
    };
}

module.exports = { notifier };
