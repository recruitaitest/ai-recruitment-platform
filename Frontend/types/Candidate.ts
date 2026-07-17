export interface Candidate {
  candidate_id?: number;
  candidate_name?: string;

  matched_skills?: string[];
  missing_skills?: string[];
  matched_keywords?: string[];

  match_score?: number;

  // Score breakdown fields (advanced search only)
  ai_score?: number;
  semantic_score?: number; // legacy
  skills_score?: number;
  experience_score?: number;

  id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  skills?: string;
  location?: string | null;
  education?: string;
  experience?: number;
  status?: string;

  company?: string | null;
  department?: string | null;
  current_role?: string | null;
  summary?: string | null;
  score_breakdown?: {
    ai_score?: number;
    semantic?: number; // legacy
    skills: number;
    experience: number;
};
}
