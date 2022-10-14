import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

export default function useDeleteEcho() {
  const queryClient = useQueryClient();

  return useMutation((echoID: string) => echoClient.appApi.handleDeleteEchoApiEchoesEchoIdDelete(echoID), {
    onSuccess: () => {
      queryClient.invalidateQueries("listEchoes");
      queryClient.invalidateQueries(["getEcho"]);
    },
  });
}
