# Fayda-Style-OTP-Demo

🇪🇹 **Ethiopian National Identity (Fayda-Style) Verification & Real Cellular SMS OTP Hub**

A modern identity verification prototype featuring real-time **cellular SMS OTP dispatch** across **Ethio Telecom** (`09...`) and **Safaricom Ethiopia** (`07...`), integrated with the **SMSEthiopia API Gateway (`smsethiopia.com`)**, interactive sandbox mode, and secure cryptographic one-time password validation.

---

## 🚀 Features

1. **Real Cellular SMS OTP Delivery**:
   - Integrated with **SMSEthiopia (`smsethiopia.com`)** to dispatch real cellular SMS to Ethiopian mobile subscribers.
   - Generates cryptographically secure 6-digit OTP codes with 5-minute expiry windows.
   - Salted SHA-256 OTP hashing in-memory with constant-time verification (`timingSafeEqual`) to prevent timing attacks.

2. **Carrier Detection & Formatting**:
   - Detects **Ethio Telecom** numbers (`09...` / `+2519...`).
   - Detects **Safaricom Ethiopia** numbers (`07...` / `+2517...`).
   - Automatically sanitizes, validates, and masks phone numbers (e.g. `+251 91 ••• ••34`) for privacy protection.

3. **Hybrid Sandbox & Live Mode**:
   - **Live SMS Mode**: Enter any Ethiopian mobile phone number to receive the actual SMS OTP directly on your phone.
   - **Sandbox Mode**: Use sample demo identities (`DEMO-4821-7390`, `DEMO-1138-2406`) for instant testing without cellular airtime.

4. **Production Architecture**:
   - **Backend API**: Express 5 on Node.js 24 + TypeScript.
   - **Validation**: OpenAPI 3.1 schema specification + Zod validation.
   - **Frontend**: Vite + React 19 + Tailwind CSS + Lucide Icons + TanStack Query.
   - **Client Bindings**: Orval automated code generation from OpenAPI specs.

---

## 🛠️ Quick Start

### 1. Install & Build
```bash
# Install workspace dependencies
pnpm install

# Build all packages & bundles
pnpm run build
```

### 2. Start the Server
```bash
# Start the production server (serves both API & Frontend on port 5000)
PORT=5000 node artifacts/api-server/dist/index.mjs
```

Open your browser at:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## ⚙️ Configuration (Environment Variables)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `5000` |
| `SMSETHIOPIA_API_KEY` | Your live API Key from `smsethiopia.com` | Live configured key |
| `SMSETHIOPIA_SENDER_ID` | Sender ID name on SMSEthiopia campaign | `Default` |

---

## 📡 API Endpoints

- `GET /api/healthz` — Server health status check.
- `POST /api/auth/mock/challenges` — Initiate an OTP challenge.
  ```json
  {
    "idNumber": "DEMO-4821-7390",
    "phoneNumber": "0911223344"
  }
  ```
- `POST /api/auth/mock/challenges/verify` — Validate the 6-digit OTP code.
  ```json
  {
    "challengeId": "<uuid>",
    "otp": "123456"
  }
  ```

---

## 🔒 Security Decisions

- OTPs are never stored in plaintext — only salted SHA-256 hashes are preserved with strict 5-minute TTL.
- Constant-time string comparison protects against timing-based enumeration.
- Rate limiting restricts brute force attempts (maximum 5 attempts per challenge, 10 requests per ID window).
- Built independently for product exploration and telecom authentication workflows. Not an official service of NIDP / Fayda.
