export type WorkflowStatus = 'active' | 'paused' | 'running' | 'error';

export interface WorkflowItem {
  id: string;
  code: 'WF01' | 'WF02' | 'WF03' | string;
  name: string;
  vietnameseName: string;
  description: string;
  status: WorkflowStatus;
  triggerType: 'Schedule' | 'Webhook' | 'Manual';
  scheduleInfo?: string;
  lastRunAt: string;
  nextRunAt?: string;
  successRate: number;
  totalExecutions: number;
  avgDurationSec: number;
}

export interface TriggerWF01Input {
  topic: string;
  suggestedTitle?: string;
}

export interface TriggerWF01Response {
  success: boolean;
  message: string;
  details?: string;
  topic?: string;
  suggestedTitle?: string;
  error?: string;
}
