import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import useAuth from "./useAuth";

export default function useDeleteEcho() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation(
    (echoID: string) => echoClient.appClientCommand.deleteEchoCommandDeleteEchoPost({ userId, echoId: echoID }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("listEchoes");
      },
    },
  );
}
