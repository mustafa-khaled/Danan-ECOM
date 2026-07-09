import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { respondToTransfer } from "../api/respond-to-transfer";

export function useRespondToTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transferId,
      action,
    }: {
      transferId: string;
      action: "accept" | "decline";
    }) => respondToTransfer(transferId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}
