# =============================================================================

# DADAN Production Environment

# =============================================================================

NODE_ENV=production

# --- Database & cache ---

DATABASE_URL=postgresql://dadan:YOUR_STRONG_DB_PASSWORD_HERE@db:5432/dadan
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# --- Secrets ---

# Generate with: openssl rand -base64 48

JWT_SECRET=YOUR_64_CHAR_RANDOM_SECRET_HERE_GENERATED_WITH_OPENSSL

# Generate with: openssl rand -base64 32

CERT_SIGNING_SECRET=YOUR_32_CHAR_CERT_SIGNING_SECRET_HERE
HOUSE_KEY_SALT=12

# --- Sessions & cookies ---

CLIENT_SESSION_DAYS=7
ACCESS_TOKEN_MINUTES=15
ADMIN_REFRESH_HOURS=24
COOKIE_SECURE=true
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW_SECONDS=900

# --- Web <-> API routing ---

API_URL=http://api:4000
NEXT_PUBLIC_API_URL=/api
WEB_ORIGIN=https://yourdomain.com
BASE_URL=https://yourdomain.com

# --- Storage ---

STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads

# --- Payments (Tap Payments) ---

PAYMENT_PROVIDER_KEY=sk_live_YOUR_TAP_LIVE_SECRET_KEY
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook
PAYMENT_REDIRECT_URL=https://yourdomain.com/beta/checkout/return
VAT_RATE=0.15
NEXT_PUBLIC_PAYMENT_MODE=live
NEXT_PUBLIC_TAP_PUBLIC_KEY=pk_live_YOUR_TAP_LIVE_PUBLIC_KEY
NEXT_PUBLIC_TAP_MERCHANT_ID=YOUR_TAP_MERCHANT_ID

# Do NOT set ALLOW_MOCK_PAYMENTS in production

# --- Email ---

ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=YOUR_SMTP_PASSWORD

# --- Misc ---

PDF_WATERMARK_TEXT=DADAN DIJITAL — AUTHENTICATED
HTTP_PORT=80
