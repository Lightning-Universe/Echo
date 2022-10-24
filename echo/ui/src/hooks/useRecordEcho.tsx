import { createContext, useContext, useState } from "react";

type RecordEchoContextType = {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
};

const RecordEchoContext = createContext<RecordEchoContextType>({ isRecording: false, setIsRecording: () => {} });

// TODO: Move `useReactMediaRecorder()` hook call here so that only one recorder instance is created...
export function RecordEchoContextProvider(props: React.PropsWithChildren<{}>) {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <RecordEchoContext.Provider value={{ isRecording, setIsRecording }}>{props.children}</RecordEchoContext.Provider>
  );
}

export const useRecordEcho = () => useContext(RecordEchoContext);
