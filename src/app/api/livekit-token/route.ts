import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { roomName, participantName } = await req.json();

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName || "user",
    ttl: "1h",
  });

  token.addGrant({
    room: roomName || "replai-session",
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();
  return NextResponse.json({ token: jwt });
}
