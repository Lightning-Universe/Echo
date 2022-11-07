import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Box, CircularProgress, IconButton, Link, Stack, Typography } from "@mui/material";

import RecordEcho from "components/RecordEcho";
import useDeleteEcho from "hooks/useDeleteEcho";
import useListEchoes from "hooks/useListEchoes";
import { Table } from "lightning-ui/src/design-system/components";
import { EchoSourceType, userEchoesLimit } from "utils";

import CreateEchoForm from "./CreateEchoForm";

const header = ["Name", "Type", "Created At", "Completed At", "Actions"];

const emptyMsg = "Your Echoes will appear here.";
const emptyMsgSecondary = "Echoes are transcriptions of audio/video recordings powered by AI.";

type Props = {
  onSelectEchoID: (id?: string) => void;
  selectedEchoID?: string;
  onToggleCreatingEcho: (creating: boolean) => void;
};

export default function EchoesList({ onSelectEchoID, onToggleCreatingEcho, selectedEchoID }: Props) {
  const { isLoading, data: echoes = [] } = useListEchoes();
  const deleteEchoMutation = useDeleteEcho();

  const [createEchoWithSourceType, setCreateEchoWithSourceType] = useState<EchoSourceType>();
  const [createEchoWithDisplayName, setCreateEchoWithDisplayName] = useState<string>();
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState<string>();

  const createEchoDisabled = !!userEchoesLimit && echoes.length >= userEchoesLimit;

  const maxAgeSeconds = process.env.REACT_APP_ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS;
  const garbageCollectionWarning = !!maxAgeSeconds
    ? `If you don't see your Echoes, it is because they are automatically deleted after ${(
        Number(maxAgeSeconds) / 3600
      ).toFixed(0)} hours.`
    : "";

  const selectEcho = useCallback(
    (echoID?: string) => {
      if (echoID) {
        onSelectEchoID(echoID);
      }
    },
    [onSelectEchoID],
  );

  const onSelectSourceType = useCallback(
    (sourceType?: EchoSourceType) => {
      onToggleCreatingEcho(true);
      selectEcho(undefined);
      onSelectEchoID(undefined);
      setCreateEchoWithSourceType(sourceType);
    },
    [selectEcho, onSelectEchoID, onToggleCreatingEcho],
  );

  const onCreateEcho = useCallback(
    (echoID: string) => {
      onToggleCreatingEcho(false);
      setCreateEchoWithSourceType(undefined);
      setSourceYouTubeURL(undefined);
      onSelectEchoID(echoID);
    },
    [onSelectEchoID, onToggleCreatingEcho],
  );

  const onDeleteEcho = useCallback(
    (echoID: string) => {
      onSelectEchoID();
      deleteEchoMutation.mutate(echoID);
    },
    [deleteEchoMutation, onSelectEchoID],
  );

  const rows = useMemo(
    () =>
      (echoes ?? []).map(echo => [
        selectedEchoID === echo.id ? (
          <Typography variant={"body2"} color={"primary"}>
            {echo.displayName ?? echo.id}
          </Typography>
        ) : (
          <Link
            sx={{ ":hover": { cursor: "pointer" } }}
            data-cy={`select-echo-${echo.id}`}
            color={"inherit"}
            onClick={() => selectEcho(echo.id)}>
            <Typography variant={"body2"}>{echo.displayName ?? echo.id}</Typography>
          </Link>
        ),
        <Typography variant={"body2"} color={selectedEchoID === echo.id ? "primary" : "inherit"}>
          {echo.mediaType}
        </Typography>,
        <Typography variant={"body2"} color={selectedEchoID === echo.id ? "primary" : "inherit"}>
          {echo.createdAt ? new Date(echo.createdAt).toLocaleString() : "-"}
        </Typography>,
        <Typography variant={"body2"} color={selectedEchoID === echo.id ? "primary" : "inherit"}>
          {echo.completedTranscriptionAt ? new Date(echo.completedTranscriptionAt).toLocaleString() : "-"}
        </Typography>,
        <Stack direction={"row"}>
          <IconButton
            aria-label="Delete"
            disabled={!echo.completedTranscriptionAt}
            color={selectedEchoID === echo.id ? "primary" : "inherit"}
            onClick={() => onDeleteEcho(echo.id)}>
            <DeleteIcon fontSize={"small"} />
          </IconButton>
        </Stack>,
      ]),
    [echoes, selectEcho, selectedEchoID, onDeleteEcho],
  );

  if (isLoading) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} height={"100%"}>
        <CircularProgress variant="indeterminate" />
      </Stack>
    );
  }

  const echoesList =
    !echoes || echoes.length === 0 ? (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} spacing={2} height={"100%"}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>{emptyMsg}</Typography>
        <Typography variant={"caption"}>{emptyMsgSecondary}</Typography>
        <Typography variant={"caption"}>{garbageCollectionWarning}</Typography>
      </Stack>
    ) : (
      <Table rowHover header={header} rows={rows} />
    );

  return (
    <Stack direction={"column"} justifyContent={"space-between"} height={"100%"}>
      {createEchoWithSourceType !== undefined && <Typography variant={"h6"}>{"Create Echo"}</Typography>}
      <Box height={"75%"} sx={{ overflowY: "scroll" }}>
        {createEchoWithSourceType !== undefined ? (
          <CreateEchoForm
            sourceType={createEchoWithSourceType}
            displayNameUpdated={setCreateEchoWithDisplayName}
            youtubeURLUpdated={setSourceYouTubeURL}
          />
        ) : (
          echoesList
        )}
      </Box>
      <Stack direction={"row"} justifyContent={"flex-end"} paddingX={2} width={"100%"}>
        <RecordEcho
          echoDisplayName={createEchoWithDisplayName}
          onSelectSourceType={onSelectSourceType}
          onCreateEcho={onCreateEcho}
          sourceYouTubeURL={sourceYouTubeURL}
          onCancel={() => onToggleCreatingEcho(false)}
          disabled={createEchoDisabled}
          disabledReason={
            createEchoDisabled ? "Maximum Echoes created, please delete an Echo to create a new one" : undefined
          }
        />
      </Stack>
    </Stack>
  );
}
