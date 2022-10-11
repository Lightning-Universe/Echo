import { useState } from "react";

import { Stack, Typography } from "@mui/material";

import RecordEcho from "components/RecordEcho";
import CreateEchoForm from "routes/dashboard/components/CreateEchoForm";
import EchoDetail from "routes/dashboard/components/EchoDetail";
import NavBar from "routes/dashboard/components/NavBar";
import { EchoSourceType } from "utils";

import EchoesListMobile from "./components/EchoesListMobile";

export default function MobileDemo() {
  const [selectedEchoID, setSelectedEchoID] = useState<string>();

  const [createEchoWithSourceType, setCreateEchoWithSourceType] = useState<EchoSourceType>();
  const [createEchoWithDisplayName, setCreateEchoWithDisplayName] = useState<string>();
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState<string>();

  return (
    <Stack direction={"column"} height={"95vh"}>
      <NavBar />
      <Stack direction={"column"} justifyContent={"space-between"} height={"100%"}>
        {createEchoWithSourceType !== undefined ? (
          <Stack padding={2}>
            <CreateEchoForm
              sourceType={createEchoWithSourceType}
              displayNameUpdated={setCreateEchoWithDisplayName}
              youtubeURLUpdated={setSourceYouTubeURL}
            />
          </Stack>
        ) : selectedEchoID ? (
          <EchoDetail echoID={selectedEchoID} goBack={() => setSelectedEchoID(undefined)} />
        ) : (
          <>
            <Typography variant={"h6"} marginX={2} marginTop={2}>
              Your Echoes
            </Typography>
            <Stack height={"75%"} sx={{ overflowY: "scroll" }}>
              <EchoesListMobile onSelectEchoID={setSelectedEchoID} />
            </Stack>
          </>
        )}
        {!selectedEchoID && (
          <Stack direction={"row"} marginBottom={4} paddingX={2} width={"100%"}>
            {/* TODO(alecmerdler): Implement mobile creation... */}
            <RecordEcho
              echoDisplayName={createEchoWithDisplayName}
              onSelectSourceType={setCreateEchoWithSourceType}
              onCreateEcho={() => setCreateEchoWithSourceType(undefined)}
              sourceYouTubeURL={sourceYouTubeURL}
              onCancel={() => setCreateEchoWithSourceType(undefined)}
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
