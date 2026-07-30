"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys, wardrobeKeys } from "@/shared/lib/query-keys";
import { confirmTransferSender } from "../api/confirm-transfer-sender";

export function useConfirmTransferSender() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    mutateAsync: confirmSender,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (transferId: string) => confirmTransferSender(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
      router.refresh();
    },
  });

  return { confirmSender, data, isPending, error };
}
