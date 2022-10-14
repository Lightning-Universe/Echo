/**
 * NOTE: Keep in sync with `echo/commands/echo.py`
 */
export enum SupportedMediaType {
  audioWAV = "audio/wav",
  audioXWAV = "audio/x-wav",
  audioMP3 = "audio/mp3",
  audioMPEG = "audio/mpeg",
  audioM4A = "audio/m4a",
  audioOGG = "audio/ogg",
  audioFLAC = "audio/flac",

  videoMP4 = "video/mp4",
}

export enum EchoSourceType {
  recording = "recording",
  file = "file",
  youtube = "youtube",
}

export const enabledEchoSourceTypes = new Map<EchoSourceType, boolean>()
  .set(EchoSourceType.file, process.env.REACT_APP_ECHO_SOURCE_TYPE_FILE_ENABLED !== "false")
  .set(EchoSourceType.recording, process.env.REACT_APP_ECHO_SOURCE_TYPE_RECORDING_ENABLED !== "false")
  .set(EchoSourceType.youtube, process.env.REACT_APP_ECHO_SOURCE_TYPE_YOUTUBE_ENABLED !== "false");

export const isAudio = (mediaType: SupportedMediaType) => mediaType.split("/")[0] === "audio";
export const isVideo = (mediaType: SupportedMediaType) => mediaType.split("/")[0] === "video";

export function getUrl() {
  let url = window.location !== window.parent.location ? document.referrer : document.location.href;
  url = url.replace(/\/$/, "").replace("/view/home", "");

  return url;
}
