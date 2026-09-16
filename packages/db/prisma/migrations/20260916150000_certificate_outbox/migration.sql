-- Transactional outbox for certificate generation.
--
-- Certificate jobs were pushed to BullMQ immediately after the transaction that
-- moved ownership committed. That enqueue is a network call to Redis outside the
-- transaction, so a Redis blip or a crash in the gap between commit and enqueue
-- left a piece owned with no certificate and no record that one was ever owed.
-- Writing the intent inside the same transaction makes ownership and the promise
-- of a certificate atomic; `CertificateOutboxService` drains the table into the
-- queue and can retry indefinitely.
CREATE TABLE IF NOT EXISTS "CertificateOutbox" (
  "id"           TEXT         NOT NULL,
  "pieceId"      TEXT         NOT NULL,
  "clientId"     TEXT         NOT NULL,
  "orderId"      TEXT,
  "transferId"   TEXT,
  "regenerate"   BOOLEAN      NOT NULL DEFAULT false,
  "adminId"      TEXT,
  "attempts"     INTEGER      NOT NULL DEFAULT 0,
  "lastError"    TEXT,
  "dispatchedAt" TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CertificateOutbox_pkey" PRIMARY KEY ("id")
);

-- The dispatcher claims the oldest undispatched rows; this index keeps that scan
-- off the full table as delivered rows accumulate.
CREATE INDEX IF NOT EXISTS "CertificateOutbox_dispatchedAt_createdAt_idx"
  ON "CertificateOutbox" ("dispatchedAt", "createdAt");
