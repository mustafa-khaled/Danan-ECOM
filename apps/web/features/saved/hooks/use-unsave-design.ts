import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { unsaveDesign } from "../api/unsave-design";

export function useUnsaveDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (designId: string) => unsaveDesign(designId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
