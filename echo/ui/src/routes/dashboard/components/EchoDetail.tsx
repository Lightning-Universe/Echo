import { useCallback, useState } from "react";

import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Stack, Typography } from "@mui/material";

import { Echo } from "generated";
import useGetEcho from "hooks/useGetEcho";
import { useLightningState } from "hooks/useLightningState";
import { SupportedMediaType, isVideo } from "utils";

import AudioPreview from "./AudioPreview";
import VideoPreview from "./VideoPreview";

type Props = {
  echo?: Echo;
};

export default function EchoDetail({ echo }: Props) {
  const lightningState = useLightningState();

  const { data } = useGetEcho(echo?.id ?? "", true);

  const [currentSegment, setCurrentSegment] = useState(0);

  const onCurrentTimeChange = useCallback(
    (currentTime: number) => {
      const segment = data?.segments.find(segment => segment.start <= currentTime && segment.end >= currentTime);
      if (segment) {
        setCurrentSegment(Number(segment.id.split("-")[segment.id.split("-").length - 1]));
      }
    },
    [data?.segments],
  );

  if (!echo) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} height={"100%"}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>Select an Echo to view details</Typography>
      </Stack>
    );
  }

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];
  const sourceFileURL = `${fileserverURL}/download/${echo.id}`;

  const sourcePreview = isVideo(echo.mediaType as SupportedMediaType) ? (
    <VideoPreview sourceFileURL={sourceFileURL} onCurrentTimeChange={onCurrentTimeChange} />
  ) : (
    <AudioPreview sourceFileURL={sourceFileURL} />
  );

  return (
    <Stack direction={"column"}>
      <Typography variant={"h6"}>{echo.displayName ?? echo.id}</Typography>
      <Stack direction={"row"} justifyContent={"center"}>
        {sourcePreview}
      </Stack>
      {currentSegment >= 0 && (
        <Stack direction={"column"} minHeight={"100px"} height={"100px"}>
          {currentSegment > 0 && (
            <Typography variant={"body2"}>"{data?.segments[currentSegment - 1].text.trim()}"</Typography>
          )}
          <Typography variant={"body1"}>"{data?.segments[currentSegment].text.trim()}"</Typography>
          {/* <Typography variant={"body2"}>"{data?.segments[currentSegment + 1].text.trim()}"</Typography> */}
        </Stack>
      )}
    </Stack>
  );
}
