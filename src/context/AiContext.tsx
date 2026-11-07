import { createContext, useContext, useState, type ReactNode } from 'react';

type AiContextType = {
  pendingPrompt: string | null;
  setPendingPrompt: (p: string | null) => void;
};

const AiContext = createContext<AiContextType>({ pendingPrompt: null, setPendingPrompt: () => {} });

export function AiProvider({ children }: { children: ReactNode }) {
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  return (
    <AiContext.Provider value={{ pendingPrompt, setPendingPrompt }}>
      {children}
    </AiContext.Provider>
  );
}

export const useAiContext = () => useContext(AiContext);
