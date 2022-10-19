import { useCallback, useState } from "react";

import { Stack } from "@mui/material";

import { TextField } from "lightning-ui/src/design-system/components";
import { EchoSourceType, videoMaxDurationSeconds } from "utils";

type Props = {
  sourceType: EchoSourceType;
  displayNameUpdated: (displayName: string) => void;
  youtubeURLUpdated: (url: string) => void;
};

export default function CreateEchoForm({ sourceType, youtubeURLUpdated, displayNameUpdated }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState("");

  const onDisplayNameUpdated = useCallback(
    (displayName: string) => {
      setDisplayName(displayName);
      displayNameUpdated(displayName);
    },
    [displayNameUpdated],
  );

  const onChangeYouTubeURL = useCallback(
    (url: string) => {
      setSourceYouTubeURL(url);
      youtubeURLUpdated(url);
    },
    [youtubeURLUpdated],
  );

  return (
    <Stack direction={"column"} spacing={4} maxWidth={"75vh"}>
      <TextField
        label={"Name"}
        placeholder={"My Echo"}
        helperText={'Give your Echo a name based on the content (e.g. "Commencement Speech 2014")'}
        value={displayName}
        onChange={value => onDisplayNameUpdated(value ?? "")}
        optional={false}
      />
      {sourceType === EchoSourceType.youtube && (
        <TextField
          label={"YouTube URL"}
          placeholder={"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
          value={sourceYouTubeURL}
          onChange={value => onChangeYouTubeURL(value ?? "")}
          helperText={
            videoMaxDurationSeconds
              ? `Video must be less than ${(videoMaxDurationSeconds / 60).toFixed(0)} minutes long.`
              : ""
          }
          optional={false}
        />
      )}
    </Stack>
  );
}
