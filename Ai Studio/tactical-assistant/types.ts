export type View = 'Dashboard' | 'Footage Analyzer' | 'Drill Generator' | 'Training Planner' | 'Player Feedback';

export interface Drill {
  name: string;
  description: string;
  focus: string[];
}

export interface Feedback {
  id: number;
  playerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface TeamPerformanceData {
  match: number;
  passingAccuracy: number;
  possession: number;
}

export interface PlayerTackleData {
    name: string;
    won: number;
    lost: number;
}

export interface PlayerSkillData {
    subject: string;
    A: number;
    fullMark: number;
}

// New types for search grounding
export interface GroundingSource {
    web: {
        uri: string;
        title: string;
    }
}

export interface SearchResult {
    answer: string;
    sources: GroundingSource[];
}

// New type for AI-powered feedback analysis
export interface FeedbackAnalysis {
    summary: string;
    positiveThemes: string[];
    constructiveThemes: string[];
}