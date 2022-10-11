import { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { useState } from "react";

import AudioFileIcon from "@mui/icons-material/AudioFile";
import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import StopIcon from "@mui/icons-material/Stop";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {
  Box,
  CircularProgress,
  Fab,
  LinearProgress,
  SpeedDial,
  SpeedDialAction,
  Stack,
  Typography,
  Zoom,
} from "@mui/material";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { useReactMediaRecorder } from "react-media-recorder";
import { v4 as uuidv4 } from "uuid";

import useCreateEcho from "hooks/useCreateEcho";
import { EchoSourceType, SupportedMediaType } from "utils";

type Props = {
  echoDisplayName?: string;
  sourceYouTubeURL?: string;
  onSelectSourceType: (sourceType?: EchoSourceType) => void;
  onCreateEcho: (echoID: string) => void;
  onCancel: () => void;
};

export default function RecordEcho({
  onCreateEcho,
  onSelectSourceType,
  echoDisplayName,
  sourceYouTubeURL,
  onCancel,
}: Props) {
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
    const echoID = uuidv4();

    if (!sourceType || !sourceMediaType) {
      return;
    }

    switch (sourceType) {
      case EchoSourceType.youtube:
        if (sourceYouTubeURL) {
          createEchoMutation.mutate({
            echoID,
            displayName: echoDisplayName ?? echoID,
            sourceYouTubeURL,
            mediaType: sourceMediaType,
          });
        }

        return onCreateEcho(echoID);
      case EchoSourceType.recording:
      case EchoSourceType.file:
        if (sourceBlob) {
          createEchoMutation.mutate({
            echoID,
            displayName: echoDisplayName ?? echoID,
            sourceFile: sourceBlob,
            mediaType: sourceMediaType,
          });

          clearBlobUrl();

          return onCreateEcho(echoID);
        }
    }
  }, [
    sourceBlob,
    clearBlobUrl,
    createEchoMutation,
    sourceMediaType,
    onCreateEcho,
    echoDisplayName,
    sourceType,
    sourceYouTubeURL,
  ]);

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
    setSourceMediaType(SupportedMediaType.audioWAV);
    onSelectSourceType(EchoSourceType.recording);
  }, [onSelectSourceType]);

  const selectYouTubeURL = useCallback(() => {
    setSourceType(EchoSourceType.youtube);
    setSourceMediaType(SupportedMediaType.videoMP4);
    onSelectSourceType(EchoSourceType.youtube);
  }, [onSelectSourceType]);

  const selectSourceFile = useCallback(() => {
    if (sourceFileInput.current) {
      sourceFileInput.current.click();
    }
  }, []);

  const sourceFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setSourceType(EchoSourceType.file);
        // FIXME(alecmerdler): More accurate media type detection...
        setSourceMediaType(e.target.files[0].type as SupportedMediaType);
        setSourceBlob(e.target.files[0]);
        setSourceBlobURL(URL.createObjectURL(e.target.files[0]));

        onSelectSourceType(EchoSourceType.file);
      }
    },
    [onSelectSourceType],
  );

  const discardSource = useCallback(() => {
    setSourceType(undefined);
    setSourceMediaType(undefined);
    setSourceBlob(undefined);
    setSourceBlobURL(undefined);
    onSelectSourceType(undefined);
    onCancel();

    if (mediaBlobUrl) {
      clearBlobUrl();
    }
  }, [clearBlobUrl, mediaBlobUrl, onSelectSourceType, onCancel]);

  const showSourceSelect = !createEchoMutation.isLoading && sourceType === undefined;
  const showRecordingControls =
    !createEchoMutation.isLoading && sourceType === EchoSourceType.recording && sourceBlob === undefined;
  const showPlaybackControls =
    !createEchoMutation.isLoading && (sourceType === EchoSourceType.youtube || sourceBlob !== undefined);

  if (showSourceSelect) {
    return (
      <Stack direction={"row"} justifyContent={"flex-end"} width={"100%"}>
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
            data-cy={"create-echo-youtube"}
            icon={<YouTubeIcon />}
            onClick={selectYouTubeURL}
            tooltipTitle={"YouTube URL"}
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
      </Stack>
    );
  }

  if (showRecordingControls) {
    return (
      <Stack direction={"row"} width={"100%"} alignItems={"center"} spacing={2}>
        <Zoom
          in={recordingStatus !== "recording" && sourceBlob === undefined}
          style={{ transitionDelay: showRecordingControls ? "100ms" : "0ms" }}>
          <Fab data-cy={"discard-source"} color={"error"} onClick={discardSource}>
            <DeleteIcon htmlColor="#FFFFFF" />
          </Fab>
        </Zoom>
        <Zoom
          in={sourceType === EchoSourceType.recording && sourceBlob === undefined}
          style={{ transitionDelay: sourceType === EchoSourceType.recording ? "100ms" : "0ms" }}>
          <Box sx={{ m: 1, position: "relative" }}>
            <Fab
              data-cy={"start-recording"}
              disabled={sourceBlob !== undefined || recordingStatus === "recording"}
              color={"primary"}
              onClick={() => startRecording()}>
              <KeyboardVoiceIcon htmlColor="#FFFFFF" />
            </Fab>
            {recordingStatus === "recording" && (
              <CircularProgress size={68} sx={{ position: "absolute", top: -6, left: -6, zIndex: 1 }} />
            )}
          </Box>
        </Zoom>
        <Zoom
          in={recordingStatus === "recording"}
          style={{ transitionDelay: recordingStatus === "recording" ? "100ms" : "0ms" }}>
          <Fab data-cy={"stop-recording"} color={"error"} onClick={stopRecording}>
            <StopIcon htmlColor="#FFFFFF" />
          </Fab>
        </Zoom>
      </Stack>
    );
  }

  if (createEchoMutation.isLoading) {
    return (
      <Stack direction={"row"} width={"100%"} alignItems={"center"} spacing={4}>
        <LinearProgress sx={{ width: "50%" }} />
        <Typography variant={"body1"}>Uploading Echo</Typography>
      </Stack>
    );
  }

  if (showPlaybackControls) {
    return (
      <Stack direction={"row"} alignItems={"center"} width={"100%"} spacing={2}>
        {sourceType !== EchoSourceType.youtube && (
          <Zoom in={showPlaybackControls} style={{ transitionDelay: showPlaybackControls ? "100ms" : "0ms" }}>
            <audio
              data-cy={"echo-source-preview"}
              src={sourceBlobURL}
              controls
              controlsList={"nodownload nofullscreen noremoteplayback noplaybackrate"}
              style={{ width: "30%" }}
            />
          </Zoom>
        )}
        <Zoom in={showPlaybackControls} style={{ transitionDelay: showPlaybackControls ? "100ms" : "0ms" }}>
          <Fab data-cy={"discard-source"} color={"error"} onClick={discardSource}>
            <DeleteIcon htmlColor="#FFFFFF" />
          </Fab>
        </Zoom>
        <Zoom in={showPlaybackControls} style={{ transitionDelay: showPlaybackControls ? "100ms" : "0ms" }}>
          <Fab
            data-cy={"create-echo-confirm"}
            color={"primary"}
            onClick={createEcho}
            variant={"extended"}
            sx={{ color: "#FFFFFF" }}
            disabled={!echoDisplayName || (sourceType === EchoSourceType.youtube && sourceYouTubeURL === undefined)}>
            Create
          </Fab>
        </Zoom>
      </Stack>
    );
  }

  return null;
}
