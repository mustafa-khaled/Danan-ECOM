/**
 * Forces the mock payment provider for end-to-end runs.
 *
 * The repo `.env` carries real Tap sandbox credentials so `pnpm dev` exercises
 * the live gateway, but the e2e suite must stay deterministic and offline —
 * it asserts on specific charge outcomes driven by magic tokens ("fail",
 * "3ds") that only the mock provider understands.
 */
process.env.PAYMENT_PROVIDER_KEY = "";
process.env.PAYMENT_PROVIDER_SECRET = "";
process.env.ALLOW_MOCK_PAYMENTS = "true";
process.env.ADMIN_JWT_SECRET ??=
  "ci-test-admin-jwt-secret-min-32-chars!!";
