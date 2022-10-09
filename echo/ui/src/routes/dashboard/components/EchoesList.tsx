import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Box, CircularProgress, IconButton, Radio, Stack, Typography } from "@mui/material";

import RecordEcho from "components/RecordEcho";
import { Echo } from "generated";
import useListEchoes from "hooks/useListEchoes";
import { Table } from "lightning-ui/src/design-system/components";
import { EchoSourceType } from "utils";

import CreateEchoForm from "./CreateEchoForm";

const header = ["", "Name", "Type", "Created At", "Completed At", "Actions"];

type Props = {
  onSelectEchoID: (id?: string) => void;
};

export default function EchoesList({ onSelectEchoID }: Props) {
  const { isLoading, data: echoes } = useListEchoes();

  const [selectedEcho, setSelectedEcho] = useState<Echo>();
  const [createEchoWithSourceType, setCreateEchoWithSourceType] = useState<EchoSourceType>();
  const [createEchoWithDisplayName, setCreateEchoWithDisplayName] = useState<string>();
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState<string>();

  const selectEcho = useCallback(
    (echo?: Echo) => {
      if (echo) {
        setSelectedEcho(echo);
        onSelectEchoID(echo.id);
      }
    },
    [onSelectEchoID],
  );

  const onSelectSourceType = useCallback(
    (sourceType?: EchoSourceType) => {
      selectEcho(undefined);
      onSelectEchoID(undefined);
      setCreateEchoWithSourceType(sourceType);
    },
    [selectEcho, onSelectEchoID],
  );

  const onCreateEcho = useCallback(
    (echoID: string) => {
      setCreateEchoWithSourceType(undefined);
      setSourceYouTubeURL(undefined);
      setSelectedEcho(undefined);
      onSelectEchoID(undefined);
    },
    [onSelectEchoID],
  );

  const rows = useMemo(
    () =>
      (echoes ?? []).map(echo => [
        <Radio
          checked={selectedEcho?.id === echo.id}
          onChange={() => selectEcho(echo)}
          value={echo}
          size={"small"}
          sx={{ padding: 0 }}
        />,
        <Typography variant={"body2"}>{echo.displayName ?? echo.id}</Typography>,
        <Typography variant={"body2"}>{echo.mediaType}</Typography>,
        <Typography variant={"body2"}>{echo.createdAt}</Typography>,
        <Typography variant={"body2"}>{echo.completedTranscriptionAt ?? "-"}</Typography>,
        <Stack direction={"row"}>
          {/* TODO(alecmerdler): Add `useDeleteEcho()` hook... */}
          <IconButton disabled aria-label="Delete">
            <DeleteIcon fontSize={"small"} />
          </IconButton>
        </Stack>,
      ]),
    [echoes, selectedEcho, selectEcho],
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
      <Box height={"75%"}>
        {" "}
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
        />
      </Stack>
    </Stack>
  );
}
