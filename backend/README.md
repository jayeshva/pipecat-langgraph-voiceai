# IntelliForm AI — Voice Backend

Realtime voice agent for the dashboard. **LiveKit** carries the media, **Pipecat**
orchestrates the pipeline, **Sarvam AI** provides speech and language.

The legacy `backend-python/` folder is untouched and still serves the form
analyzer and citizen assistant. This folder replaces only the voice path.

## Pipeline

```
Browser ──WebRTC──► LiveKit ──► Pipecat agent ──► Browser
                                  │
        Sarvam Saarika STT ──► LLMContext ──► Sarvam LLM ──► Sarvam Bulbul TTS
                                  ▲
                            Silero VAD (turn detection + barge-in)
```

Turn-taking, barge-in, echo cancellation, jitter, and packet loss are handled by
WebRTC and Silero VAD — not by application code.

## Setup

```bash
cd backend
uv venv --python 3.13            # or: python3.13 -m venv .venv
uv pip install -r requirements.txt
cp .env.example .env             # then fill in the keys below
```

### Required keys

| Variable | Where to get it |
|---|---|
| `SARVAM_API_KEY` | https://dashboard.sarvam.ai/ |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | A local dev server (below) or LiveKit Cloud |

## LiveKit: local dev server (recommended)

No cloud account needed. `--dev` mode always uses the placeholder credentials
`devkey` / `secret`, which is what `.env` is already set to.

```bash
brew install livekit     # or: curl -sSL https://get.livekit.io | bash
livekit-server --dev     # ws://localhost:7880
```

```ini
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
```

Dev mode is for local development only — the credentials are public and it runs
without TLS. For anything reachable from another machine, use LiveKit Cloud
(free tier) or a self-hosted server with real keys, and switch the URL to `wss://`.

## Run

Three processes:

```bash
livekit-server --dev                 # 1. media server  :7880
./.venv/bin/python run.py            # 2. this backend  :8080
cd ../frontend && npm run dev        # 3. dashboard     :5173
```

Then open the voice widget. Set `VITE_VOICE_API_URL` if the backend is not on
`localhost:8080`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | Status and whether keys are configured |
| `POST` | `/api/v1/voice/connect` | Create a room, dispatch the agent, return a caller token |
| `DELETE` | `/api/v1/voice/memory/{caller_id}` | Clear what the agent remembers about one visitor |

`POST /voice/connect` returns `{url, token, room, caller_id}`. The browser joins
the room with that token; the agent is already waiting in it.

## Phone calls via Twilio

Citizens without a smartphone dial a number and reach the same agent. One
pipeline serves both front doors — same prompt, same memory, same VAD tuning:

```
Browser ──WebRTC──► LiveKit ────┐
                                ├──► build_agent()  →  STT → LLM → TTS
Phone ──PSTN──► Twilio ─────────┘
```

Twilio's leg is 8 kHz µ-law; `TwilioFrameSerializer` resamples to the 16 kHz
pipeline both ways, so nothing downstream knows the difference.

### Setup

**1. Expose the backend.** Twilio must reach you over HTTPS:

```bash
ngrok http 8080          # -> https://abc123.ngrok-free.app
```

**2. Configure** in `.env` (hostname only — no scheme, we add `wss://`):

```ini
PUBLIC_HOSTNAME="abc123.ngrok-free.app"
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_LANGUAGE="hi-IN"          # phones have no UI to pick a language
```

**3. Point your Twilio number at it.** Console → Phone Numbers → your number →
*A call comes in* → **Webhook**, `HTTP POST`:

```
https://abc123.ngrok-free.app/api/v1/twilio/voice
```

Then call the number.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/twilio/voice` | TwiML webhook — answers the call, opens the media stream |
| `WS` | `/api/v1/twilio/ws` | Media Streams socket — one per call, lives for the call's duration |

### Security — both endpoints are public

Anyone who learns these URLs can reach them, so each is authenticated, by a
different mechanism (Twilio signs the webhook but *not* the socket):

| Endpoint | Protected by |
|---|---|
| `/twilio/voice` | `X-Twilio-Signature` verified with Twilio's `RequestValidator` |
| `/twilio/ws` | Short-lived HMAC token minted in the TwiML, handed back as a `<Parameter>`, bound to that one `CallSid` |

Without the second, a stranger could open the socket, send a handmade `start`
frame, and run a full agent session on your Sarvam credits. The token is
stateless (HMAC, not a server-side set), so it survives restarts and multiple
workers.

`TWILIO_VALIDATE_SIGNATURE=false` disables both — local testing only. With
validation on and no `TWILIO_AUTH_TOKEN`, calls are **rejected** rather than
silently accepted, so a half-configured deployment fails closed.

### Why the Twilio SDK is barely used

Almost nothing here needs it — TwiML is plain XML we build ourselves, the media
protocol is Pipecat's serializer, and hangup is a raw `aiohttp` POST to
`api.twilio.com` inside that serializer. The SDK is installed for exactly one
thing: `RequestValidator`, for webhook signature verification.

## Outbound calls — the agent phones someone

```bash
curl -X POST http://localhost:8080/api/v1/voice/call \
  -H "Content-Type: application/json" \
  -d '{
        "to": "+919876543210",
        "purpose": "Your income certificate application is approved and ready for collection at the Taluk office.",
        "language": "hi-IN"
      }'
```

```json
{"outbound_id": "9c7d5ae3fb054539", "call_sid": "CAxxxx", "to": "+919876543210", "status": "dialing"}
```

Track it with `GET /api/v1/voice/calls`, which shows `dialing → ringing → answered → completed`.

### How it differs from inbound

An agent that *places* a call is in a different situation from one that answers.
The person did not ask to be called and has no idea who is speaking, so the
`purpose` you pass is turned into an opening instruction that makes the agent:

1. say who it is and which department it is calling for,
2. state the reason in one sentence,
3. **ask whether now is a good time** — and stop politely if not,
4. never ask for OTPs, passwords, bank details, or full Aadhaar numbers.

That last rule matters: a citizen receiving an unexpected call asking for an OTP
is the exact shape of a scam, so the agent is told never to behave that way.

### Voicemail

`TWILIO_DETECT_VOICEMAIL=true` has Twilio listen for an answering machine before
connecting the agent. If it hears one, the call is hung up rather than delivering
a conversation to a recording. Costs about a second of answer latency.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/voice/call` | Place a call |
| `GET` | `/api/v1/voice/calls` | Status of recent outbound calls |
| `POST` | `/api/v1/twilio/status` | Twilio's progress callbacks (signed) |

### Two constraints to know

**Single process.** The reason for a call is stashed in memory between placing it
and Twilio's callback seconds later. Run **one worker**; with several, or a
restart in between, the callback lands somewhere that has no record of why the
call was made. That case is detected and the call is ended with an apology rather
than silently behaving like an inbound call — but the fix for scale is moving
`app/outbound.py`'s store to Redis.

**Trial accounts** can only call numbers verified under *Verified Caller IDs* in
the Twilio console.

> Automated outbound calls to Indian numbers fall under TRAI regulations
> (DND registry, DLT registration). Check what applies before calling citizens
> who have not opted in.

### Memory works better on the phone

Browser callers get a `localStorage` id that a cleared cache destroys. Phone
callers are keyed by **their phone number**, which is stable — so a citizen who
calls back next week is genuinely recognised.

## Tuning interruption (barge-in)

If you speak over the agent and it keeps talking, the voice detector is not
registering you. All four knobs live in `.env` and take effect on the next call —
no code change needed.

| Setting | Default | Silero default | What it does |
|---|---|---|---|
| `VAD_MIN_VOLUME` | `0.3` | 0.6 | Volume gate. **Try this first.** Audio quieter than this is discarded before anything else looks at it. |
| `VAD_CONFIDENCE` | `0.6` | 0.7 | How certain the model must be that a frame is speech. |
| `VAD_START_SECS` | `0.15` | 0.2 | How long you must speak before it counts. Lower interrupts sooner. |
| `VAD_STOP_SECS` | `0.5` | 0.2 | How long you must pause before your turn is treated as finished. |

**Why the volume gate matters most for barge-in:** the browser runs echo
cancellation so the agent's own voice never re-enters the microphone. That same
processing attenuates *your* voice while the agent is speaking — exactly when you
want to interrupt. At Silero's default of `0.6`, normal speech can fall under the
gate and be dropped before the speech model ever sees it.

**Which way to move it**

| Symptom | Change |
|---|---|
| Agent ignores me when I talk over it | Lower `VAD_MIN_VOLUME` (0.3 → 0.2 → 0.1), then `VAD_CONFIDENCE` (0.6 → 0.5) |
| Agent cuts itself off on keyboard/fan/background noise | Raise `VAD_MIN_VOLUME` (0.3 → 0.5) and `VAD_CONFIDENCE` (0.6 → 0.75) |
| Agent replies before I finish a sentence | Raise `VAD_STOP_SECS` (0.5 → 0.8) |
| Agent takes too long to reply after I stop | Lower `VAD_STOP_SECS` (0.5 → 0.3) |

`SARVAM_HIGH_VAD_SENSITIVITY=true` additionally enables Sarvam's own server-side
voice detection, which helps in noisy rooms. It is independent of the Silero
settings above.

The chosen values are logged at the start of every call, so you can confirm what
is actually in effect:

```
[intelliform-a1b2c3] VAD: confidence=0.6 min_volume=0.3 start=0.15s stop=0.5s
```

## Memory

Two layers:

- **In-call** — Pipecat's `LLMContext` holds the running conversation, so the
  agent tracks what was already said within a call.
- **Across calls** — on hangup the transcript is snapshotted against the
  caller id into `data/caller_memory.json` (atomic write, TTL-bounded, capped at
  40 replayed messages). Reconnecting with the same caller id resumes the thread
  and the agent greets them as a returning visitor.

The browser stores its caller id in `localStorage`, so memory survives a reload.
Swap `_load`/`_save` in `app/memory.py` for Redis or Postgres to scale past one
process.

## Models

Verified live against the Sarvam API:

| Role | Model |
|---|---|
| LLM | `sarvam-105b-conversations` |
| STT | `saarika:v2.5` |
| TTS | `bulbul:v3` (speaker `shubh`) |

`sarvam-m` and `sarvam-2b` are **deprecated** and return HTTP 400 — the legacy
backend still references `sarvam-2b`, which is why its chat path would fail if it
were ever called.

## Languages

English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati,
Punjabi, Odia. Sarvam's models handle code-mixed speech (Hinglish, Tanglish)
natively. Language is fixed per call — changing it in the UI starts a new call,
because STT and TTS are configured at dispatch.

## Layout

```
app/config.py    settings; secrets come from .env only
app/prompts.py   Welcome Agent system prompt, written for speech
app/memory.py    cross-call caller memory
app/agent.py     the Pipecat pipeline and transcript relay
app/server.py    FastAPI control plane (tokens + agent dispatch)
run.py           dev entrypoint
```
