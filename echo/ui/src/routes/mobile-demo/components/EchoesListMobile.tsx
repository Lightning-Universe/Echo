import { useCallback } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import {
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import useDeleteEcho from "hooks/useDeleteEcho";
import useListEchoes from "hooks/useListEchoes";

type Props = {
  onSelectEchoID: (id?: string) => void;
};

export default function EchoesListMobile({ onSelectEchoID }: Props) {
  const { data: echoes = [], isLoading } = useListEchoes();
  const deleteEchoMutation = useDeleteEcho();

  const deleteEcho = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, echoID: string) => {
      e.stopPropagation();
      deleteEchoMutation.mutate(echoID);
    },
    [deleteEchoMutation],
  );

  const completedEchoes = echoes.filter(echo => echo.text);
  const pendingEchoes = echoes.filter(echo => !echo.text);

  const maxAgeSeconds = process.env.REACT_APP_ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS;
  const garbageCollectionWarning = !!maxAgeSeconds
    ? `Echoes older than ${(Number(maxAgeSeconds) / 3600).toFixed(0)} hours will be automatically deleted.`
    : "";

  return (
    <List sx={{ height: "100%" }}>
      {isLoading && (
        <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} spacing={2} height={"100%"}>
          <CircularProgress />
        </Stack>
      )}
      {echoes?.length === 0 && (
        <Stack direction={"column"} justifyContent={"center"} alignItems={"center"} spacing={2} height={"100%"}>
          <GraphicEqIcon />
          <Typography variant={"body1"}>You don't have any Echoes yet</Typography>
          <Typography variant={"caption"}>{garbageCollectionWarning}</Typography>
        </Stack>
      )}
      {[...completedEchoes, ...pendingEchoes].map(echo => (
        <ListItem
          key={echo.id}
          onClick={() => onSelectEchoID(echo.id)}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={e => deleteEcho(e, echo.id)}
              disabled={!echo.completedTranscriptionAt || deleteEchoMutation.variables === echo.id}>
              <DeleteIcon />
            </IconButton>
          }>
          <ListItemIcon>
            {!echo.text ? <CircularProgress size={"1em"} /> : <CheckCircleIcon color={"primary"} />}
          </ListItemIcon>
          <ListItemText
            primary={echo.displayName}
            secondary={
              <Stack direction={"column"}>
                <Typography variant="body2" color="text.primary">
                  {echo.mediaType}
                </Typography>
                {echo.completedTranscriptionAt
                  ? `Completed ${new Date(echo.completedTranscriptionAt).toLocaleString()}`
                  : " Processing..."}
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
