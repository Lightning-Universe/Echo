import { useCallback } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import PendingIcon from "@mui/icons-material/Pending";
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
              disabled={!echo.text || deleteEchoMutation.variables === echo.id}>
              <DeleteIcon />
            </IconButton>
          }>
          <ListItemIcon>{!echo.text ? <PendingIcon /> : <CheckCircleIcon color={"primary"} />}</ListItemIcon>
          <ListItemText primary={echo.displayName} secondary={echo.mediaType} />
        </ListItem>
      ))}
    </List>
  );
}
