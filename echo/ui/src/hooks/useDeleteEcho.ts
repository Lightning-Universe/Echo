import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

export default function useDeleteEcho() {
  const queryClient = useQueryClient();

  return useMutation(
    (echoID: string) => echoClient.appClientCommand.deleteEchoCommandDeleteEchoPost({ echoId: echoID }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("listEchoes");
      },
    },
  );
}
