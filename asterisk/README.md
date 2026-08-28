# 🌟 Asterisk PBX Container for IntelliForm AI

This directory contains the pre-configured **Asterisk PBX Container** setup for the **IntelliForm AI Universal Agent Framework**.

---

## 📁 Directory Layout

```
asterisk/
├── Dockerfile              # Alpine Linux Asterisk PJSIP Image
├── docker-compose.yml      # Host Network Compose File
├── config/
│   ├── asterisk.conf       # Core Asterisk paths & logging configuration
│   ├── pjsip.conf          # SIP Transports, Softphone auth, Extension 1001
│   ├── extensions.conf     # Dialplan routing Extension 100 to AI Voice Pipeline
│   └── manager.conf        # Asterisk Manager Interface (AMI) on Port 5038
└── README.md               # Quickstart instructions
```

---

## 🚀 Quickstart Guide

### 1. Build and Start Asterisk PBX:

```bash
cd asterisk
docker compose up -d --build
```

### 2. Verify Container Status:

```bash
docker ps -f name=intelliform-asterisk-pbx
```

### 3. Open Asterisk CLI:

```bash
docker exec -it intelliform-asterisk-pbx asterisk -r
```

---

## 📞 Softphone Setup & Testing

1. **Connect Softphone** (Zoiper / MicroSIP / Linphone):
   - **SIP Host**: `127.0.0.1:5060`
   - **Username**: `1001`
   - **Password**: `intelliform_secret_pass`
2. **Dial Extension `100`**:
   - Asterisk connects to your backend at `ws://localhost:8080/api/v1/asterisk/ws`.
   - Your IntelliForm AI voice agent greets you in real time!
