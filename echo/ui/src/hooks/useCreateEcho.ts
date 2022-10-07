import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import { useLightningState } from "./useLightningState";

/**
 * NOTE: Keep in sync with `echo/commands/echo.py`
 */
export enum SupportedMediaType {
  audioWAV = "audio/wav",
  audioXWAV = "audio/x-wav",
  audioMP3 = "audio/mp3",
  audioMPEG = "audio/mpeg",
  audioM4A = "audio/m4a",
  audioOGG = "audio/ogg",
  audioFLAC = "audio/flac",

  videoMP4 = "video/mp4",
}

type CreateEchoArgs = {
  echoID: string;
  sourceFile: Blob;
  mediaType: SupportedMediaType;
};

export default function useCreateEcho() {
  const queryClient = useQueryClient();
  const lightningState = useLightningState();

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];

  return useMutation(
    async ({ echoID, sourceFile, mediaType }: CreateEchoArgs) => {
      // Upload source file to fileserver
      const body = new FormData();
      body.append("file", sourceFile);

      const uploadURL = `${fileserverURL}/upload/${echoID}`;
      await fetch(uploadURL, { body, method: "PUT" });

      return echoClient.appClientCommand.createEchoCommandCreateEchoPost({
        id: echoID,
        displayName: "My Echo",
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
