import { useRef } from "react";

import { Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

import { Echo } from "generated";
import { useLightningState } from "hooks/useLightningState";

type Props = {
  echo: Echo;
};

export default function EchoCard(props: Props) {
  const lightningState = useLightningState();

  const audio = useRef<HTMLAudioElement>(null);

  const fileserverURL = lightningState?.works["fileserver"]["vars"]["_url"];
  const sourceFileURL = `${fileserverURL}/download/${props.echo.id}`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant={"body1"}>{props.echo.displayName}</Typography>
        <Stack direction={"column"} spacing={1}>
          <Stack direction={"row"} alignItems={"center"} spacing={2}>
            {props.echo.text === "" && <CircularProgress variant="indeterminate" />}
            <audio ref={audio} src={sourceFileURL} controls />
          </Stack>
          <Typography variant="body2">{props.echo.text}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
