import { supabase } from '@/lib/supabase';
import { AssessmentResult } from './geminiService';

export interface AssessmentRecord {
  id: string;
  user_id: string;
  created_at: string;
  part: string;
  question: string;
  overall_band: number;
  transcription: string;
  criteria_fluency: number;
  criteria_lexical: number;
  criteria_grammar: number;
  criteria_pronunciation: number;
  feedback_data: any; // Storing the full JSON object for detailed criteria feedback
}

export async function saveAssessmentResult(
  userId: string,
  part: string,
  question: string,
  result: AssessmentResult
): Promise<AssessmentRecord> {
  const { data, error } = await supabase
    .from('assessments')
    .insert([
      {
        user_id: userId,
        part,
        question: question || result.suggestedQuestion || 'Unknown Question',
        overall_band: result.overallBand,
        transcription: result.transcription,
        criteria_fluency: result.criteria.fluency.score,
        criteria_lexical: result.criteria.lexical.score,
        criteria_grammar: result.criteria.grammar.score,
        criteria_pronunciation: result.criteria.pronunciation.score,
        feedback_data: result
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save assessment: ${error.message}`);
  }

  return data as AssessmentRecord;
}

export async function getUserAssessments(userId: string): Promise<AssessmentRecord[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch assessments: ${error.message}`);
  }

  return data as AssessmentRecord[];
}
