import { Stack, Typography } from "@mui/material";

import { Segment } from "types/echo";
import { secondsToTime } from "utils/time";

type Props = {
  segments: Segment[];
  currentSegment: number;
};

export default function Subtitles({ segments, currentSegment }: Props) {
  const formatStartTime = (startTime: number) => secondsToTime(Math.floor(startTime));

  return (
    <Stack direction={"column"} spacing={1}>
      {currentSegment > 1 && (
        <Stack direction={"row"} spacing={4}>
          <Typography variant={"body2"} color={"default"}>
            {formatStartTime(segments[currentSegment - 2].start)}
          </Typography>
          <Typography variant={"body2"} color={"default"}>
            {segments[currentSegment - 2].text}
          </Typography>
        </Stack>
      )}
      {currentSegment > 0 && (
        <Stack direction={"row"} spacing={4}>
          <Typography variant={"body2"} color={"default"}>
            {formatStartTime(segments[currentSegment - 1].start)}
          </Typography>
          <Typography variant={"body2"} color={"default"}>
            {segments[currentSegment - 1].text}
          </Typography>
        </Stack>
      )}
      <Stack direction={"row"} spacing={4}>
        <Typography variant={"body2"} color={"primary"}>
          {formatStartTime(segments[currentSegment].start)}
        </Typography>
        <Typography variant={"body2"} color={"primary"}>
          {segments[currentSegment].text}
        </Typography>
      </Stack>
    </Stack>
  );
}
