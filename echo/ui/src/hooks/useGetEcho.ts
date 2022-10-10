import { useQuery } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

import useAuth from "./useAuth";

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
  const { userId } = useAuth();

  return useQuery<GetEchoResponse>(
    "getEcho",
    () => echoClient.appClientCommand.getEchoCommandGetEchoPost({ userId, echoId: echoId!, includeSegments }),
    { enabled: !!echoId && !!includeSegments },
  );
}
