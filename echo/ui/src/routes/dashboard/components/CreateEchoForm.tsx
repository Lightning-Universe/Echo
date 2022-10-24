import { useEffect, useRef, useState } from "react";

import { Stack } from "@mui/material";

import { TextField } from "lightning-ui/src/design-system/components";
import { EchoSourceType, videoMaxDurationSeconds } from "utils";

const displayNamePlaceholder = "Five Easy Tricks to Learning ML";
const youtubeVideoPlaceholder = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

type Props = {
  sourceType: EchoSourceType;
  displayNameUpdated: (displayName: string) => void;
  youtubeURLUpdated: (url: string) => void;
};

export default function CreateEchoForm({ sourceType, youtubeURLUpdated, displayNameUpdated }: Props) {
  const [displayName, setDisplayName] = useState(displayNamePlaceholder);
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState(youtubeVideoPlaceholder);

  const displayNameInput = useRef<HTMLInputElement>(null);
  const youtubeURLInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clear placeholders on input click
    if (displayNameInput.current) {
      displayNameInput.current.addEventListener("click", () => {
        setDisplayName(currentValue => (currentValue === displayNamePlaceholder ? "" : currentValue));
      });
    }

    if (youtubeURLInput.current) {
      youtubeURLInput.current.addEventListener("click", () => {
        setSourceYouTubeURL(currentValue => (currentValue === youtubeVideoPlaceholder ? "" : currentValue));
      });
    }
  }, []);

  useEffect(() => {
    displayNameUpdated(displayName);
  }, [displayName, displayNameUpdated]);

  useEffect(() => {
    youtubeURLUpdated(sourceYouTubeURL);
  }, [sourceYouTubeURL, youtubeURLUpdated]);

  return (
    <Stack direction={"column"} spacing={4} maxWidth={"75vh"}>
      <TextField
        label={"Name"}
        data-cy={"create-echo-name"}
        placeholder={displayNamePlaceholder}
        helperText={"Give your Echo a name based on the content."}
        value={displayName}
        onChange={value => setDisplayName(value ?? "")}
        ref={displayNameInput}
        optional={false}
      />
      {sourceType === EchoSourceType.youtube && (
        <TextField
          label={"YouTube URL"}
          placeholder={youtubeVideoPlaceholder}
          data-cy={"create-echo-youtube-url"}
          value={sourceYouTubeURL}
          onChange={value => setSourceYouTubeURL(value ?? "")}
          ref={youtubeURLInput}
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
