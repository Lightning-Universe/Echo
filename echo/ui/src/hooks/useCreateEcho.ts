import { useMutation, useQueryClient } from "react-query";
import { echoClient } from "services/echoClient";

import { Echo } from "generated";
import { SupportedMediaType } from "utils";

import useAuth from "./useAuth";
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
  const { userId } = useAuth();

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];
  const checkoutURL = lightningState?.flows["stripe"]["vars"]["create_checkout_session_url"];

  return useMutation<Echo, unknown, CreateEchoArgs>(
    async ({ echoID, sourceFile, mediaType, displayName, sourceYouTubeURL }) => {
      if (sourceFile !== undefined) {
        // Upload source file to fileserver
        const body = new FormData();
        body.append("file", sourceFile);

        const uploadURL = `${fileserverURL}/upload/${echoID}`;
        await fetch(uploadURL, { body, method: "PUT" });
      }

      return echoClient.appApi.handleCreateEchoApiEchoesPost({
        id: echoID,
        userId,
        displayName,
        sourceYoutubeUrl: sourceYouTubeURL,
        sourceFilePath: `fileserver/${echoID}`,
        mediaType: mediaType,
        text: "",
      });
    },
    {
      onSuccess: echo => {
        queryClient.invalidateQueries("listEchoes");

        if (process.env.REACT_APP_STRIPE_ENABLED === "true") {
          window.open(`${checkoutURL}?id=${echo.id}`, "_blank");
        }
      },
    },
  );
}
