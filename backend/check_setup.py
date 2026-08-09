"""Preflight check for the Twilio phone path.

Run this before dialling the number. It verifies each piece of the chain in the
order a real call travels through it, and tells you exactly what to fix.

    ./.venv/bin/python check_setup.py
"""

import asyncio
import sys

import aiohttp

from app.core.config import settings

OK, BAD, WARN = "  ✅", "  ❌", "  ⚠️ "
results: list[tuple[str, bool]] = []


def record(name: str, passed: bool, detail: str = "", fix: str = "") -> bool:
    results.append((name, passed))
    print(f"{OK if passed else BAD} {name}")
    if detail:
        print(f"      {detail}")
    if not passed and fix:
        print(f"      fix: {fix}")
    return passed


def skip(reason: str) -> None:
    """Not run because an earlier step failed — not a failure of its own."""
    print(f"{WARN} skipped — {reason}")


async def check_sarvam() -> None:
    print("\n[1/5] Sarvam AI credentials")
    if not record(
        "SARVAM_API_KEY is set",
        bool(settings.SARVAM_API_KEY),
        fix="add SARVAM_API_KEY to backend/.env (https://dashboard.sarvam.ai/)",
    ):
        return

    url = f"{settings.SARVAM_LLM_BASE_URL}/chat/completions"
    payload = {
        "model": settings.SARVAM_LLM_MODEL,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 5,
    }
    headers = {"api-subscription-key": settings.SARVAM_API_KEY}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(url, json=payload, headers=headers, timeout=20) as r:
                body = await r.text()
                record(
                    f"Sarvam LLM reachable ({settings.SARVAM_LLM_MODEL})",
                    r.status == 200,
                    detail=f"HTTP {r.status}" + ("" if r.status == 200 else f" — {body[:160]}"),
                    fix="check the key, and that the model name is current",
                )
    except Exception as e:
        record("Sarvam LLM reachable", False, detail=str(e)[:160])


async def check_twilio_creds() -> None:
    print("\n[2/5] Twilio credentials")
    sid_ok = record(
        "TWILIO_ACCOUNT_SID is set",
        bool(settings.TWILIO_ACCOUNT_SID),
        fix="Twilio Console home → Account Info → Account SID (starts with AC)",
    )
    tok_ok = record(
        "TWILIO_AUTH_TOKEN is set",
        bool(settings.TWILIO_AUTH_TOKEN),
        fix="Twilio Console home → Account Info → Auth Token (click to reveal)",
    )
    if not (sid_ok and tok_ok):
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}.json"
    auth = aiohttp.BasicAuth(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, auth=auth, timeout=15) as r:
                data = await r.json() if r.status == 200 else {}
                record(
                    "Twilio credentials accepted by Twilio",
                    r.status == 200,
                    detail=(
                        f"account '{data.get('friendly_name')}' status={data.get('status')}"
                        if r.status == 200
                        else f"HTTP {r.status} — SID/token rejected"
                    ),
                    fix="re-copy both values; the auth token is hidden until you click reveal",
                )
    except Exception as e:
        record("Twilio credentials accepted by Twilio", False, detail=str(e)[:160])


async def check_hostname() -> None:
    print("\n[3/5] Public hostname (how Twilio reaches you)")
    host = settings.PUBLIC_HOSTNAME
    if not record(
        "PUBLIC_HOSTNAME is set",
        bool(host),
        fix="start a tunnel (ngrok http 8080) and put the hostname here, no scheme",
    ):
        return

    clean = not host.startswith(("http://", "https://", "wss://")) and "/" not in host
    record(
        "PUBLIC_HOSTNAME has no scheme or path",
        clean,
        detail=f"value: {host}",
        fix='use just the host, e.g. "abc123.ngrok-free.app" — we add wss:// ourselves',
    )


def _compare_live_config(live: dict) -> None:
    """Compare the running server's config against the .env we just read.

    A mismatch means the process started before the file was edited. That looks
    exactly like a code bug from the outside, so name it explicitly.
    """
    expected = {
        "public_hostname": settings.PUBLIC_HOSTNAME,
        "twilio_account_sid_set": bool(settings.TWILIO_ACCOUNT_SID),
        "twilio_auth_token_set": bool(settings.TWILIO_AUTH_TOKEN),
        "twilio_validate_signature": settings.TWILIO_VALIDATE_SIGNATURE,
    }
    stale = {k: (v, live.get(k)) for k, v in expected.items() if live.get(k) != v}

    if not live:
        print(f"{WARN} server did not report its config — it is running older code")
        print("      fix: restart the backend so it picks up the latest changes")
        results.append(("running server is up to date", False))
        return

    record(
        "running server matches your .env",
        not stale,
        detail=(
            "; ".join(f"{k}: .env={exp!r} server={got!r}" for k, (exp, got) in stale.items())
            if stale
            else "config in sync"
        ),
        fix="RESTART THE BACKEND — it is running config from before your last edit",
    )


async def check_webhook_public() -> None:
    print("\n[4/5] Webhook reachable from the internet")
    if not settings.PUBLIC_HOSTNAME:
        skip("PUBLIC_HOSTNAME not set")
        return

    url = f"https://{settings.PUBLIC_HOSTNAME}{settings.API_V1_STR}/health"
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, timeout=15) as r:
                data = await r.json() if r.status == 200 else {}
                if record(
                    "backend answers on the public URL",
                    r.status == 200,
                    detail=f"GET {url} -> HTTP {r.status}",
                    fix="is the tunnel running, and is the backend up on port "
                    f"{settings.PORT}?",
                ):
                    if record(
                        "public URL reaches THIS backend",
                        data.get("service") == settings.PROJECT_NAME,
                        detail=f"service reported: {data.get('service')}",
                        fix="the tunnel is pointing at a different process",
                    ):
                        _compare_live_config(data.get("config") or {})
    except Exception as e:
        record(
            "backend answers on the public URL",
            False,
            detail=str(e)[:160],
            fix="start the tunnel and the backend, then re-run",
        )


async def check_signature_gate() -> None:
    print("\n[5/5] Webhook rejects forged requests")
    if not settings.PUBLIC_HOSTNAME:
        skip("PUBLIC_HOSTNAME not set")
        return

    if not settings.TWILIO_VALIDATE_SIGNATURE:
        print(f"{WARN} signature validation is DISABLED (TWILIO_VALIDATE_SIGNATURE=false)")
        print("      anyone who finds your URL can start agent sessions on your credits")
        print("      set it back to true before this is reachable in production")
        return

    url = f"https://{settings.PUBLIC_HOSTNAME}{settings.API_V1_STR}/twilio/voice"
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(url, data={"From": "+10000000000", "CallSid": "CAfake"}, timeout=15) as r:
                record(
                    "unsigned request is rejected (403)",
                    r.status == 403,
                    detail=f"POST without signature -> HTTP {r.status}",
                    fix="expected 403; check TWILIO_AUTH_TOKEN is the real token",
                )
    except Exception as e:
        record("unsigned request is rejected", False, detail=str(e)[:160])


async def main() -> int:
    print("=" * 66)
    print("  IntelliForm AI — Twilio preflight")
    print("=" * 66)

    await check_sarvam()
    await check_twilio_creds()
    await check_hostname()
    await check_webhook_public()
    await check_signature_gate()

    failed = [n for n, ok in results if not ok]
    print("\n" + "=" * 66)
    if failed:
        print(f"  {len(failed)} check(s) failed:")
        for n in failed:
            print(f"    - {n}")
        print("\n  Fix the above, then re-run this script.")
    else:
        print("  All checks passed. Set your Twilio number's webhook to:")
        print(f"    https://{settings.PUBLIC_HOSTNAME}{settings.API_V1_STR}/twilio/voice")
        print("  (HTTP POST), then call the number.")
    print("=" * 66)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
