import { AppBar, Stack, Toolbar } from "@mui/material";

import { ReactComponent as EchoLogo } from "resources/images/echo-logo-text.svg";

export default function NavBar() {
  return (
    <AppBar color={"transparent"} position="static">
      <Toolbar>
        <Stack justifyContent={"center"} alignItems={"center"}>
          <EchoLogo height={"40px"} width={"100%"} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
