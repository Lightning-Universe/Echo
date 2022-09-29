import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { CircularProgress, Stack, Typography } from "@mui/material";

import EchoCard from "components/EchoCard";
import useListEchoes from "hooks/useListEchoes";

export default function EchoesList() {
  const { isLoading, data: echoes } = useListEchoes();

  if (isLoading) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"}>
        <CircularProgress variant="indeterminate" />
      </Stack>
    );
  }

  if (!echoes || echoes.length === 0) {
    return (
      <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} spacing={2}>
        <GraphicEqIcon fontSize="large" />
        <Typography variant={"body2"}>Record your first Echo!</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {echoes.map(echo => (
        <EchoCard key={echo.id} echo={echo} />
      ))}
    </Stack>
  );
}
