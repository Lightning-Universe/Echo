import { useMutation } from "react-query";
import { echoClient } from "services/echoClient";

import { CancelablePromise } from "generated";
import { SupportedMediaType } from "utils";

import useAuth from "./useAuth";

type CreateEchoArgs = {
  echoID: string;
  displayName: string;
  sourceYouTubeURL?: string;
  mediaType: SupportedMediaType;
};

type ValidateEchoResponse = {
  valid: boolean;
  reason?: string;
};

export default function useValidateEcho() {
  const { userId } = useAuth();

  return useMutation(({ echoID, displayName, sourceYouTubeURL, mediaType }: CreateEchoArgs) => {
    return echoClient.appApi.handleValidateEchoApiValidatePost({
      id: echoID,
      userId,
      displayName,
      sourceYoutubeUrl: sourceYouTubeURL,
      sourceFilePath: `fileserver/${echoID}`,
      mediaType: mediaType,
      text: "",
    }) as CancelablePromise<ValidateEchoResponse>;
  });
}
