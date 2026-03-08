import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type IELTSPart = '1' | '2' | '3';

export interface AssessmentResult {
  transcription: string;
  overallBand: number;
  suggestedQuestion?: string;
  criteria: {
    fluency: { score: number; feedback: string; improvement: string };
    lexical: { score: number; feedback: string; improvement: string };
    grammar: { score: number; feedback: string; improvement: string };
    pronunciation: { score: number; feedback: string; improvement: string };
  };
  sampleResponse?: {
    text: string;
    level: string;
    vocabulary: Array<{ word: string; ipa: string; vietnamese: string }>;
  };
}

export interface PartState {
  questions: string;
  result: AssessmentResult | null;
  audioUrl: string | null;
  base64: string | null;
  mimeType: string | null;
}

const INITIAL_PART_STATE: PartState = {
  questions: '',
  result: null,
  audioUrl: null,
  base64: null,
  mimeType: null,
};

interface PracticeContextType {
  activePart: IELTSPart;
  setActivePart: (part: IELTSPart) => void;
  partStates: Record<IELTSPart, PartState>;
  updatePartState: (part: IELTSPart, updates: Partial<PartState>) => void;
  clearPartData: (part: IELTSPart) => void;
  clearAllSessionData: () => void;
  hasActiveResults: boolean;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ielts_practice_session';

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [activePart, setActivePart] = useState<IELTSPart>('1');
  const [partStates, setPartStates] = useState<Record<IELTSPart, PartState>>(() => {
    // Attempt to hydrate from sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // We need to recreate audioUrls from base64 if they exist
        Object.keys(parsed).forEach(key => {
          const state = parsed[key as IELTSPart];
          if (state.base64 && state.mimeType && !state.audioUrl) {
            try {
              const binary = atob(state.base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const blob = new Blob([bytes], { type: state.mimeType });
              state.audioUrl = URL.createObjectURL(blob);
            } catch (e) {
              console.error('Failed to restore audio URL:', e);
            }
          }
        });
        return parsed;
      }
    } catch (e) {
      console.error('Failed to hydrate practice session:', e);
    }

    return {
      '1': { ...INITIAL_PART_STATE },
      '2': { ...INITIAL_PART_STATE },
      '3': { ...INITIAL_PART_STATE },
    };
  });

  // Persist state to session storage, but scrub Blobs/URLs
  useEffect(() => {
    const scrubbed = JSON.parse(JSON.stringify(partStates));
    // URLs are temporary and shouldn't be stringified as URLs, they'll expire
    Object.keys(scrubbed).forEach(key => {
      scrubbed[key as IELTSPart].audioUrl = null; 
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(scrubbed));
  }, [partStates]);

  const updatePartState = (part: IELTSPart, updates: Partial<PartState>) => {
    setPartStates(prev => ({
      ...prev,
      [part]: { ...prev[part], ...updates },
    }));
  };

  const clearPartData = (part: IELTSPart) => {
    const currentState = partStates[part];
    if (currentState.audioUrl) {
      URL.revokeObjectURL(currentState.audioUrl);
    }
    updatePartState(part, { ...INITIAL_PART_STATE });
  };

  const clearAllSessionData = () => {
    Object.values(partStates).forEach(state => {
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    });
    setPartStates({
      '1': { ...INITIAL_PART_STATE },
      '2': { ...INITIAL_PART_STATE },
      '3': { ...INITIAL_PART_STATE },
    });
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const hasActiveResults = Object.values(partStates).some(s => !!s.result);

  return (
    <PracticeContext.Provider 
      value={{ 
        activePart, 
        setActivePart, 
        partStates, 
        updatePartState, 
        clearPartData, 
        clearAllSessionData,
        hasActiveResults
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const context = useContext(PracticeContext);
  if (context === undefined) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
}
