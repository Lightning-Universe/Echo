import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { CircularProgress, IconButton, Radio, Stack, Typography } from "@mui/material";

import { Echo } from "generated";
import useListEchoes from "hooks/useListEchoes";
import { Table } from "lightning-ui/src/design-system/components";

const header = ["", "Name", "Type", "Created At", "Completed At", "Actions"];

type Props = {
  onSelectEcho: (echo: Echo) => void;
};

export default function EchoesList({ onSelectEcho }: Props) {
  const { isLoading, data: echoes } = useListEchoes();

  const [selectedEcho, setSelectedEcho] = useState<Echo>();

  const selectEcho = useCallback(
    (echo: Echo) => {
      setSelectedEcho(echo);
      onSelectEcho(echo);
    },
    [onSelectEcho],
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
          <IconButton aria-label="Delete">
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

  if (!echoes || echoes.length === 0) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} spacing={2} height={"100%"}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>You don't have any Echoes</Typography>
      </Stack>
    );
  }

  return <Table header={header} rows={rows} />;
}
