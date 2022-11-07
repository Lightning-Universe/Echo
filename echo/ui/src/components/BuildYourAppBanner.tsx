import { Link, Stack, Typography } from "@mui/material";

export const BuildYourAppBanner = () => {
  return (
    <Link href={"https://lightning.ai/lightning-docs"} target={"_blank"}>
      <Stack
        direction={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        sx={{
          background: "linear-gradient(182deg, rgb(121, 46, 229) 16.83%, rgb(62, 171, 179) 144.59%)",
          textAlign: "center",
        }}
        padding={1}>
        <Typography color={"#FFFFFF"} fontSize={"16px"} fontWeight={400}>
          ⚡️ Learn how this app was built!
        </Typography>
      </Stack>
    </Link>
  );
};
