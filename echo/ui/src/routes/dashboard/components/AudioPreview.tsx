import { useEffect, useRef } from "react";

import { Stack } from "@mui/material";

type Props = {
  sourceFileURL: string;
  playFrom: number;
  onCurrentTimeChange: (currentTime: number) => void;
};

export default function AudioPreview({ sourceFileURL, playFrom, onCurrentTimeChange }: Props) {
  const audioPlayer = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.currentTime = playFrom;
    }
  }, [playFrom]);

  useEffect(() => {
    if (audioPlayer.current) {
      const interval = setInterval(() => {
        if (audioPlayer.current?.currentTime) {
          onCurrentTimeChange(audioPlayer.current.currentTime!);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [onCurrentTimeChange]);

  return (
    <Stack height={"100%"} width={"100%"} padding={2}>
      <audio style={{ width: "100%" }} src={sourceFileURL} ref={audioPlayer} controls />
    </Stack>
  );
}
