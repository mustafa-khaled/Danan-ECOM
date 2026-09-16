-- Query hygiene indexes.
--
-- `Order_paymentStatus_totalAmount_idx` replaces the plain paymentStatus index so
-- the lifetime-revenue groupBy in `getOrderStats` can be served index-only; it
-- reports revenue for all time, so it cannot be bounded by a date window.
DROP INDEX "Order_paymentStatus_idx";
CREATE INDEX "Order_paymentStatus_totalAmount_idx" ON "Order"("paymentStatus", "totalAmount");

-- The admin piece list filters by collection and orders by name.
CREATE INDEX "Piece_collectionId_name_idx" ON "Piece"("collectionId", "name");

-- A client's saved list is read newest-first; the (clientId, pieceId) primary key
-- cannot serve that sort.
CREATE INDEX "SavedPiece_clientId_savedAt_idx" ON "SavedPiece"("clientId", "savedAt" DESC);
