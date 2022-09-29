import { createContext, useContext, useEffect, useState } from "react";

import type { LightningState } from "types/lightning";

interface LightningStateClient {
  subscribe(handler: (state: any) => void): () => void;
  next(state: any): void;
}

declare global {
  interface Window {
    LightningState: LightningStateClient;
  }
}

const LightningStateContext = createContext<LightningState | undefined>(undefined);

export const LightningStateContextProvider = (props: React.PropsWithChildren<{}>) => {
  const [lightningState, setLightningState] = useState<LightningState>();

  useEffect(() => {
    const unsubscribe = window.LightningState.subscribe(setLightningState);

    return unsubscribe;
  }, []);

  return <LightningStateContext.Provider value={lightningState}>{props.children}</LightningStateContext.Provider>;
};

export const useLightningState = () => useContext(LightningStateContext);
