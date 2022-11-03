import React, { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { useState } from "react";

import { Send } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import StopCircle from "@mui/icons-material/StopCircle";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Divider,
  Fab,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Zoom,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useReactMediaRecorder } from "react-media-recorder";
import { v4 as uuidv4 } from "uuid";

import useCreateEcho from "hooks/useCreateEcho";
import { useRecordEcho } from "hooks/useRecordEcho";
import useValidateEcho from "hooks/useValidateEcho";
import { Button } from "lightning-ui/src/design-system/components";
import { EchoSourceType, SupportedMediaType, enabledEchoSourceTypes, recordingMaxDurationSeconds } from "utils";
import { secondsToTime } from "utils/time";

import AudioWaveform from "./AudioWaveform";

const echoGalleryURL = "https://lightning.ai/app/HvUwbEG90H-Echo";

type Props = {
  echoDisplayName?: string;
  sourceYouTubeURL?: string;
  onSelectSourceType: (sourceType?: EchoSourceType) => void;
  onCreateEcho: (echoID: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

export default function RecordEcho({
  onCreateEcho,
  onSelectSourceType,
  echoDisplayName,
  sourceYouTubeURL,
  onCancel,
  disabled,
  disabledReason,
}: Props) {
  const [sourceType, setSourceType] = useState<EchoSourceType>();
  const [sourceBlob, setSourceBlob] = useState<Blob>();
  const [sourceBlobURL, setSourceBlobURL] = useState<string>();
  const [sourceMediaType, setSourceMediaType] = useState<SupportedMediaType>();
  const sourceFileInput = useRef<HTMLInputElement>(null);
  const [sourceSelectAnchor, setSourceSelectAnchor] = useState<HTMLElement | null>(null);
  const recordingTimeElapsed = useRef(0);

  const theme = useTheme();
  const onMobile = useMediaQuery(theme.breakpoints.down("md"));

  const createEchoMutation = useCreateEcho();
  const validateEchoMutation = useValidateEcho();
  const { setIsRecording } = useRecordEcho();

  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    previewAudioStream,
  } = useReactMediaRecorder({
    video: false,
    audio: true,
    mediaRecorderOptions: {
      mimeType: SupportedMediaType.audioWAV,
    },
    onStart: () => {
      setIsRecording(true);

      const interval = setInterval(() => {
        if (recordingTimeElapsed.current >= recordingMaxDurationSeconds) {
          stopRecording();
          clearInterval(interval);
        } else {
          recordingTimeElapsed.current += 1;
        }
      }, 1000);
    },
    onStop: (blobUrl, blob) => {
      setIsRecording(false);
      setSourceBlob(blob);
      setSourceBlobURL(blobUrl);
      recordingTimeElapsed.current = 0;
    },
  });

  const createEcho = useCallback(() => {
    const echoID = uuidv4();

    if (!sourceMediaType) {
      return;
    }

    validateEchoMutation.mutate({
      echoID,
      displayName: echoDisplayName ?? echoID,
      mediaType: sourceMediaType,
      sourceYouTubeURL,
    });
  }, [sourceMediaType, echoDisplayName, sourceYouTubeURL, validateEchoMutation]);

  useEffect(() => {
    if (validateEchoMutation.isSuccess && validateEchoMutation.data.valid) {
      validateEchoMutation.reset();

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

          break;
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

            break;
          }
      }
    }
  }, [
    sourceBlob,
    clearBlobUrl,
    createEchoMutation,
    sourceMediaType,
    echoDisplayName,
    sourceType,
    sourceYouTubeURL,
    validateEchoMutation,
  ]);

  useEffect(() => {
    if (createEchoMutation.isSuccess) {
      setSourceType(undefined);
      setSourceMediaType(undefined);
      setSourceBlob(undefined);
      setSourceBlobURL(undefined);

      if (mediaBlobUrl) {
        clearBlobUrl();
      }

      onCreateEcho(createEchoMutation.data.id);

      createEchoMutation.reset();
    }
  }, [createEchoMutation, clearBlobUrl, mediaBlobUrl, onCreateEcho]);

  const onClickSourceSelect = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setSourceSelectAnchor(event.currentTarget);
  }, []);

  const onCloseSourceSelect = useCallback(() => {
    setSourceSelectAnchor(null);
  }, []);

  const selectRecording = useCallback(() => {
    onCloseSourceSelect();
    setSourceType(EchoSourceType.recording);
    setSourceMediaType(SupportedMediaType.audioWAV);
    onSelectSourceType(EchoSourceType.recording);
  }, [onSelectSourceType, onCloseSourceSelect]);

  const selectYouTubeURL = useCallback(() => {
    onCloseSourceSelect();
    setSourceType(EchoSourceType.youtube);
    setSourceMediaType(SupportedMediaType.videoMP4);
    onSelectSourceType(EchoSourceType.youtube);
  }, [onSelectSourceType, onCloseSourceSelect]);

  const selectSourceFile = useCallback(() => {
    onCloseSourceSelect();

    if (sourceFileInput.current) {
      sourceFileInput.current.click();
    }
  }, [onCloseSourceSelect]);

  const sourceFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setSourceType(EchoSourceType.file);
        setSourceMediaType(e.target.files[0].type as SupportedMediaType);
        setSourceBlob(e.target.files[0]);
        setSourceBlobURL(URL.createObjectURL(e.target.files[0]));

        onSelectSourceType(EchoSourceType.file);
      }
    },
    [onSelectSourceType],
  );

  const discardSource = useCallback(() => {
    validateEchoMutation.reset();

    setSourceType(undefined);
    setSourceMediaType(undefined);
    setSourceBlob(undefined);
    setSourceBlobURL(undefined);
    onSelectSourceType(undefined);
    recordingTimeElapsed.current = 0;
    onCancel();

    if (mediaBlobUrl) {
      clearBlobUrl();
    }
  }, [clearBlobUrl, mediaBlobUrl, onSelectSourceType, onCancel, validateEchoMutation]);

  const showSourceSelect = !createEchoMutation.isLoading && sourceType === undefined;
  const showRecordingControls =
    !createEchoMutation.isLoading && sourceType === EchoSourceType.recording && sourceBlob === undefined;
  const showPlaybackControls =
    !createEchoMutation.isLoading && (sourceType === EchoSourceType.youtube || sourceBlob !== undefined);
  const showCreateButton = sourceType === EchoSourceType.youtube || sourceBlob !== undefined;

  if (disabled) {
    return (
      <Stack direction={"row"} justifyContent={"center"} alignItems={"center"} width={"100%"}>
        <Alert severity="warning">{disabledReason}</Alert>
      </Stack>
    );
  }

  const menuItemRecording = (
    <MenuItem
      disabled={!enabledEchoSourceTypes.get(EchoSourceType.recording)}
      onClick={selectRecording}
      data-cy={"create-echo-microphone"}>
      <ListItemIcon>
        <KeyboardVoiceIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        <Typography variant={"body2"}>From device microphone</Typography>
      </ListItemText>
    </MenuItem>
  );

  const menuItemYouTube = (
    <MenuItem
      disabled={!enabledEchoSourceTypes.get(EchoSourceType.youtube)}
      onClick={selectYouTubeURL}
      data-cy={"create-echo-youtube"}>
      <ListItemIcon>
        <YouTubeIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        <Typography variant={"body2"}>From YouTube link</Typography>
      </ListItemText>
    </MenuItem>
  );

  const menuItemFile = (
    <MenuItem
      disabled={!enabledEchoSourceTypes.get(EchoSourceType.file)}
      onClick={selectSourceFile}
      data-cy={"create-echo-file-upload"}>
      <ListItemIcon>
        <VideoFileIcon fontSize={"small"} />
      </ListItemIcon>
      <ListItemText>
        <Typography variant={"body2"}>From file upload</Typography>
      </ListItemText>
    </MenuItem>
  );

  const someSourceTypesDisabled = Array.from(enabledEchoSourceTypes).some(([, enabled]) => !enabled);

  if (showSourceSelect) {
    return (
      <Stack direction={"row"} justifyContent={"flex-end"} width={"100%"}>
        <Button text={"Create Echo"} onClick={onClickSourceSelect} data-cy={"create-echo-source-select"} />
        <Menu
          anchorEl={sourceSelectAnchor}
          onClose={onCloseSourceSelect}
          open={Boolean(sourceSelectAnchor)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}>
          {enabledEchoSourceTypes.get(EchoSourceType.recording) && menuItemRecording}
          {enabledEchoSourceTypes.get(EchoSourceType.youtube) && menuItemYouTube}
          {enabledEchoSourceTypes.get(EchoSourceType.file) && menuItemFile}
          {someSourceTypesDisabled && (
            <Divider>
              <Link target={"_blank"} href={echoGalleryURL}>
                <Typography variant={"body2"}>Clone & Run to unlock more</Typography>
              </Link>
            </Divider>
          )}
          {!enabledEchoSourceTypes.get(EchoSourceType.recording) && menuItemRecording}
          {!enabledEchoSourceTypes.get(EchoSourceType.youtube) && menuItemYouTube}
          {!enabledEchoSourceTypes.get(EchoSourceType.file) && menuItemFile}
        </Menu>
        {/* Hidden source file input */}
        <input
          ref={sourceFileInput}
          hidden
          type="file"
          accept={Object.values(SupportedMediaType).join(",")}
          onChange={sourceFileSelected}
        />
      </Stack>
    );
  }

  if (showRecordingControls) {
    return (
      <Stack direction={"column"} width={"100%"} alignItems={"center"}>
        {recordingStatus === "recording" && (
          <Stack justifyContent={"center"} alignItems={"center"} padding={2} width={onMobile ? "100%" : "30%"}>
            <AudioWaveform audioStream={previewAudioStream} />
          </Stack>
        )}
        <Stack direction={"row"} width={"100%"} alignItems={"center"} justifyContent={"center"} spacing={2}>
          {mediaBlobUrl && (
            <Fab data-cy={"discard-source"} color={"error"} onClick={discardSource}>
              <CloseIcon htmlColor="#FFFFFF" />
            </Fab>
          )}
          <Zoom
            in={sourceType === EchoSourceType.recording}
            style={{ transitionDelay: sourceType === EchoSourceType.recording ? "100ms" : "0ms" }}>
            <Fab
              data-cy={"start-recording"}
              disabled={sourceBlob !== undefined}
              color={"primary"}
              variant={recordingStatus === "recording" ? "extended" : "circular"}
              onClick={() => (recordingStatus === "recording" ? stopRecording() : startRecording())}>
              {recordingStatus === "recording" && (
                <Stack spacing={1} direction={"row"}>
                  <StopCircle htmlColor="#FFFFFF" />
                  <Timer maxTime={recordingMaxDurationSeconds} />
                </Stack>
              )}
              {recordingStatus === "idle" && <KeyboardVoiceIcon htmlColor="#FFFFFF" />}
            </Fab>
          </Zoom>
        </Stack>
      </Stack>
    );
  }

  const audioPlayback = (
    <Zoom in={showPlaybackControls} style={{ transitionDelay: showPlaybackControls ? "100ms" : "0ms" }}>
      <audio
        data-cy={"echo-source-preview"}
        src={sourceBlobURL}
        controls
        controlsList={"nodownload nofullscreen noremoteplayback noplaybackrate"}
        style={{ width: onMobile ? "100%" : "30%" }}
      />
    </Zoom>
  );

  return (
    <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} width="100%" spacing={2}>
      {onMobile && sourceType !== EchoSourceType.youtube && audioPlayback}
      {validateEchoMutation.isSuccess && !validateEchoMutation.data.valid && (
        <Stack direction={"row"} justifyContent={"center"} alignItems={"center"} spacing={2} width={"100%"}>
          <Alert severity="error">Error creating Echo: {validateEchoMutation.data?.reason}</Alert>
        </Stack>
      )}
      <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} width={"100%"} spacing={2}>
        {!onMobile && sourceType !== EchoSourceType.youtube && audioPlayback}
        {showPlaybackControls && (
          <Button
            data-cy={"discard-source"}
            color={"error"}
            icon={<DeleteIcon htmlColor="#FFFFFF" />}
            variant={"contained"}
            text={"Discard"}
            onClick={discardSource}
          />
        )}
        {showCreateButton && (
          <LoadingButton
            loading={createEchoMutation.isLoading}
            loadingPosition={"start"}
            data-cy={"create-echo-confirm"}
            color={"primary"}
            startIcon={<Send />}
            onClick={createEcho}
            variant={"contained"}
            sx={{ color: "#FFFFFF" }}>
            Create
          </LoadingButton>
        )}
      </Stack>
    </Stack>
  );
}

type TimerProps = {
  maxTime: number;
};

function Timer({ maxTime }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(maxTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(timeLeft => timeLeft - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Typography variant={"body1"} color={"#FFF"}>
      {secondsToTime(timeLeft)}
    </Typography>
  );
}
