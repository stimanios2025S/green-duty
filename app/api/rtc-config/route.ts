import { NextResponse } from "next/server";

/**
 * GET /api/rtc-config → ICE servers for WebRTC calls.
 * Uses free community TURN (Open Relay Project) by default so calls connect
 * from DIFFERENT NETWORKS. If TURN_URL / TURN_USERNAME / TURN_CREDENTIAL
 * env vars are set (e.g. a production TURN provider), those are used instead
 * for reliable cross-network calling.
 */
export async function GET() {
  const iceServers: { urls: string | string[]; username?: string; credential?: string }[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
  ];

  const turnUrl = process.env.TURN_URL;
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
  } else {
    // Free community relays — best-effort, no credentials
    iceServers.push(
      { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    );
  }

  return NextResponse.json({ iceServers, iceCandidatePoolSize: 10 });
}
