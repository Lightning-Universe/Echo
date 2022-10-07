import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

export default function useListEchoes() {
  return useQuery<Echo[]>("listEchoes", () => echoClient.appClientCommand.listEchoesCommandListEchoesPost(), {
    refetchInterval: 1000,
  });
}
