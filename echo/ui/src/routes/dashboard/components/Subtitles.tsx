import { useEffect } from "react";

import { Stack, Typography } from "@mui/material";

import { Segment } from "types/echo";
import { secondsToTime } from "utils/time";

const subtitleIDFor = (segment: number) => `echo-subtitle-${segment}`;

type Props = {
  segments: Segment[];
  currentSegment: number;
  onSelectTimestamp: (timestamp: number) => void;
};

export default function Subtitles({ segments, currentSegment, onSelectTimestamp }: Props) {
  const formatStartTime = (startTime: number) => secondsToTime(Math.floor(startTime));

  useEffect(() => {
    const element = document.getElementById(subtitleIDFor(currentSegment));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentSegment]);

  return (
    <Stack direction={"column"} spacing={1}>
      {segments.map((segment, index) => (
        <Stack
          id={subtitleIDFor(index)}
          data-cy={`subtitle-${index}`}
          key={segment.id}
          direction={"row"}
          spacing={4}
          sx={{
            cursor: "pointer",
          }}
          onClick={() => onSelectTimestamp(segment.start)}>
          <Typography variant={"body2"} color={index === currentSegment ? "primary" : "default"}>
            {formatStartTime(segment.start)}
          </Typography>
          <Typography variant={"body2"} color={index === currentSegment ? "primary" : "default"}>
            {segment.text}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
