import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { initiateTransfer } from "../api/initiate-transfer";

export function useInitiateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      pieceId: string;
      transferType: "SALE" | "GIFT" | "INHERITANCE";
      recipientHouseKey: string;
    }) => initiateTransfer(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}
