import { useState } from "react";

import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { CircularProgress, Stack, Typography, Zoom } from "@mui/material";

import EchoCard from "components/EchoCard";
import RecordEcho from "components/RecordEcho";
import useListEchoes from "hooks/useListEchoes";
import { ReactComponent as EchoLogo } from "resources/images/echo-logo-text.svg";

export default function MobileDemo() {
  const { data: echoes, isLoading } = useListEchoes();

  const [mostRecentEchoID, setMostRecentEchoID] = useState<string>();
  const mostRecentEcho = echoes?.find(echo => echo.id === mostRecentEchoID);

  return (
    <Stack paddingX={2} paddingY={4} direction={"column"} justifyContent={"space-between"} height={"95vh"}>
      <Stack
        direction={"column"}
        height={"75px"}
        marginBottom={4}
        spacing={1}
        justifyContent={"center"}
        alignItems={"center"}>
        <EchoLogo width={"100%"} height={"100%"} />
        <Typography variant={"caption"}>Turn your voice into text in seconds!</Typography>
      </Stack>
      {!isLoading && mostRecentEcho === undefined && (
        <Zoom
          in={!isLoading && mostRecentEcho === undefined}
          style={{ transitionDelay: !isLoading && mostRecentEcho === undefined ? "100ms" : "0ms" }}>
          <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} spacing={2}>
            <GraphicEqIcon fontSize="large" />
            <Typography variant={"body2"}>Create your Echo!</Typography>
          </Stack>
        </Zoom>
      )}
      {isLoading && (
        <Stack direction={"column"} alignItems={"center"} justifyContent={"center"}>
          <CircularProgress variant="indeterminate" />
        </Stack>
      )}
      {mostRecentEcho !== undefined && <EchoCard echo={mostRecentEcho} />}
      <RecordEcho
        echoDisplayName={"Demo Echo"}
        onSelectSourceType={() => null}
        onCreateEcho={setMostRecentEchoID}
        onCancel={() => null}
      />
    </Stack>
  );
}
