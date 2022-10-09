import { useEffect, useRef } from "react";

import { Stack } from "@mui/material";

type Props = {
  sourceFileURL: string;
  onCurrentTimeChange: (currentTime: number) => void;
};

export default function VideoPreview({ sourceFileURL, onCurrentTimeChange }: Props) {
  const videoPlayer = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoPlayer.current) {
      const interval = setInterval(() => {
        if (videoPlayer.current?.currentTime) {
          onCurrentTimeChange(videoPlayer.current.currentTime!);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [onCurrentTimeChange]);

  return (
    <Stack height={"100%"} width={"100%"} padding={2}>
      <video height={"100%"} ref={videoPlayer} src={sourceFileURL} controls />
    </Stack>
  );
}
