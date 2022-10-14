import { useQuery, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

import useAuth from "./useAuth";

export default function useListEchoes() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useQuery<Echo[]>("listEchoes", () => echoClient.appApi.handleListEchoesApiEchoesGet(userId!), {
    enabled: !!userId,
    refetchInterval: 1000,
    onSuccess: () => {
      queryClient.invalidateQueries(["getEcho"]);
    },
  });
}
