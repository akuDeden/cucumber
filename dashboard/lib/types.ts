export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
export type Environment = 'dev' | 'project' | 'prod' | 'map';

export interface TestRun {
  id: string;
  tags: string[];
  environment: Environment;
  status: TestStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  results: TestScenarioResult[];
  logs: string[];
}

export interface TestStepResult {
  keyword: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'undefined';
  duration?: number;
  error?: string;
  line?: number;
}

export interface TestScenarioResult {
  name: string;
  featureName?: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  failedStep?: string;
  screenshot?: string;
  screenshots?: string[];
  video?: string;
  steps?: TestStepResult[];
}

export interface ScheduledRun {
  id: string;
  name: string;
  tags: string[];
  environment: Environment;
  cronExpression: string;
  nextRun: string;
  enabled: boolean;
}

export interface AvailableFeature {
  name: string;
  tags: string[];
  path: string;
}
