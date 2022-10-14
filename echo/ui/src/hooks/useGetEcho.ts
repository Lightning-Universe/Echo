import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";
import { Segment } from "types/echo";

type GetEchoResponse = {
  echo: Echo;
  segments: Segment[];
};

export default function useGetEcho(echoId?: string, includeSegments?: boolean) {
  return useQuery<GetEchoResponse>(
    ["getEcho", echoId, includeSegments],
    () => echoClient.appApi.handleGetEchoApiEchoesEchoIdGet(echoId!, includeSegments ?? false),
    { enabled: !!echoId && !!includeSegments },
  );
}
