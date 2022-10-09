import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import { SupportedMediaType } from "utils";

import { useLightningState } from "./useLightningState";

type CreateEchoArgs = {
  echoID: string;
  displayName: string;
  sourceFile?: Blob;
  sourceYouTubeURL?: string;
  mediaType: SupportedMediaType;
};

export default function useCreateEcho() {
  const queryClient = useQueryClient();
  const lightningState = useLightningState();

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];

  return useMutation(
    async ({ echoID, sourceFile, mediaType, displayName, sourceYouTubeURL }: CreateEchoArgs) => {
      if (sourceFile !== undefined) {
        // Upload source file to fileserver
        const body = new FormData();
        body.append("file", sourceFile);

        const uploadURL = `${fileserverURL}/upload/${echoID}`;
        await fetch(uploadURL, { body, method: "PUT" });
      }

      return echoClient.appClientCommand.createEchoCommandCreateEchoPost({
        id: echoID,
        displayName,
        sourceYoutubeUrl: sourceYouTubeURL,
        sourceFilePath: `fileserver/${echoID}`,
        mediaType: mediaType,
        text: "",
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("listEchoes");
      },
    },
  );
}
