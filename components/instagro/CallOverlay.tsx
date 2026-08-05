"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useAuth } from "@/lib/auth-context";
import { ApiUser } from "@/lib/instagro-api";

interface Props {
  conversationId: string;
  peer: ApiUser;
  callType: "audio" | "video";
  role: "caller" | "callee";
  callId: string;
  onEnd: () => void;
  incoming: boolean;
}

/**
 * Robust ICE config for CROSS-NETWORK calls:
 *  - Multiple STUN servers (Google, Cloudflare, Open Relay) for common NAT
 *  - Free TURN relay (Open Relay Project) as a fallback so calls still
 *    connect when both sides are behind symmetric NAT / strict firewalls
 *  - The config is fetched from /api/rtc-config, which uses production
 *    TURN_* env vars when set (for reliable cross-network calling)
 */
let RTC_CONFIG: RTCConfiguration = { iceServers: [], iceCandidatePoolSize: 10 };

async function loadRtcConfig() {
  try {
    const res = await fetch("/api/rtc-config");
    const data = await res.json();
    if (data.iceServers?.length) RTC_CONFIG = { iceServers: data.iceServers, iceCandidatePoolSize: 10 };
  } catch {}
}
loadRtcConfig();

export function CallOverlay({ conversationId, peer, callType, role, callId, onEnd, incoming }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"ringing" | "connecting" | "active" | "ended">(incoming ? "ringing" : "connecting");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const seenCandidatesRef = useRef<Set<string>>(new Set());
  const acceptedRef = useRef(false);

  const api = (path: string, opts: any) => fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });

  const sendCandidate = useCallback((candidate: RTCIceCandidate) => {
    api("/api/chat/calls/candidates", {
      method: "POST",
      body: JSON.stringify({ callId, userId: user?.id, candidate }),
    }).catch(() => {});
  }, [callId, user?.id]);

  // Poll remote candidates (from ringing → active so pre-answer trickle works)
  useEffect(() => {
    if (status !== "active" && status !== "connecting" && status !== "ringing") return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/calls/candidates?callId=${callId}&userId=${user?.id}`);
        const d = await res.json();
        for (const c of d.candidates || []) {
          const key = c.userId + ":" + JSON.stringify(c.candidate);
          if (seenCandidatesRef.current.has(key)) continue;
          seenCandidatesRef.current.add(key);
          try { await pcRef.current?.addIceCandidate(c.candidate); } catch {}
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 1500);
    return () => clearInterval(t);
  }, [callId, user?.id, status]);

  // Start local media (callee: on accept; caller: immediately)
  const setupPeer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video" ? { width: 640, height: 480 } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setStatus("active");
      };
      pc.onicecandidate = e => { if (e.candidate) sendCandidate(e.candidate); };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("Connection lost. The call has ended.");
          endCall();
        }
      };
      return pc;
    } catch {
      setError("Couldn't access your camera/microphone.");
      return null;
    }
  }, [callType, sendCandidate]);

  const endCall = useCallback(async () => {
    try { await api("/api/chat/calls", { method: "PATCH", body: JSON.stringify({ callId, action: "end", userId: user?.id }) }); } catch {}
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setStatus("ended");
    onEnd();
  }, [callId, user?.id, onEnd]);

  // Caller flow: setup → create offer → poll for acceptance → answer → active
  useEffect(() => {
    if (role !== "caller" || status === "ended") return;
    let cancelled = false;
    (async () => {
      const pc = await setupPeer();
      if (!pc || cancelled) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await api("/api/chat/calls", { method: "PATCH", body: JSON.stringify({ callId, action: "offer", sdpOffer: pc.localDescription }) });
        setStatus("ringing");
        // poll for the callee's answer
        const pollAnswer = async () => {
          const res = await fetch(`/api/chat/calls?userId=${user?.id}`);
          const d = await res.json();
          const call = (d.calls || []).find((c: any) => c.id === callId);
          if (call?.status === "accepted" && call.sdp_answer) {
            if (!acceptedRef.current) {
              acceptedRef.current = true;
              await pc.setRemoteDescription(JSON.parse(call.sdp_answer));
              setStatus("connecting");
            }
          } else if (call?.status === "declined" || call?.status === "ended") {
            setStatus("ended");
            onEnd();
          }
        };
        pollAnswer();
        const t = setInterval(pollAnswer, 1500);
        return () => clearInterval(t);
      } catch (e) { setError("Call failed to connect."); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Callee flow: incoming → user taps answer → setup → set remote offer → answer → active
  const accept = useCallback(async () => {
    const pc = await setupPeer();
    if (!pc) return;
    try {
      const res = await fetch(`/api/chat/calls?userId=${user?.id}`);
      const d = await res.json();
      const call = (d.calls || []).find((c: any) => c.id === callId);
      if (call?.sdp_offer) {
        await pc.setRemoteDescription(JSON.parse(call.sdp_offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await api("/api/chat/calls", { method: "PATCH", body: JSON.stringify({ callId, action: "accept", sdpAnswer: pc.localDescription }) });
        setStatus("connecting");
      }
    } catch (e) { setError("Couldn't join the call."); }
  }, [callId, user?.id, setupPeer]);

  // Call timer
  useEffect(() => {
    if (status !== "active") return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Connection timeout: if not active in 45s, end with a clear message
  useEffect(() => {
    if (status !== "ringing" && status !== "connecting") return;
    const t = setTimeout(() => {
      if (!acceptedRef.current && status === "ringing" && role === "caller") {
        setError("No answer. The call has ended.");
        endCall();
      }
    }, 45000);
    return () => clearTimeout(t);
  }, [status, role, endCall]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (status === "ended") return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-between bg-black/95 p-6">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <InstaAvatar user={peer} size={44} />
          <div>
            <p className="text-sm font-semibold text-white">{peer.name || peer.username}</p>
            <p className="text-xs text-white/60">
              {status === "ringing" ? (role === "caller" ? "Ringing..." : "Incoming call") :
               status === "connecting" ? "Connecting..." : `${mm}:${ss}`}
            </p>
          </div>
        </div>
        <button onClick={endCall} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
      </div>

      {/* Remote video / avatar */}
      <div className="relative flex flex-1 w-full items-center justify-center">
        <video ref={remoteVideoRef} autoPlay playsInline className="max-h-full max-w-full rounded-2xl" />
        {status !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <InstaAvatar user={peer} size={140} />
            <p className="text-lg font-semibold text-white">{status === "ringing" ? (role === "caller" ? "Calling..." : "Calling you...") : "Connecting..."}</p>
          </div>
        )}
        {/* Local video (small PiP) */}
        {callType === "video" && (
          <div className="absolute bottom-4 right-4 h-36 w-28 overflow-hidden rounded-xl border-2 border-white/20">
            <video ref={localVideoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraOff ? "opacity-0" : ""}`} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Controls */}
      <div className="flex items-center gap-4 pb-4">
        {status === "ringing" && role === "callee" ? (
          <>
            <button onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"><PhoneOff className="h-6 w-6" /></button>
            <button onClick={accept} className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-all"><Phone className="h-6 w-6" /></button>
          </>
        ) : (
          <>
            <button onClick={() => setMuted(m => !m)} className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            {callType === "video" && (
              <button onClick={() => {
                setCameraOff(c => {
                  const next = !c;
                  localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !next);
                  return next;
                });
              }} className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${cameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            )}
            <button onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"><PhoneOff className="h-6 w-6" /></button>
          </>
        )}
      </div>
    </div>
  );
}
