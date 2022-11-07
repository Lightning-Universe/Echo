import { useState } from "react";

import { Paper, Stack } from "@mui/material";

import { BuildYourAppBanner } from "components/BuildYourAppBanner";

import EchoDetail from "./components/EchoDetail";
import EchoesList from "./components/EchoesList";
import NavBar from "./components/NavBar";

export default function Dashboard() {
  const [selectedEchoID, setSelectedEchoID] = useState<string>();
  const [creatingEcho, setCreatingEcho] = useState(false);

  const showBanner = process.env.REACT_APP_ECHO_SHOW_BANNER === "true";

  return (
    <Stack height={"85vh"} direction={"column"}>
      {showBanner && <BuildYourAppBanner />}
      <NavBar />
      <Stack height={"100%"} direction={"row"} padding={4}>
        <Paper elevation={4} sx={{ height: "100%", width: creatingEcho ? "100%" : "50%", marginX: 2, padding: 2 }}>
          <Stack direction={"column"} justifyContent={"space-between"} height={"100%"}>
            <EchoesList
              onSelectEchoID={setSelectedEchoID}
              selectedEchoID={selectedEchoID}
              onToggleCreatingEcho={setCreatingEcho}
            />
          </Stack>
        </Paper>
        {!creatingEcho && (
          <Paper elevation={4} sx={{ height: "100%", width: "50%", marginX: 2, overflowY: "hidden" }}>
            <EchoDetail echoID={selectedEchoID} goBack={() => setSelectedEchoID(undefined)} />
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
