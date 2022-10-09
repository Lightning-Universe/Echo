import { useState } from "react";

import { Paper, Stack } from "@mui/material";

import EchoDetail from "./components/EchoDetail";
import EchoesList from "./components/EchoesList";
import NavBar from "./components/NavBar";

export default function Dashboard() {
  const [selectedEchoID, setSelectedEchoID] = useState<string>();

  return (
    <Stack height={"85vh"} direction={"column"}>
      <NavBar />
      <Stack height={"100%"} direction={"row"} padding={4}>
        {selectedEchoID && (
          <Paper elevation={4} sx={{ height: "100%", flexGrow: 1, marginX: 2, padding: 2, overflowY: "hidden" }}>
            <EchoDetail echoID={selectedEchoID} />
          </Paper>
        )}
        <Paper elevation={4} sx={{ height: "100%", flexGrow: 1, marginX: 2, padding: 2 }}>
          <Stack direction={"column"} justifyContent={"space-between"} height={"100%"}>
            <EchoesList onSelectEchoID={setSelectedEchoID} />
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}
