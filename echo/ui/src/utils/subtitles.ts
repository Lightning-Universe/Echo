import { Segment } from "types/echo";

import { secondsToTime } from "./time";

/**
 * Returns the SRT file contents for the given segments.
 */
export const convertToSubtitles = (segments: Segment[]) => {
  return segments
    .map(({ start, end, text }, index) => {
      const startTime = secondsToTime(start);
      const endTime = secondsToTime(end);

      return `${index + 1}
${startTime},000 --> ${endTime},000
${text}
`;
    })
    .join("\n");
};
