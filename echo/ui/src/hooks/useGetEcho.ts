import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";
import { Segment } from "types/echo";

import useAuth from "./useAuth";

type GetEchoResponse = {
  echo: Echo;
  segments: Segment[];
};

export default function useGetEcho(echoId?: string, includeSegments?: boolean) {
  const { userId } = useAuth();

  return useQuery<GetEchoResponse>(
    ["getEcho", echoId, includeSegments],
    () => echoClient.appClientCommand.getEchoCommandGetEchoPost({ userId, echoId: echoId!, includeSegments }),
    { enabled: !!echoId && !!includeSegments },
  );
}
