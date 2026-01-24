export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ShipmentStatus =
  | 'CREATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weightKg: number;
  createdAt: string;
}

// AI Copilot Progress Tracking Types

// Category-specific progress data with consistent structure
export interface CategoryProgress {
  score: number;  // 0-100
  trend: 'improving' | 'stable' | 'declining';
  details?: string;
}

export type CopilotProgressDetails = Record<string, CategoryProgress | undefined>;

export interface CopilotMilestone {
  milestone: string;
  achievedAt: string;
  description?: string;
}

export interface CopilotProgress {
  id: string;
  driverId: string;
  performancePeriodId?: string | null;
  
  // Progress metrics
  overallProgressScore: number;  // 0-100
  goalsCompleted: number;
  goalsTotal: number;
  
  // Improvement tracking
  improvementRate: number;  // percentage
  consistencyScore: number;  // 0-100
  
  // Active coaching
  activeRecommendations: number;
  completedRecommendations: number;
  
  // Detailed data
  progressDetails?: CopilotProgressDetails | null;
  milestones?: CopilotMilestone[] | null;
  
  // Engagement metrics
  engagementScore: number;  // 0-100
  lastInteraction?: string | null;
  
  // Confidence and effectiveness
  confidenceLevel: number;  // 0-100
  effectivenessScore: number;  // 0-100
  
  // Notes
  coachingNotes?: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface CopilotProgressWithDriver extends CopilotProgress {
  driver: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CopilotStats {
  totalDriversTracked: number;
  averageProgressScore: number;
  averageImprovementRate: number;
  averageConsistencyScore: number;
  averageEngagementScore: number;
  averageEffectivenessScore: number;
  totalGoalsCompleted: number;
  totalGoalsActive: number;
  totalActiveRecommendations: number;
  totalCompletedRecommendations: number;
}

export interface CreateCopilotProgressInput {
  driverId: string;
  overallProgressScore?: number;
  goalsCompleted?: number;
  goalsTotal?: number;
  improvementRate?: number;
  consistencyScore?: number;
  activeRecommendations?: number;
  completedRecommendations?: number;
  progressDetails?: CopilotProgressDetails;
  milestones?: CopilotMilestone[];
  engagementScore?: number;
  lastInteraction?: string;
  confidenceLevel?: number;
  effectivenessScore?: number;
  coachingNotes?: string;
  performancePeriodId?: string;
}

export interface UpdateCopilotProgressInput {
  overallProgressScore?: number;
  goalsCompleted?: number;
  goalsTotal?: number;
  improvementRate?: number;
  consistencyScore?: number;
  activeRecommendations?: number;
  completedRecommendations?: number;
  progressDetails?: CopilotProgressDetails;
  milestones?: CopilotMilestone[];
  engagementScore?: number;
  lastInteraction?: string;
  confidenceLevel?: number;
  effectivenessScore?: number;
  coachingNotes?: string;
}
