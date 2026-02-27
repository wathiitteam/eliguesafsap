import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:admin@quartierfc.local",
  vapidPublicKey,
  vapidPrivateKey
);

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, title, message, url } = body;

  if (!userId || !title || !message) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const { data: subs } = await adminClient
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const sub of subs) {
    const payload = JSON.stringify({
      title,
      body: message,
      data: { url: url || process.env.NEXT_PUBLIC_SITE_URL || "/" },
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
      sent += 1;
    } catch (err) {
      console.error("Error sending push", err);
    }
  }

  return NextResponse.json({ sent });
}

