import { useEffect, useRef } from "react";

import { Stack } from "@mui/material";

type Props = {
  sourceFileURL: string;
  playFrom: number;
  onCurrentTimeChange: (currentTime: number) => void;
};

export default function VideoPreview({ sourceFileURL, playFrom, onCurrentTimeChange }: Props) {
  const videoPlayer = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoPlayer.current) {
      videoPlayer.current.currentTime = playFrom;
    }
  }, [playFrom]);

  useEffect(() => {
    if (videoPlayer.current) {
      const interval = setInterval(() => {
        if (videoPlayer.current?.currentTime) {
          onCurrentTimeChange(videoPlayer.current.currentTime!);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [onCurrentTimeChange]);

  return (
    <Stack height={"100%"} width={"100%"} paddingY={2}>
      <video data-cy={"video-preview"} height={"100%"} ref={videoPlayer} src={sourceFileURL} controls />
    </Stack>
  );
}
