/**
 * LiveKit voice client for the IntelliForm AI Welcome Agent.
 *
 * All the hard parts of realtime voice — turn detection, barge-in, echo
 * cancellation, jitter buffering, packet loss — are handled by WebRTC on the
 * wire and by Silero VAD in the Pipecat agent. This module only has to:
 *
 *   1. ask the backend for a room token,
 *   2. join the room and publish the microphone,
 *   3. play the agent's audio track,
 *   4. relay transcript/state messages from the agent's data channel.
 */

import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
} from 'livekit-client';

export type TurnState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'user_speaking'
  | 'processing'
  | 'agent_speaking'
  | 'error';

export interface VoiceClientCallbacks {
  onStateChange?: (state: TurnState) => void;
  onUserMessage?: (text: string) => void;
  onAgentMessage?: (text: string) => void;
  onInterim?: (text: string) => void;
  onError?: (message: string) => void;
  onConnected?: (info: { room: string; callerId: string; returning: boolean }) => void;
}

export interface VoiceClientOptions extends VoiceClientCallbacks {
  /** Base URL of the voice backend, e.g. http://localhost:8080 */
  apiBaseUrl: string;
  /** Stable id so the agent remembers this visitor between calls. */
  callerId?: string;
  /** BCP-47 code, e.g. hi-IN. Defaults to the backend's en-IN. */
  language?: string;
}

/** Persist a caller id so the agent's memory survives a page reload. */
const CALLER_ID_KEY = 'intelliform.callerId';

export function getStoredCallerId(): string {
  try {
    const existing = localStorage.getItem(CALLER_ID_KEY);
    if (existing) return existing;
    const fresh = `visitor-${crypto.randomUUID().slice(0, 12)}`;
    localStorage.setItem(CALLER_ID_KEY, fresh);
    return fresh;
  } catch {
    // Private browsing / storage disabled — fall back to a per-session id.
    return `visitor-${Math.random().toString(36).slice(2, 14)}`;
  }
}

export class VoiceClient {
  private opts: VoiceClientOptions;
  private room: Room | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private state: TurnState = 'idle';
  private closed = false;

  constructor(opts: VoiceClientOptions) {
    this.opts = opts;
  }

  getState(): TurnState {
    return this.state;
  }

  private setState(next: TurnState) {
    if (this.state === next || this.closed) return;
    this.state = next;
    this.opts.onStateChange?.(next);
  }

  // ---------------------------------------------------------------- connect

  async connect(): Promise<void> {
    this.closed = false;
    this.setState('connecting');

    let url: string;
    let token: string;
    let roomName: string;
    let callerId: string;

    try {
      const res = await fetch(`${this.opts.apiBaseUrl}/api/v1/voice/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_id: this.opts.callerId ?? getStoredCallerId(),
          language: this.opts.language ?? null,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(
          res.status === 503
            ? 'Voice backend is not configured yet. Add LiveKit and Sarvam keys to backend/.env.'
            : `Backend returned ${res.status}: ${detail.slice(0, 200)}`
        );
      }

      const data = await res.json();
      url = data.url;
      token = data.token;
      roomName = data.room;
      callerId = data.caller_id;
    } catch (err: any) {
      this.fail(err?.message || 'Could not reach the voice backend.');
      return;
    }

    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        // WebRTC handles echo cancellation, so the agent's own voice never
        // re-enters the pipeline and falsely triggers a barge-in.
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.room = room;

      room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed);
      room.on(RoomEvent.DataReceived, this.handleData);
      room.on(RoomEvent.Disconnected, () => {
        if (!this.closed) this.fail('Call disconnected.');
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      this.setState('listening');
      this.opts.onConnected?.({ room: roomName, callerId, returning: false });
    } catch (err: any) {
      this.fail(err?.message || 'Could not join the voice room.');
    }
  }

  async disconnect(): Promise<void> {
    this.closed = true;
    try {
      await this.room?.disconnect();
    } catch {
      /* already gone */
    }
    this.room = null;
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl.remove();
      this.audioEl = null;
    }
    this.state = 'idle';
    this.opts.onStateChange?.('idle');
  }

  // ------------------------------------------------------------- controls

  async setMuted(muted: boolean): Promise<void> {
    await this.room?.localParticipant.setMicrophoneEnabled(!muted);
  }

  setSpeakerMuted(muted: boolean): void {
    if (this.audioEl) this.audioEl.muted = muted;
  }

  /** Send a typed turn. It joins the same conversation as spoken turns. */
  async sendText(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || !this.room) return;
    this.setState('processing');
    await this.room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: 'user.text', text: trimmed })),
      { reliable: true }
    );
  }

  // -------------------------------------------------------------- internals

  private fail(message: string) {
    this.opts.onError?.(message);
    this.setState('error');
  }

  private handleTrackSubscribed = (
    track: RemoteTrack,
    _pub: RemoteTrackPublication
  ) => {
    if (track.kind !== Track.Kind.Audio) return;
    // Attach once; LiveKit manages the underlying MediaStream for us.
    const el = track.attach() as HTMLAudioElement;
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    this.audioEl = el;
  };

  private handleData = (payload: Uint8Array) => {
    let msg: any;
    try {
      msg = JSON.parse(new TextDecoder().decode(payload));
    } catch {
      return; // not ours
    }

    switch (msg.type) {
      case 'state':
        this.setState(msg.state as TurnState);
        break;
      case 'user.transcript':
        if (msg.text) this.opts.onUserMessage?.(msg.text);
        break;
      case 'user.interim':
        if (msg.text) this.opts.onInterim?.(msg.text);
        break;
      case 'agent.transcript':
        if (msg.text) this.opts.onAgentMessage?.(msg.text);
        break;
      case 'agent.ready':
        this.setState('listening');
        break;
    }
  };
}
