import { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { useState } from "react";

import AudioFileIcon from "@mui/icons-material/AudioFile";
import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import { CircularProgress, Fab, LinearProgress, SpeedDial, SpeedDialAction, Stack, Zoom } from "@mui/material";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { useReactMediaRecorder } from "react-media-recorder";
import { v4 as uuidv4 } from "uuid";

import useCreateEcho from "hooks/useCreateEcho";
import { SupportedMediaType } from "utils";

enum EchoSourceType {
  recording = "recording",
  file = "file",
}

type Props = {
  onCreateEcho: (echoID: string) => void;
};

export default function RecordEcho({ onCreateEcho }: Props) {
  const [sourceType, setSourceType] = useState<EchoSourceType>();
  const [sourceBlob, setSourceBlob] = useState<Blob>();
  const [sourceBlobURL, setSourceBlobURL] = useState<string>();
  const [sourceMediaType, setSourceMediaType] = useState<SupportedMediaType>();
  const sourceFileInput = useRef<HTMLInputElement>(null);

  const createEchoMutation = useCreateEcho();

  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    video: false,
    audio: true,
    onStop: (blobUrl, blob) => {
      setSourceBlob(blob);
      setSourceBlobURL(blobUrl);
    },
  });

  const createEcho = useCallback(async () => {
    if (sourceBlob && sourceMediaType) {
      const echoID = uuidv4();

      createEchoMutation.mutate({ echoID, sourceFile: sourceBlob, mediaType: sourceMediaType });
      clearBlobUrl();
      onCreateEcho(echoID);
    }
  }, [sourceBlob, clearBlobUrl, createEchoMutation, sourceMediaType, onCreateEcho]);

  useEffect(() => {
    if (createEchoMutation.isSuccess) {
      createEchoMutation.reset();

      setSourceType(undefined);
      setSourceMediaType(undefined);
      setSourceBlob(undefined);
      setSourceBlobURL(undefined);

      if (mediaBlobUrl) {
        clearBlobUrl();
      }
    }
  }, [createEchoMutation, clearBlobUrl, mediaBlobUrl]);

  const selectRecording = useCallback(() => {
    setSourceType(EchoSourceType.recording);
    // FIXME(alecmerdler): Make sure this is correct...
    setSourceMediaType(SupportedMediaType.audioWAV);
    startRecording();
  }, [startRecording]);

  const selectSourceFile = useCallback(() => {
    if (sourceFileInput.current) {
      sourceFileInput.current.click();
    }
  }, []);

  const sourceFileSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSourceType(EchoSourceType.file);
      // FIXME(alecmerdler): More accurate media type detection...
      setSourceMediaType(e.target.files[0].type as SupportedMediaType);
      setSourceBlob(e.target.files[0]);
      setSourceBlobURL(URL.createObjectURL(e.target.files[0]));
    }
  }, []);

  const discardSource = useCallback(() => {
    setSourceType(undefined);
    setSourceMediaType(undefined);
    setSourceBlob(undefined);
    setSourceBlobURL(undefined);

    if (mediaBlobUrl) {
      clearBlobUrl();
    }
  }, [clearBlobUrl, mediaBlobUrl]);

  const showSourceSelect = !createEchoMutation.isLoading && sourceType === undefined;
  const showControls = !createEchoMutation.isLoading && sourceBlob !== undefined;

  return (
    <Stack direction={"column"}>
      <Stack direction={"row"} justifyContent={"flex-end"}>
        {createEchoMutation.isLoading && <CircularProgress variant={"indeterminate"} />}
        {showSourceSelect && (
          <SpeedDial
            data-cy={"create-echo-speed-dial"}
            ariaLabel="Create Echo"
            direction={"left"}
            hidden={recordingStatus !== "idle"}
            icon={<SpeedDialIcon sx={{ color: "#FFFFFF" }} openIcon={<GraphicEqIcon htmlColor="#FFFFFF" />} />}>
            <SpeedDialAction
              data-cy={"create-echo-microphone"}
              icon={<KeyboardVoiceIcon />}
              onClick={selectRecording}
              tooltipTitle={"Record Audio"}
            />
            <SpeedDialAction
              data-cy={"create-echo-audio-upload"}
              icon={<AudioFileIcon />}
              onClick={selectSourceFile}
              tooltipTitle={"Choose Audio File"}
            />
            <SpeedDialAction
              data-cy={"create-echo-video-upload"}
              icon={<VideoFileIcon />}
              onClick={selectSourceFile}
              tooltipTitle={"Choose Video File"}
            />
            {/* Hidden source file input */}
            <input
              ref={sourceFileInput}
              hidden
              type="file"
              accept={Object.values(SupportedMediaType).join(",")}
              onChange={sourceFileSelected}
            />
          </SpeedDial>
        )}
        {recordingStatus === "recording" && (
          <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} width={"100%"}>
            {/* TODO(alecmerdler): Use this instead: https://mui.com/material-ui/react-progress/#interactive-integration */}
            <LinearProgress sx={{ width: "70%" }} />
            <Zoom
              in={recordingStatus === "recording"}
              style={{ transitionDelay: recordingStatus === "recording" ? "100ms" : "0ms" }}>
              <Fab data-cy={"stop-recording"} color={"error"} onClick={stopRecording}>
                <StopIcon htmlColor="#FFFFFF" />
              </Fab>
            </Zoom>
          </Stack>
        )}
        {showControls && (
          <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} width={"100%"}>
            <Zoom in={showControls} style={{ transitionDelay: showControls ? "100ms" : "0ms" }}>
              <Fab data-cy={"discard-source"} color={"error"} onClick={discardSource}>
                <DeleteIcon htmlColor="#FFFFFF" />
              </Fab>
            </Zoom>
            <Zoom in={showControls} style={{ transitionDelay: showControls ? "100ms" : "0ms" }}>
              <audio
                data-cy={"echo-source-preview"}
                src={sourceBlobURL}
                controls
                controlsList={"nodownload nofullscreen noremoteplayback noplaybackrate"}
                style={{ width: "60%" }}
              />
            </Zoom>
            <Zoom in={showControls} style={{ transitionDelay: showControls ? "100ms" : "0ms" }}>
              <Fab data-cy={"create-echo-confirm"} color={"primary"} onClick={createEcho}>
                <SendIcon htmlColor="#FFFFFF" />
              </Fab>
            </Zoom>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
