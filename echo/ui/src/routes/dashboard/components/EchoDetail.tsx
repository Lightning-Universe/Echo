import { useCallback, useEffect, useState } from "react";

import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { CircularProgress, Stack, Typography } from "@mui/material";

import useGetEcho from "hooks/useGetEcho";
import { useLightningState } from "hooks/useLightningState";
import { SupportedMediaType, isVideo } from "utils";

import AudioPreview from "./AudioPreview";
import VideoPreview from "./VideoPreview";

type Props = {
  echoID?: string;
};

export default function EchoDetail({ echoID }: Props) {
  const lightningState = useLightningState();

  const { data: echo } = useGetEcho(echoID ?? "", true);

  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    setCurrentSegment(0);
  }, [echoID]);

  const onCurrentTimeChange = useCallback(
    (currentTime: number) => {
      const segment = echo?.segments.find(segment => segment.start <= currentTime && segment.end >= currentTime);
      if (segment) {
        setCurrentSegment(Number(segment.id.split("-")[segment.id.split("-").length - 1]));
      }
    },
    [echo?.segments],
  );

  if (!echo) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} height={"100%"}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>Select an Echo to view details</Typography>
      </Stack>
    );
  }

  if (!echo || !echo.segments || echo.segments.length === 0) {
    return (
      <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} spacing={2} height={"100%"}>
        <CircularProgress />
        <Typography variant={"body2"}>Echo is processing, please wait</Typography>
      </Stack>
    );
  }

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];
  const sourceFileURL = `${fileserverURL}/download/${echo.echo.id}`;

  const sourcePreview = isVideo(echo.echo.mediaType as SupportedMediaType) ? (
    <VideoPreview sourceFileURL={sourceFileURL} onCurrentTimeChange={onCurrentTimeChange} />
  ) : (
    <AudioPreview sourceFileURL={sourceFileURL} />
  );

  return (
    <Stack direction={"column"}>
      <Typography variant={"h6"}>{echo.echo.displayName ?? echo.echo.id}</Typography>
      <Stack direction={"row"} justifyContent={"center"}>
        {sourcePreview}
      </Stack>
      {echo?.segments && echo.segments.length > 0 && currentSegment >= 0 && (
        <Stack>
          <Typography variant={"body2"}>"{echo?.segments[currentSegment].text.trim()}"</Typography>
        </Stack>
      )}
    </Stack>
  );
}
