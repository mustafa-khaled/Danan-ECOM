-- CreateIndex
CREATE INDEX "Client_houseKeyPrefix_isActive_idx" ON "Client"("houseKeyPrefix", "isActive");

-- CreateIndex
CREATE INDEX "Design_collectionId_idx" ON "Design"("collectionId");

-- CreateIndex
CREATE INDEX "Piece_currentOwnerId_idx" ON "Piece"("currentOwnerId");

-- CreateIndex
CREATE INDEX "Piece_designId_status_idx" ON "Piece"("designId", "status");

-- CreateIndex
CREATE INDEX "Certificate_pieceId_isActive_idx" ON "Certificate"("pieceId", "isActive");

-- CreateIndex
CREATE INDEX "Order_clientId_status_idx" ON "Order"("clientId", "status");

-- CreateIndex
CREATE INDEX "TransferRequest_pieceId_status_idx" ON "TransferRequest"("pieceId", "status");

-- CreateIndex
CREATE INDEX "TransferRequest_fromClientId_idx" ON "TransferRequest"("fromClientId");

-- CreateIndex
CREATE INDEX "TransferRequest_toClientId_idx" ON "TransferRequest"("toClientId");

-- CreateIndex
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest"("status");

-- CreateIndex
CREATE INDEX "CartItem_expiresAt_idx" ON "CartItem"("expiresAt");
