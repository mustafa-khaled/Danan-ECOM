import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { confirmTransferSender } from "../api/confirm-transfer-sender";

export function useConfirmTransferSender() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: string) => confirmTransferSender(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}
