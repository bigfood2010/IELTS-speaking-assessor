import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AssessmentResult } from '@/services/geminiService';
import {
  base64ToBlob,
  clearEncryptedAudio,
  deleteEncryptedAudio,
  persistEncryptedAudio,
  readEncryptedAudio,
} from '@/lib/encryption';

export type IELTSPart = '1' | '2' | '3';

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

const IELTS_PARTS: IELTSPart[] = ['1', '2', '3'];

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

function createInitialPartStates(): Record<IELTSPart, PartState> {
  return {
    '1': { ...INITIAL_PART_STATE },
    '2': { ...INITIAL_PART_STATE },
    '3': { ...INITIAL_PART_STATE },
  };
}

function readStoredMetadata(): Record<IELTSPart, PartState> {
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return createInitialPartStates();

    const parsed = JSON.parse(saved) as Partial<Record<IELTSPart, Partial<PartState>>>;
    return IELTS_PARTS.reduce((states, part) => {
      const storedPart = parsed[part];
      states[part] = {
        questions: typeof storedPart?.questions === 'string' ? storedPart.questions : '',
        result: storedPart?.result ?? null,
        audioUrl: null,
        base64: null,
        mimeType: null,
      };
      return states;
    }, {} as Record<IELTSPart, PartState>);
  } catch (error) {
    console.error('Failed to hydrate practice session metadata:', error);
    return createInitialPartStates();
  }
}

function hasMetadataToPersist(partStates: Record<IELTSPart, PartState>): boolean {
  return Object.values(partStates).some((state) => state.questions.trim() || state.result);
}

function getAudioSignature(state: PartState): string | null {
  if (!state.base64 || !state.mimeType) return null;
  return `${state.mimeType}:${state.base64}`;
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [activePart, setActivePart] = useState<IELTSPart>('1');
  const [hasHydratedAudio, setHasHydratedAudio] = useState(false);
  const persistedAudioSignaturesRef = useRef<Record<IELTSPart, string | null>>({
    '1': null,
    '2': null,
    '3': null,
  });
  const desiredAudioSignaturesRef = useRef<Record<IELTSPart, string | null>>({
    '1': null,
    '2': null,
    '3': null,
  });
  const [partStates, setPartStates] = useState<Record<IELTSPart, PartState>>(readStoredMetadata);

  useEffect(() => {
    let cancelled = false;
    const restoredAudio: Partial<Record<IELTSPart, Pick<PartState, 'audioUrl' | 'base64' | 'mimeType'>>> = {};

    const hydrateAudio = async () => {
      await Promise.all(
        IELTS_PARTS.map(async (part) => {
          try {
            const audio = await readEncryptedAudio(part);
            if (!audio) return;

            const audioUrl = URL.createObjectURL(base64ToBlob(audio.base64, audio.mimeType));
            restoredAudio[part] = {
              audioUrl,
              base64: audio.base64,
              mimeType: audio.mimeType,
            };
            persistedAudioSignaturesRef.current[part] = `${audio.mimeType}:${audio.base64}`;
          } catch (error) {
            console.error(`Failed to restore encrypted audio for IELTS part ${part}:`, error);
          }
        }),
      );

      if (cancelled) {
        Object.values(restoredAudio).forEach((audio) => {
          if (audio?.audioUrl) URL.revokeObjectURL(audio.audioUrl);
        });
        return;
      }

      setPartStates((currentStates) => {
        return IELTS_PARTS.reduce((states, part) => {
          states[part] = {
            ...currentStates[part],
            ...restoredAudio[part],
          };
          return states;
        }, {} as Record<IELTSPart, PartState>);
      });
      setHasHydratedAudio(true);
    };

    hydrateAudio();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedAudio) return;

    if (!hasMetadataToPersist(partStates)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    const metadataOnly = IELTS_PARTS.reduce((states, part) => {
      states[part] = {
        questions: partStates[part].questions,
        result: partStates[part].result,
        audioUrl: null,
        base64: null,
        mimeType: null,
      };
      return states;
    }, {} as Record<IELTSPart, PartState>);

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(metadataOnly));
  }, [hasHydratedAudio, partStates]);

  useEffect(() => {
    if (!hasHydratedAudio) return;

    IELTS_PARTS.forEach((part) => {
      const state = partStates[part];
      const signature = getAudioSignature(state);
      desiredAudioSignaturesRef.current[part] = signature;

      if (!signature) {
        if (persistedAudioSignaturesRef.current[part]) {
          void deleteEncryptedAudio(part).catch((error) => {
            console.error(`Failed to delete encrypted audio for IELTS part ${part}:`, error);
          });
        }
        persistedAudioSignaturesRef.current[part] = null;
        return;
      }

      if (persistedAudioSignaturesRef.current[part] === signature || !state.base64 || !state.mimeType) {
        return;
      }

      persistEncryptedAudio(part, state.base64, state.mimeType)
        .then(() => {
          if (desiredAudioSignaturesRef.current[part] === signature) {
            persistedAudioSignaturesRef.current[part] = signature;
            return;
          }

          void deleteEncryptedAudio(part).catch((deleteError) => {
            console.error(`Failed to remove stale audio for IELTS part ${part}:`, deleteError);
          });
        })
        .catch((error) => {
          console.error(`Failed to persist encrypted audio for IELTS part ${part}:`, error);
          persistedAudioSignaturesRef.current[part] = null;
          void deleteEncryptedAudio(part).catch((deleteError) => {
            console.error(`Failed to remove stale audio for IELTS part ${part}:`, deleteError);
          });
        });
    });
  }, [hasHydratedAudio, partStates]);

  const updatePartState = useCallback((part: IELTSPart, updates: Partial<PartState>) => {
    setPartStates(prev => ({
      ...prev,
      [part]: { ...prev[part], ...updates },
    }));
  }, []);

  const clearPartData = useCallback((part: IELTSPart) => {
    setPartStates((currentStates) => {
      const currentState = currentStates[part];
      if (currentState.audioUrl) {
        URL.revokeObjectURL(currentState.audioUrl);
      }

      return {
        ...currentStates,
        [part]: { ...INITIAL_PART_STATE },
      };
    });
    persistedAudioSignaturesRef.current[part] = null;
    void deleteEncryptedAudio(part).catch((error) => {
      console.error(`Failed to delete encrypted audio for IELTS part ${part}:`, error);
    });
  }, []);

  const clearAllSessionData = useCallback(() => {
    setPartStates((currentStates) => {
      Object.values(currentStates).forEach(state => {
        if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      });
      return createInitialPartStates();
    });
    persistedAudioSignaturesRef.current = {
      '1': null,
      '2': null,
      '3': null,
    };
    desiredAudioSignaturesRef.current = {
      '1': null,
      '2': null,
      '3': null,
    };
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    void clearEncryptedAudio().catch((error) => {
      console.error('Failed to clear encrypted audio:', error);
    });
  }, []);

  const hasActiveResults = Object.values(partStates).some(s => !!s.result);
  const contextValue = useMemo(() => ({
    activePart,
    setActivePart,
    partStates,
    updatePartState,
    clearPartData,
    clearAllSessionData,
    hasActiveResults,
  }), [
    activePart,
    partStates,
    updatePartState,
    clearPartData,
    clearAllSessionData,
    hasActiveResults,
  ]);

  return (
    <PracticeContext.Provider value={contextValue}>
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
