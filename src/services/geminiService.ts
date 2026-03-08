import {
  ApiError,
  createPartFromUri,
  FileState,
  GoogleGenAI,
  type Part,
  Type,
} from "@google/genai";
import { formatDateTimeForLocale, getNextPacificMidnight } from "@/lib/pacificTime";

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

export type GeminiAssessmentErrorCode =
  | "quota_exhausted_daily"
  | "quota_exhausted_rate"
  | "invalid_api_key"
  | "network_error"
  | "request_too_large";

interface GeminiAssessmentErrorOptions {
  code: GeminiAssessmentErrorCode;
  message: string;
  retryAfterSeconds?: number;
  resetAt?: Date;
}

const MODEL = "gemini-2.5-flash";
const INLINE_AUDIO_MAX_BYTES = 5 * 1024 * 1024;
const FILE_PROCESSING_POLL_INTERVAL_MS = 1500;
const FILE_PROCESSING_TIMEOUT_MS = 60_000;

export class GeminiAssessmentError extends Error {
  code: GeminiAssessmentErrorCode;
  retryAfterSeconds?: number;
  resetAt?: Date;

  constructor(options: GeminiAssessmentErrorOptions) {
    super(options.message);
    this.name = "GeminiAssessmentError";
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.resetAt = options.resetAt;
  }
}

function getQuestionContext(questions: string, part: "1" | "2" | "3"): string {
  return questions.trim()
    ? `The evaluation should be based on the candidate's response to the following question(s):
Questions: ${questions}`
    : `The candidate did not provide the question text.
IMPORTANT: First, analyze the audio content and suggest the most likely IELTS Speaking Part ${part} ${part === "2" ? "cue card" : "question"} that the candidate is responding to.
Include this in the "suggestedQuestion" field of the JSON response.`;
}

function createAssessmentPrompt(questions: string, part: "1" | "2" | "3"): string {
  return `From the provided audio input, transcribe the audio into text.
Then generate an assessment with estimated band scores for the IELTS Speaking Part ${part} response, based on the four official IELTS Speaking Assessment Criteria:
1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

For each category:
- Provide brief and concise feedback in a clean list format. 
- Do NOT use decorative symbols like ✦, ➤, ▪, or •. 
- Each point MUST include an English version followed by its Vietnamese translation on a NEW LINE.
- Suggest brief improvements in a clear list format, also with Vietnamese translations on a new line.
- In the improvement section, MUST provide at least one prestigious free website, app, or source (e.g., BBC Learning English, British Council, IELTS Simon, Cambridge Dictionary, etc.) specifically relevant to that category for self-practice.

${getQuestionContext(questions, part)}

Overall Band Score: Provide an overall band score.

If the outcome appears under Band 6.0, please provide Band 6.0-6.5 sample response for this same cue card to use as a model for future practice with less than 200 words including academic collocations.
Then give a list of Academic Vocabulary and Collocations extracted from the Band 6.0-6.5 and present it in 3 columns: Vocabulary, IPA, Vietnamese meaning.

If the outcome appears under Band 7.0, please provide Band 7.0-7.5 sample response for this same cue card to use as a model for future practice with less than 200 words including academic collocations.
Then give a list of Academic Vocabulary and Collocations extracted from the Band 7.0-7.5 and present it in 3 columns: Vocabulary, IPA, Vietnamese meaning.`;
}

function getAudioByteLength(base64: string): number {
  const paddingLength = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - paddingLength;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForFileToBecomeActive(ai: GoogleGenAI, fileName: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < FILE_PROCESSING_TIMEOUT_MS) {
    const currentFile = await ai.files.get({ name: fileName });

    if (currentFile.state === FileState.ACTIVE) {
      return currentFile;
    }

    if (currentFile.state === FileState.FAILED) {
      throw new GeminiAssessmentError({
        code: "network_error",
        message:
          currentFile.error?.message ||
          "Gemini could not finish processing the uploaded audio file. Try another recording or a shorter clip.",
      });
    }

    await delay(FILE_PROCESSING_POLL_INTERVAL_MS);
  }

  throw new GeminiAssessmentError({
    code: "network_error",
    message: "Gemini is still processing the uploaded audio file. Please try again in a moment.",
  });
}

async function createAudioPart(
  ai: GoogleGenAI,
  audioBase64: string,
  mimeType: string
): Promise<{ part: Part; uploadedFileName?: string }> {
  if (getAudioByteLength(audioBase64) <= INLINE_AUDIO_MAX_BYTES) {
    return {
      part: { inlineData: { data: audioBase64, mimeType } },
    };
  }

  const audioBlob = base64ToBlob(audioBase64, mimeType);
  const uploadedFile = await ai.files.upload({
    file: audioBlob,
    config: {
      mimeType,
      displayName: `ielts-speaking-${Date.now()}`,
    },
  });

  if (!uploadedFile.name) {
    throw new GeminiAssessmentError({
      code: "network_error",
      message: "Gemini uploaded the audio file but did not return a usable file name.",
    });
  }

  const readyFile =
    uploadedFile.state === FileState.ACTIVE ? uploadedFile : await waitForFileToBecomeActive(ai, uploadedFile.name);

  if (!readyFile.uri) {
    throw new GeminiAssessmentError({
      code: "network_error",
      message: "Gemini uploaded the audio file but did not return a usable file URI.",
    });
  }

  return {
    part: createPartFromUri(readyFile.uri, readyFile.mimeType || mimeType),
    uploadedFileName: uploadedFile.name,
  };
}

function parseRetryAfterSeconds(message: string): number | undefined {
  const retryMatch =
    message.match(/retry in ([\d.]+)s/i) ||
    message.match(/retryDelay["'\s:]+([\d.]+)s/i);

  if (!retryMatch?.[1]) {
    return undefined;
  }

  const seconds = Number(retryMatch[1]);
  return Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds)) : undefined;
}

function createDailyQuotaError(): GeminiAssessmentError {
  const resetAt = getNextPacificMidnight();
  const localResetLabel = formatDateTimeForLocale(resetAt);

  return new GeminiAssessmentError({
    code: "quota_exhausted_daily",
    resetAt,
    message: `The active Gemini project has exhausted its free daily quota. Google's free daily quota resets at midnight Pacific Time (${localResetLabel} in your local time). Wait for the reset or replace this key with a key from another Google account/project.`,
  });
}

function createRateLimitError(message: string): GeminiAssessmentError {
  const retryAfterSeconds = parseRetryAfterSeconds(message);
  const retryMessage = retryAfterSeconds
    ? `Try again in about ${retryAfterSeconds} seconds.`
    : "Wait a short moment and try again.";

  return new GeminiAssessmentError({
    code: "quota_exhausted_rate",
    retryAfterSeconds,
    message: `The active Gemini project hit a temporary free-tier rate limit. ${retryMessage} If you need to continue immediately, replace the key with one from another Google account/project.`,
  });
}

function normalizeGeminiError(error: unknown): GeminiAssessmentError {
  if (error instanceof GeminiAssessmentError) {
    return error;
  }

  const apiError = error as Partial<ApiError> & { message?: string; status?: number };
  const message = apiError.message || "";
  const normalizedMessage = message.toLowerCase();
  const status = apiError.status;

  if (
    status === 401 ||
    status === 403 ||
    normalizedMessage.includes("api key not valid") ||
    normalizedMessage.includes("invalid api key") ||
    normalizedMessage.includes("api_key_invalid")
  ) {
    return new GeminiAssessmentError({
      code: "invalid_api_key",
      message: "The Gemini API key is invalid or no longer has access. Update it in Settings with a valid key from your own Google project.",
    });
  }

  if (
    status === 413 ||
    normalizedMessage.includes("payload too large") ||
    normalizedMessage.includes("request too large") ||
    normalizedMessage.includes("request size") ||
    normalizedMessage.includes("inline_data")
  ) {
    return new GeminiAssessmentError({
      code: "request_too_large",
      message: "This audio request is still too large to process. Try a shorter recording or upload a smaller audio file.",
    });
  }

  if (
    status === 429 ||
    normalizedMessage.includes("resource_exhausted") ||
    normalizedMessage.includes("quota exceeded") ||
    normalizedMessage.includes("rate limit")
  ) {
    const looksDaily =
      normalizedMessage.includes("perday") ||
      normalizedMessage.includes("requests per day") ||
      normalizedMessage.includes("inputtokenspermodelperday") ||
      normalizedMessage.includes("daily");

    return looksDaily ? createDailyQuotaError() : createRateLimitError(message);
  }

  if (error instanceof TypeError || normalizedMessage.includes("fetch") || normalizedMessage.includes("network")) {
    return new GeminiAssessmentError({
      code: "network_error",
      message: "A network error interrupted the Gemini request. Check your connection and try again.",
    });
  }

  return new GeminiAssessmentError({
    code: "network_error",
    message: "Failed to analyze audio securely. Check your network or valid API key, then try again.",
  });
}

function getResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      transcription: { type: Type.STRING },
      overallBand: { type: Type.NUMBER },
      suggestedQuestion: {
        type: Type.STRING,
        description: "The suggested IELTS question or cue card if none was provided.",
      },
      criteria: {
        type: Type.OBJECT,
        properties: {
          fluency: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improvement: { type: Type.STRING },
            },
            required: ["score", "feedback", "improvement"],
          },
          lexical: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improvement: { type: Type.STRING },
            },
            required: ["score", "feedback", "improvement"],
          },
          grammar: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improvement: { type: Type.STRING },
            },
            required: ["score", "feedback", "improvement"],
          },
          pronunciation: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improvement: { type: Type.STRING },
            },
            required: ["score", "feedback", "improvement"],
          },
        },
        required: ["fluency", "lexical", "grammar", "pronunciation"],
      },
      sampleResponse: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          level: { type: Type.STRING },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                ipa: { type: Type.STRING },
                vietnamese: { type: Type.STRING },
              },
              required: ["word", "ipa", "vietnamese"],
            },
          },
        },
      },
    },
    required: ["transcription", "overallBand", "criteria"],
  };
}

export async function assessSpeaking(
  apiKey: string,
  audioBase64: string,
  mimeType: string,
  questions: string,
  part: "1" | "2" | "3"
): Promise<AssessmentResult> {
  if (!apiKey) {
    throw new GeminiAssessmentError({
      code: "invalid_api_key",
      message: "Google Gemini API Key is required. Please set it in Settings.",
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = createAssessmentPrompt(questions, part);

  let uploadedFileName: string | undefined;

  try {
    const { part: audioPart, uploadedFileName: uploadedFile } = await createAudioPart(ai, audioBase64, mimeType);
    uploadedFileName = uploadedFile;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          parts: [audioPart, { text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: getResponseSchema(),
      },
    });

    if (!response.text) {
      throw new GeminiAssessmentError({
        code: "network_error",
        message: "Gemini returned an empty assessment response. Please try again.",
      });
    }

    return JSON.parse(response.text) as AssessmentResult;
  } catch (error) {
    console.error("Gemini Setup Error:", error);
    throw normalizeGeminiError(error);
  } finally {
    if (uploadedFileName) {
      try {
        await ai.files.delete({ name: uploadedFileName });
      } catch (cleanupError) {
        console.warn("Failed to delete uploaded Gemini file:", cleanupError);
      }
    }
  }
}
