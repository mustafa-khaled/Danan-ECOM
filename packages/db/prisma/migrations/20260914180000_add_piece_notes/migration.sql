-- Persist curator notes on the piece itself (updatePiece DTO already accepts notes).
ALTER TABLE "Piece" ADD COLUMN "notes" TEXT;
