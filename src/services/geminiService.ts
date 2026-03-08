import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function assessSpeaking(
  audioBase64: string,
  mimeType: string,
  questions: string,
  part: "1" | "2" | "3"
): Promise<AssessmentResult> {
  const model = "gemini-3.1-pro-preview";

  const questionContext = questions.trim() 
    ? `The evaluation should be based on the candidate’s response to the following question(s):
Questions: ${questions}`
    : `The candidate did not provide the question text. 
IMPORTANT: First, analyze the audio content and suggest the most likely IELTS Speaking Part ${part} ${part === '2' ? 'cue card' : 'question'} that the candidate is responding to. 
Include this in the 'suggestedQuestion' field of the JSON response.`;

  const prompt = `From the provided audio input, transcribe the audio into text.
Then generate an assessment with estimated band scores for the IELTS Speaking Part ${part} response, based on the four official IELTS Speaking Assessment Criteria:
1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

For each category:
- Provide brief and concise feedback in bullet points.
- Use varied bullet symbols for each point (e.g., ➢, ✦, •, ▪, ◈, ▷).
- Each bullet point MUST include an English version followed by its Vietnamese translation.
- The Vietnamese translation MUST be preceded by the "=" symbol (e.g., "English feedback = Phản hồi tiếng Việt").
- Suggest brief improvements in bullet points, also with Vietnamese translations preceded by "=".
- In the improvement section, MUST provide at least one prestigious free website, app, or source (e.g., BBC Learning English, British Council, IELTS Simon, Cambridge Dictionary, etc.) specifically relevant to that category for self-practice.

${questionContext}

Overall Band Score: Provide an overall band score.

If the outcome appears under Band 6.0, please provide Band 6.0-6.5 sample response for this same cue card to use as a model for future practice with less than 200 words including academic collocations.
Then give a list of Academic Vocabulary and Collocations extracted from the Band 6.0-6.5 and present it in 3 columns: Vocabulary, IPA, Vietnamese meaning.

If the outcome appears under Band 7.0, please provide Band 7.0-7.5 sample response for this same cue card to use as a model for future practice with less than 200 words including academic collocations.
Then give a list of Academic Vocabulary and Collocations extracted from the Band 7.0-7.5 and present it in 3 columns: Vocabulary, IPA, Vietnamese meaning.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { inlineData: { data: audioBase64, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          overallBand: { type: Type.NUMBER },
          suggestedQuestion: { type: Type.STRING, description: "The suggested IELTS question or cue card if none was provided." },
          criteria: {
            type: Type.OBJECT,
            properties: {
              fluency: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                },
                required: ["score", "feedback", "improvement"]
              },
              lexical: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                },
                required: ["score", "feedback", "improvement"]
              },
              grammar: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                },
                required: ["score", "feedback", "improvement"]
              },
              pronunciation: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                },
                required: ["score", "feedback", "improvement"]
              }
            },
            required: ["fluency", "lexical", "grammar", "pronunciation"]
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
                    vietnamese: { type: Type.STRING }
                  },
                  required: ["word", "ipa", "vietnamese"]
                }
              }
            }
          }
        },
        required: ["transcription", "overallBand", "criteria"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
