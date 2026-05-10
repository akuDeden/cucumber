import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { Environment, TestRun, TestScenarioResult, TestStepResult } from './types';
import { addTestRun } from './storage';

const SCREENSHOTS_DIR = path.join(process.cwd(), '../screenshots');
const VIDEOS_DIR = path.join(process.cwd(), '../videos');
const REPORTS_DIR = path.join(process.cwd(), '../reports');
// Project root directory (parent of dashboard)
const PROJECT_ROOT = path.join(process.cwd(), '..');

// Use globalThis to persist state across Next.js dev mode module re-evaluations
// This prevents the race condition where stream route gets a fresh empty Map
interface GlobalTestState {
  __testRunnerActiveRuns: Map<string, { process: ChildProcess; status: 'running' | 'stopping' }>;
  __testRunnerProgressListeners: Map<string, (data: any) => void>;
}

const g = globalThis as unknown as GlobalTestState;
if (!g.__testRunnerActiveRuns) {
  g.__testRunnerActiveRuns = new Map();
}
if (!g.__testRunnerProgressListeners) {
  g.__testRunnerProgressListeners = new Map();
}

const activeRuns = g.__testRunnerActiveRuns;
const progressListeners = g.__testRunnerProgressListeners;

export function getActiveRun(runId: string) {
  return activeRuns.get(runId);
}

export function addProgressListener(runId: string, callback: (data: any) => void) {
  progressListeners.set(runId, callback);
}

export function removeProgressListener(runId: string) {
  progressListeners.delete(runId);
}

function emitProgress(runId: string, data: any) {
  const listener = progressListeners.get(runId);
  if (listener) {
    listener(data);
  }
}

async function getAvailableScreenshots(): Promise<string[]> {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    const files = await fs.readdir(SCREENSHOTS_DIR, { withFileTypes: true });
    const results: string[] = [];
    for (const f of files) {
      if (f.isDirectory()) {
        const subFiles = await fs.readdir(path.join(SCREENSHOTS_DIR, f.name));
        for (const sf of subFiles) {
          if (sf.endsWith('.png') || sf.endsWith('.jpg') || sf.endsWith('.jpeg')) {
            results.push(f.name + '/' + sf);
          }
        }
      } else if (f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) {
        results.push(f.name);
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function getAvailableVideos(): Promise<string[]> {
  try {
    await fs.mkdir(VIDEOS_DIR, { recursive: true });
    const files = await fs.readdir(VIDEOS_DIR);
    return files.filter(f => f.endsWith('.webm') || f.endsWith('.mp4'));
  } catch {
    return [];
  }
}

async function parseCucumberReport(reportPath: string): Promise<TestScenarioResult[]> {
  try {
    // Wait a bit for the file to be fully written
    await new Promise(resolve => setTimeout(resolve, 500));

    const content = await fs.readFile(reportPath, 'utf-8');
    if (!content || content.trim() === '') {
      console.error('Report file is empty:', reportPath);
      return [];
    }
    const report = JSON.parse(content);

    const results: TestScenarioResult[] = [];

    for (const feature of (report || [])) {
      const featureName = feature.name || 'Unknown Feature';

      for (const element of feature.elements || []) {
        const name = element.name || 'Unknown Scenario';
        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let error: string | undefined;
        let failedStep: string | undefined;
        let totalDuration = 0;

        // Parse each step with full detail
        const steps: TestStepResult[] = [];

        for (const step of element.steps || []) {
          const stepKeyword = (step.keyword || '').trim();
          const stepName = step.name || '';
          const stepStatus = step.result?.status || 'pending';
          // Cucumber JSON reports duration in nanoseconds
          const stepDurationNs = step.result?.duration || 0;
          const stepDurationMs = Math.round(stepDurationNs / 1_000_000);
          const stepError = step.result?.error_message;

          totalDuration += stepDurationMs;

          steps.push({
            keyword: stepKeyword,
            name: stepName,
            status: stepStatus as TestStepResult['status'],
            duration: stepDurationMs,
            error: stepError,
            line: step.line,
          });

          if (stepStatus === 'failed') {
            status = 'failed';
            error = stepError || 'Step failed';
            failedStep = `${stepKeyword} ${stepName}`;
          } else if ((stepStatus === 'skipped' || stepStatus === 'pending') && status !== 'failed') {
            status = 'skipped';
          }
        }

        results.push({
          name,
          featureName,
          status,
          duration: totalDuration,
          error,
          failedStep,
          steps,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error parsing report:', error);
    return [];
  }
}

export async function runTests(
  tags: string[],
  environment: Environment,
  onProgress?: (data: any) => void
): Promise<string> {
  const runId = uuidv4();
  const tagsParam = tags.map(t => `@${t.replace(/^@/, '')}`).join(' and ');

  const run: TestRun = {
    id: runId,
    tags,
    environment,
    status: 'running',
    startedAt: new Date().toISOString(),
    results: [],
    logs: [],
  };

  // Emit started event IMMEDIATELY with runId
  onProgress?.({ type: 'started', runId, run });
  emitProgress(runId, { type: 'started', runId, run });

  // Ensure reports directory exists in project root
  await fs.mkdir(path.join(PROJECT_ROOT, 'reports'), { recursive: true });

  // Build env file path and load environment variables
  const envFile = environment === 'dev' ? '.env.dev'
    : environment === 'map' ? '.env.map'
      : environment === 'project' ? '.env.chronicle'
        : '.env.chronicle.prod';

  const envFilePath = path.join(PROJECT_ROOT, envFile);

  // Load environment variables from .env file
  const envConfig = config({ path: envFilePath });
  const testEnv: Record<string, string | undefined> = {
    ...process.env,
    ...(envConfig.parsed || {}),
    HEADLESS: 'true',
    NODE_OPTIONS: '--loader ts-node/esm',
    TEST_RUN_ID: runId,
  };

  // Command to run cucumber (simplified without dotenv-cli)
  const command = `node scripts/check-playwright.js && npx cross-env HEADLESS=true NODE_OPTIONS='--loader ts-node/esm' cucumber-js "src/features/**/*.feature" --import "src/**/*.ts" --tags "${tagsParam}" --format json:reports/${runId}.json`;

  // Run from parent directory (the automation framework root)
  const projectRoot = PROJECT_ROOT;

  console.log('[TestRunner] Starting test with runId:', runId);
  console.log('[TestRunner] Project root:', projectRoot);
  console.log('[TestRunner] Env file:', envFilePath);
  console.log('[TestRunner] Command:', command);

  return new Promise((resolve, reject) => {
    const childProcess = spawn('sh', ['-c', command], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: testEnv as NodeJS.ProcessEnv,
    });

    console.log('[TestRunner] Process spawned, PID:', childProcess.pid);

    activeRuns.set(runId, { process: childProcess, status: 'running' });

    // Resolve runId IMMEDIATELY so API can respond
    resolve(runId);

    const logs: string[] = [];
    let output = '';

    childProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      console.log('[TestRunner] stdout:', text.substring(0, 200));
      logs.push(text);
      output += text;

      // Parse progress from cucumber output
      const match = text.match(/\((\d+)\/(\d+)\)/);
      if (match) {
        onProgress?.({
          type: 'progress',
          runId,
          current: parseInt(match[1]),
          total: parseInt(match[2]),
        });
      }

      emitProgress(runId, { type: 'log', message: text });
    });

    childProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      console.log('[TestRunner] stderr:', text.substring(0, 200));
      logs.push(text);
      emitProgress(runId, { type: 'error', message: text });
    });

    childProcess.on('close', async (code) => {
      console.log('[TestRunner] Process closed with exit code:', code);
      activeRuns.delete(runId);

      const reportPath = path.join(PROJECT_ROOT, 'reports', runId + '.json');
      console.log('[TestRunner] Reading report from:', reportPath);
      const results = await parseCucumberReport(reportPath);

      // Find screenshots for failed tests
      const screenshots = await getAvailableScreenshots();
      const videos = await getAvailableVideos();

      results.forEach(r => {
        // Match screenshots (check both exact match and partial match)
        // Normalize scenario name to match hooks.ts sanitization
        const scenarioNameNormalized = r.name
          .replace(/[^a-zA-Z0-9\s]/g, '_')
          .replace(/\s+/g, '_')
          .toLowerCase()
          .substring(0, 100);
        const matchingScreenshots = screenshots.filter(s =>
          s.toLowerCase().includes(scenarioNameNormalized) ||
          scenarioNameNormalized.includes(s.toLowerCase().replace(/\.(png|jpg|jpeg)$/i, ''))
        );

        if (matchingScreenshots.length > 0) {
          r.screenshot = '/api/screenshots/' + matchingScreenshots[0];
          r.screenshots = matchingScreenshots.map(s => '/api/screenshots/' + s);
        } else if (r.status === 'failed') {
          // Also check in fail subdirectory
          const failScreenshots = screenshots.filter(s =>
            s.startsWith('fail/') && s.toLowerCase().includes(scenarioNameNormalized)
          );
          if (failScreenshots.length > 0) {
            r.screenshot = '/api/screenshots/' + failScreenshots[0];
            r.screenshots = failScreenshots.map(s => '/api/screenshots/' + s);
          }
        }

        // Match videos with exact pattern from hooks.ts: {status}_{env}_{scenarioName}.webm
        const statusPrefixes = ['pass', 'fail'];
        const matchingVideo = videos.find(v => {
          return statusPrefixes.some(prefix => {
            const expectedPrefix = `${prefix}_${run.environment}_${scenarioNameNormalized}`;
            return v.toLowerCase().startsWith(expectedPrefix);
          });
        });

        if (matchingVideo) {
          r.video = '/api/videos/' + matchingVideo;
        }
      });

      run.status = code === 0 ? 'passed' : 'failed';
      run.completedAt = new Date().toISOString();
      run.duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
      run.results = results;
      run.logs = logs;

      await addTestRun(run);

      onProgress?.({ type: 'completed', run });
      emitProgress(runId, { type: 'completed', run });
      // runId already resolved earlier, no need to resolve again
    });

    childProcess.on('error', (error) => {
      activeRuns.delete(runId);
      run.status = 'failed';
      run.completedAt = new Date().toISOString();
      run.logs.push(error.message);

      onProgress?.({ type: 'error', run, error: error.message });
      emitProgress(runId, { type: 'error', error: error.message });

      reject(error);
    });
  });
}

export async function cancelTestRun(runId: string): Promise<boolean> {
  const activeRun = activeRuns.get(runId);
  if (!activeRun) {
    return false;
  }

  activeRun.status = 'stopping';
  activeRun.process.kill('SIGTERM');

  return true;
}

export async function getAvailableTags(): Promise<string[]> {
  const featuresDir = path.join(PROJECT_ROOT, 'src/features');
  const tags = new Set<string>();

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await scanDirectory(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.feature')) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
        const matches = content.matchAll(/@(\w+)/g);
        for (const match of matches) {
          tags.add(match[1]);
        }
      }
    }
  }

  try {
    await scanDirectory(featuresDir);
  } catch (error) {
    console.error('Error scanning features:', error);
  }

  return Array.from(tags).sort();
}

export async function getAvailableFeatures(): Promise<Array<{ name: string; tags: string[] }>> {
  const featuresDir = path.join(PROJECT_ROOT, 'src/features');
  const features: Array<{ name: string; tags: string[] }> = [];

  async function scanDirectory(dir: string, basePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await scanDirectory(path.join(dir, entry.name), basePath + entry.name + '/');
      } else if (entry.name.endsWith('.feature')) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
        const featureMatch = content.match(/Feature:\s*(.+)/);
        const name = featureMatch ? featureMatch[1].trim() : entry.name;
        const tagsMatch = content.match(/@([\w\s]+)/);
        const tags = tagsMatch ? tagsMatch[1].trim().split(/\s+/) : [];

        features.push({
          name: basePath + name,
          tags,
        });
      }
    }
  }

  try {
    await scanDirectory(featuresDir);
  } catch (error) {
    console.error('Error scanning features:', error);
  }

  return features;
}
