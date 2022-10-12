import { useEffect, useRef } from "react";

import { Stack } from "@mui/material";

type Props = {
  sourceFileURL: string;
  onCurrentTimeChange: (currentTime: number) => void;
};

export default function AudioPreview({ sourceFileURL, onCurrentTimeChange }: Props) {
  const audioPlayer = useRef<HTMLAudioElement>(null);

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

  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.addEventListener("error", () => {
        if (audioPlayer.current) {
          // FIXME(alecmerdler): Debugging
          alert(`Error ${audioPlayer.current.error?.code}; details: ${audioPlayer.current.error?.message}`);
        }
      });
    }
  });

  return (
    <Stack height={"100%"} width={"100%"} padding={2}>
      <audio style={{ width: "100%" }} src={sourceFileURL} ref={audioPlayer} controls />
    </Stack>
  );
}
