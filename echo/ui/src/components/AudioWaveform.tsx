import { useEffect, useRef } from "react";

import { Box } from "@mui/material";

import useRequestAnimationFrame from "hooks/useRequestAnimationFrame";

type Props = {
  audioStream: MediaStream | null;
};

export default function AudioWaveform({ audioStream }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasContext = useRef<CanvasRenderingContext2D | null>(null);

  const analyzer = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (audioStream) {
      const audioContext = new AudioContext();
      analyzer.current = audioContext.createAnalyser();

      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyzer.current);

      analyzer.current.fftSize = 2048;
      dataArray.current = new Uint8Array(analyzer.current.fftSize);
    }
  }, [audioStream]);

  useEffect(() => {
    if (canvas.current) {
      canvasContext.current = canvas.current.getContext("2d");

      if (canvasContext.current) {
        canvasContext.current.clearRect(0, 0, canvas.current.width, canvas.current.height);
      }
    }
  }, [audioStream]);

  useRequestAnimationFrame(() => {
    if (!analyzer.current || !canvasContext.current || !canvas.current || !dataArray.current || !analyzer.current) {
      return;
    }

    analyzer.current.getByteTimeDomainData(dataArray.current);

    canvasContext.current.fillStyle = "rgb(247, 248, 251)";
    canvasContext.current.fillRect(0, 0, canvas.current.width, canvas.current.height);

    canvasContext.current.lineWidth = 2;
    canvasContext.current.strokeStyle = "#4F00BA";

    canvasContext.current.beginPath();

    const sliceWidth = (canvas.current.width * 1.0) / analyzer.current.fftSize;
    let x = 0;

    for (let i = 0; i < analyzer.current.fftSize; i++) {
      let v = dataArray.current[i] / 128.0;
      let y = (v * canvas.current.height) / 2;

      if (i === 0) {
        canvasContext.current.moveTo(x, y);
      } else {
        canvasContext.current.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.current.lineTo(canvas.current.width, canvas.current.height / 2);
    canvasContext.current.stroke();
  });

  return <Box ref={canvas} component={"canvas"} width={"100%"} height={"100px"} sx={{ borderRadius: "25px" }}></Box>;
}
