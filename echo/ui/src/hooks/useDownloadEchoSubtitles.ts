import { useCallback } from "react";

import { Echo } from "generated";
import { Segment } from "types/echo";
import { convertToSubtitles } from "utils/subtitles";

export default function useDownloadEchoSubtitles() {
  return useCallback((echo: Echo, segments: Segment[]) => {
    const srtFile = convertToSubtitles(segments);

    const blob = new Blob([srtFile], { type: "text/plain" });
    const objectURL = window.URL.createObjectURL(blob);

    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = `${echo.displayName ?? echo.id}.srt`;

    document.body.appendChild(elem);

    elem.click();

    document.body.removeChild(elem);
    window.URL.revokeObjectURL(objectURL);
  }, []);
}
