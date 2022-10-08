import { useRef } from "react";

import { Stack } from "@mui/material";

type Props = {
  sourceFileURL: string;
};

export default function AudioPreview(props: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <Stack>
      <audio ref={audioRef} src={props.sourceFileURL} controls />
    </Stack>
  );
}
