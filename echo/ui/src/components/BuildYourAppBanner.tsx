import { Box, Link, Stack, Typography } from "@mui/material";

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
          ⚡️ Learn how to build apps like this!&nbsp;
          <Box component={"span"} fontSize={"16px"} fontWeight={600} fontFamily={"UCity"} lineHeight={"unset"}>
            Get started
          </Box>
        </Typography>
      </Stack>
    </Link>
  );
};
