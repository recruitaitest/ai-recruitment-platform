export interface Candidate {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: string;
}

export interface Interview {
    id: number;
    candidate_id: number;
    candidate_name: string;
    position_id: number;
    interview_date: string;
    interview_time: string;
    interview_type: string;
    interview_mode?: string;
    meeting_link?: string | null;
    location?: string | null;
    status: string;
    feedback?: string;
}