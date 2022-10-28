import { useQuery, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";

import useAuth from "./useAuth";
import { useRecordEcho } from "./useRecordEcho";

const refetchInterval = 1000;

export default function useListEchoes() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { isRecording } = useRecordEcho();

  return useQuery<Echo[]>("listEchoes", () => echoClient.appApi.handleListEchoesApiEchoesGet(userId!), {
    enabled: !!userId,
    refetchInterval: echoes =>
      !isRecording && (echoes?.some(echo => !echo.completedTranscriptionAt) ? refetchInterval : false),
    onSuccess: () => {
      queryClient.invalidateQueries(["getEcho"]);
    },
  });
}
