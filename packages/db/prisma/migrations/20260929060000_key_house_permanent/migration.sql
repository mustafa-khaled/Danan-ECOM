-- Key House is permanent: it never expires and is only invalidated when an admin
-- rotates it or deactivates the client. Nothing ever read these two columns —
-- auth never loaded HouseSettings and Client has no expiry column — so they only
-- advertised a renewal policy the system did not implement.
ALTER TABLE "HouseSettings" DROP COLUMN "keyValidityMonths";
ALTER TABLE "HouseSettings" DROP COLUMN "requireKeyRenewal";
