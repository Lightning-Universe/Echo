import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

import useAuth from "./useAuth";

export default function useListEchoes() {
  const { userId } = useAuth();

  return useQuery<Echo[]>(
    "listEchoes",
    () => echoClient.appClientCommand.listEchoesCommandListEchoesPost({ userId }),
    {
      enabled: !!userId,
      refetchInterval: 1000,
    },
  );
}
