import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

type Segment = {
  id: string;
  seek: number;
  start: number;
  end: number;
  text: string;
};

type GetEchoResponse = {
  echo: Echo;
  segments: Segment[];
};

export default function useGetEcho(echoId?: string, includeSegments?: boolean) {
  return useQuery<GetEchoResponse>(
    "getEcho",
    () => echoClient.appClientCommand.getEchoCommandGetEchoPost({ echoId: echoId!, includeSegments }),
    { enabled: !!echoId && !!includeSegments },
  );
}
