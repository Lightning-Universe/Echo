import { useState } from "react";

import { Stack, Typography } from "@mui/material";

import { BuildYourAppBanner } from "components/BuildYourAppBanner";
import RecordEcho from "components/RecordEcho";
import useListEchoes from "hooks/useListEchoes";
import CreateEchoForm from "routes/dashboard/components/CreateEchoForm";
import EchoDetail from "routes/dashboard/components/EchoDetail";
import NavBar from "routes/dashboard/components/NavBar";
import { EchoSourceType, userEchoesLimit } from "utils";

import EchoesListMobile from "./components/EchoesListMobile";

export default function MobileDemo() {
  const { data: echoes = [] } = useListEchoes();

  const [selectedEchoID, setSelectedEchoID] = useState<string>();

  const [createEchoWithSourceType, setCreateEchoWithSourceType] = useState<EchoSourceType>();
  const [createEchoWithDisplayName, setCreateEchoWithDisplayName] = useState<string>();
  const [sourceYouTubeURL, setSourceYouTubeURL] = useState<string>();

  const createEchoDisabled = !!userEchoesLimit && echoes.length >= userEchoesLimit;

  const showBanner = process.env.REACT_APP_ECHO_SHOW_BANNER === "true";

  return (
    <Stack direction={"column"} height={"95vh"}>
      {showBanner && <BuildYourAppBanner />}
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
            <Typography variant={"h6"}>Your Echoes</Typography>
            <Stack height={"75%"} sx={{ overflowY: "scroll" }}>
              <EchoesListMobile onSelectEchoID={setSelectedEchoID} />
            </Stack>
          </>
        )}
        {!selectedEchoID && (
          <Stack direction={"row"} marginBottom={4} paddingX={2} width={"100%"}>
            <RecordEcho
              echoDisplayName={createEchoWithDisplayName}
              onSelectSourceType={setCreateEchoWithSourceType}
              onCreateEcho={() => setCreateEchoWithSourceType(undefined)}
              sourceYouTubeURL={sourceYouTubeURL}
              onCancel={() => setCreateEchoWithSourceType(undefined)}
              disabled={createEchoDisabled}
              disabledReason={
                createEchoDisabled ? "Maximum Echoes created, please delete an Echo to create a new one" : undefined
              }
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
