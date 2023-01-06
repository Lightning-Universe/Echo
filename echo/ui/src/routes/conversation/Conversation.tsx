import { useState } from "react";

import LightModeIcon from "@mui/icons-material/LightMode";
import SendIcon from "@mui/icons-material/Send";
import { Stack, TextField, Typography } from "@mui/material";

const examples = [
  "Could you give me the subtitles for this video: ___",
  "Could you translate this video to English: ___",
  "How many times was the word 'love' used in this video: ___",
];

export default function Conversation() {
  const [prompt, setPrompt] = useState("");

  return (
    <Stack height={"100vh"} direction={"column"} sx={{ background: "rgba(52,53,65)" }}>
      <Stack direction={"row"} justifyContent={"center"} marginTop={18}>
        <Typography variant={"h3"} sx={{ color: "#FFFFFF" }}>
          Echo
        </Typography>
      </Stack>
      <Stack direction={"row"} justifyContent={"center"} marginTop={8}>
        <Stack width={"30%"} direction={"column"} alignItems={"center"} spacing={2}>
          <LightModeIcon sx={{ color: "#FFFFFF" }} />
          <Typography variant={"h6"} sx={{ color: "#FFFFFF" }}>
            Examples
          </Typography>
          {examples.map((example, i) => (
            <Stack
              key={i}
              width={"100%"}
              onClick={() => setPrompt(example)}
              sx={{
                "background": "hsla(0,0%,100%,.05)",
                "borderRadius": ".375rem",
                ":hover": { cursor: "pointer", background: "#202123" },
              }}>
              <Typography variant={"body1"} textAlign={"center"} sx={{ color: "#FFFFFF" }} padding={2}>
                {example}
              </Typography>
            </Stack>
          ))}
          <TextField
            InputProps={{
              endAdornment: <SendIcon sx={{ color: "#FFFFFF" }} />,
            }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            sx={{
              "background": "hsla(0,0%,100%,.05)",
              ".MuiInputBase-input": { color: "#FFFFFF" },
              ".MuiFormLabel-root": { color: "#FFFFFF" },
            }}
            fullWidth
            variant={"outlined"}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
