import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Box, CircularProgress, IconButton, Radio, Stack, Typography } from "@mui/material";

import RecordEcho from "components/RecordEcho";
import useDeleteEcho from "hooks/useDeleteEcho";
import useListEchoes from "hooks/useListEchoes";
import { Table } from "lightning-ui/src/design-system/components";
import { EchoSourceType, userEchoesLimit } from "utils";

import CreateEchoForm from "./CreateEchoForm";

const header = ["", "Name", "Type", "Created At", "Completed At", "Actions"];

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
  const garbageCollectionWarning =
    maxAgeSeconds !== undefined
      ? `Echoes older than ${(Number(maxAgeSeconds) / 3600).toFixed(0)} hours will be automatically deleted.`
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
      onSelectEchoID(undefined);
    },
    [onSelectEchoID, onToggleCreatingEcho],
  );

  const rows = useMemo(
    () =>
      (echoes ?? []).map(echo => [
        <Radio
          checked={selectedEchoID === echo.id}
          onChange={() => selectEcho(echo.id)}
          value={echo}
          size={"small"}
          sx={{ padding: 0 }}
        />,
        <Typography variant={"body2"}>{echo.displayName ?? echo.id}</Typography>,
        <Typography variant={"body2"}>{echo.mediaType}</Typography>,
        <Typography variant={"body2"}>{echo.createdAt}</Typography>,
        <Typography variant={"body2"}>{echo.completedTranscriptionAt ?? "-"}</Typography>,
        <Stack direction={"row"}>
          <IconButton aria-label="Delete" disabled={!echo.text} onClick={() => deleteEchoMutation.mutate(echo.id)}>
            <DeleteIcon fontSize={"small"} />
          </IconButton>
        </Stack>,
      ]),
    [echoes, selectEcho, selectedEchoID, deleteEchoMutation],
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
        <Typography variant={"body2"}>You don't have any Echoes</Typography>
        <Typography variant={"caption"}>{garbageCollectionWarning}</Typography>
      </Stack>
    ) : (
      <Table header={header} rows={rows} />
    );

  return (
    <Stack direction={"column"} justifyContent={"space-between"} height={"100%"}>
      <Stack direction={"row"} marginBottom={2}>
        <Typography variant={"h6"}>
          {createEchoWithSourceType !== undefined ? "Create Echo" : "Your Echoes"}
        </Typography>
      </Stack>
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
