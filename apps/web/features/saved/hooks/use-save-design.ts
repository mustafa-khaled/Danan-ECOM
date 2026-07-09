import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { saveDesign } from "../api/save-design";

export function useSaveDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (designId: string) => saveDesign(designId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
