import { useCallback } from "react";

import { Echo } from "generated";

export default function useDownloadEcho() {
  return useCallback((echo: Echo) => {
    const blob = new Blob([echo.text ?? ""], { type: "text/plain" });
    const objectURL = window.URL.createObjectURL(blob);

    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = `${echo.displayName ?? echo.id}.txt`;

    document.body.appendChild(elem);

    elem.click();

    document.body.removeChild(elem);
    window.URL.revokeObjectURL(objectURL);
  }, []);
}
