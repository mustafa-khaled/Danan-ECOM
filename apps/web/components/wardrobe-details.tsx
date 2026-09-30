"use client";

import { useState, type ReactNode } from "react";
import { WardrobeActions } from "./wardrobe-actions";

interface WardrobeDetailsProps {
  specs: ReactNode;
  priceBlock: ReactNode;
  pieceId: string;
  pieceName: string;
  serialNumber: string;
  status: string;
  activeTransfer?: { id: string };
}

export function WardrobeDetails({
  specs,
  priceBlock,
  ...wardrobe
}: WardrobeDetailsProps) {
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      {!transferOpen ? specs : null}

      <div className="xl:pt-12 pt-[16px]">
        {!transferOpen ? priceBlock : null}

        <WardrobeActions
          {...wardrobe}
          transferOpen={transferOpen}
          onTransferOpenChange={setTransferOpen}
        />
      </div>
    </>
  );
}
