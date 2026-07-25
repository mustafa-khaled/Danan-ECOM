import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { initiateTransfer as initiateTransferApi } from "../api/initiate-transfer";

export function useInitiateTransfer() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: initiateTransfer,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (body: {
      pieceId: string;
      transferType: "SALE" | "GIFT" | "INHERITANCE";
      recipientHouseKey: string;
    }) => initiateTransferApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });

  return { initiateTransfer, data, isPending, error };
}
