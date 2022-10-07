import { useState } from "react";

import { Paper, Stack, Typography } from "@mui/material";

import { Echo } from "generated";

import EchoDetail from "./components/EchoDetail";
import EchoesList from "./components/EchoesList";
import NavBar from "./components/NavBar";

export default function Dashboard() {
  const [selectedEcho, setSelectedEcho] = useState<Echo>();

  return (
    <Stack height={"85vh"} direction={"column"}>
      <NavBar />
      <Stack height={"100%"} direction={"row"} padding={4}>
        <Paper elevation={4} sx={{ height: "100%", flexGrow: 4, marginX: 2, padding: 2, overflowY: "hidden" }}>
          <EchoDetail echo={selectedEcho} />
        </Paper>
        <Paper elevation={4} sx={{ height: "100%", flexGrow: 1, marginX: 2, padding: 2 }}>
          <Stack direction={"row"} justifyContent={"space-beetween"} marginBottom={2}>
            <Typography variant={"h6"}>Your Echoes</Typography>
          </Stack>
          <EchoesList onSelectEcho={setSelectedEcho} />
        </Paper>
      </Stack>
    </Stack>
  );
}
