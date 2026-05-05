import { Formatter, type IFormatterOptions } from '@cucumber/cucumber'
import * as messages from '@cucumber/messages'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseTestCaseAttempt } = require('@cucumber/cucumber/lib/formatter/helpers/index') as {
  parseTestCaseAttempt: (opts: {
    testCaseAttempt: unknown
    snippetBuilder: unknown
    supportCodeLibrary: unknown
  }) => {
    testCase: { name: string; attempt: number; sourceLocation?: { uri: string; line: number } }
    testSteps: Array<{
      keyword: string
      text?: string
      result: messages.TestStepResult
      actionLocation?: { uri: string; line: number }
    }>
  }
}

const TAIL_COUNT = 2

function fmtLoc(loc?: { uri: string; line: number }): string {
  if (!loc) return ''
  return `${loc.uri}:${loc.line}`
}

interface FailedScenario {
  name: string
  location: string
  steps: Array<{
    keyword: string
    text: string
    isFailed: boolean
    stepLoc: string
    errorLines: string[]
  }>
}

export default class TailFormatter extends Formatter {
  private scenarioCount = 0
  private failCount = 0
  private passCount = 0
  private startTime = Date.now()
  private totalSteps = 0
  private failedSteps = 0
  private skippedSteps = 0
  private passedSteps = 0
  private failures: FailedScenario[] = []
  private passed: string[] = []

  constructor(options: IFormatterOptions) {
    super(options)
    options.eventBroadcaster.on('envelope', (envelope: messages.Envelope) => {
      if (envelope.testCaseFinished) {
        this.onTestCaseFinished(envelope.testCaseFinished)
      }
      if (envelope.testRunFinished) {
        this.onTestRunFinished()
      }
    })
  }

  private onTestCaseFinished(event: messages.TestCaseFinished): void {
    const attempt = this.eventDataCollector.getTestCaseAttempt(event.testCaseStartedId)
    const parsed = parseTestCaseAttempt({
      testCaseAttempt: attempt,
      snippetBuilder: this.snippetBuilder,
      supportCodeLibrary: this.supportCodeLibrary,
    })

    this.scenarioCount++

    const steps = parsed.testSteps.filter(s => s.text !== undefined)

    for (const step of steps) {
      this.totalSteps++
      switch (step.result.status) {
        case messages.TestStepResultStatus.PASSED:
          this.passedSteps++
          break
        case messages.TestStepResultStatus.FAILED:
        case messages.TestStepResultStatus.AMBIGUOUS:
          this.failedSteps++
          break
        default:
          this.skippedSteps++
      }
    }

    const isPassed =
      attempt.worstTestStepResult.status === messages.TestStepResultStatus.PASSED

    if (isPassed) {
      this.passCount++
      this.passed.push(parsed.testCase.name)
      return
    }

    this.failCount++

    const failIdx = steps.findIndex(
      s =>
        s.result.status === messages.TestStepResultStatus.FAILED ||
        s.result.status === messages.TestStepResultStatus.AMBIGUOUS
    )

    if (failIdx === -1) {
      this.failures.push({ name: parsed.testCase.name, location: fmtLoc(parsed.testCase.sourceLocation), steps: [] })
      return
    }

    const startIdx = Math.max(0, failIdx - TAIL_COUNT)
    const relevantSteps = steps.slice(startIdx, failIdx + 1)

    this.failures.push({
      name: parsed.testCase.name,
      location: fmtLoc(parsed.testCase.sourceLocation),
      steps: relevantSteps.map(step => {
        const isFailed =
          step.result.status === messages.TestStepResultStatus.FAILED ||
          step.result.status === messages.TestStepResultStatus.AMBIGUOUS
        return {
          keyword: step.keyword,
          text: step.text ?? '',
          isFailed,
          stepLoc: step.actionLocation ? ` # ${fmtLoc(step.actionLocation)}` : '',
          errorLines: isFailed && step.result.message
            ? step.result.message.split('\n').slice(0, 4)
            : [],
        }
      }),
    })
  }

  private onTestRunFinished(): void {
    const c = this.colorFns
    const red = c.forStatus(messages.TestStepResultStatus.FAILED)
    const green = c.forStatus(messages.TestStepResultStatus.PASSED)
    const cyan = c.forStatus(messages.TestStepResultStatus.SKIPPED)
    const gray = c.location
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(3)

    if (this.passed.length > 0) {
      this.log(`\n${green('Passed:')}\n`)
      this.passed.forEach(name => {
        this.log(`  ${green(`✔ ${name}`)}\n`)
      })
    }

    if (this.failures.length > 0) {
      this.log(`\n${red('Failures:')}\n`)
      this.failures.forEach((scenario, i) => {
        this.log(`\n${red(`${i + 1}) Scenario: ${scenario.name}`)} ${gray(`# ${scenario.location}`)}\n`)
        for (const step of scenario.steps) {
          if (step.isFailed) {
            this.log(`   ${red(`✖ ${step.keyword}${step.text}`)}${gray(step.stepLoc)}\n`)
            for (const line of step.errorLines) {
              this.log(`       ${c.errorStack(line)}\n`)
            }
          } else {
            this.log(`   ${green(`✔ ${step.keyword}${step.text}`)}${gray(step.stepLoc)}\n`)
          }
        }
      })
    }

    this.log('\n')

    const scenarioParts: string[] = []
    if (this.failCount > 0) scenarioParts.push(red(`${this.failCount} failed`))
    if (this.passCount > 0) scenarioParts.push(green(`${this.passCount} passed`))
    this.log(`${this.scenarioCount} scenarios (${scenarioParts.join(', ')})\n`)

    const stepParts: string[] = []
    if (this.failedSteps > 0) stepParts.push(red(`${this.failedSteps} failed`))
    if (this.skippedSteps > 0) stepParts.push(cyan(`${this.skippedSteps} skipped`))
    if (this.passedSteps > 0) stepParts.push(green(`${this.passedSteps} passed`))
    this.log(`${this.totalSteps} steps (${stepParts.join(', ')})\n`)
    this.log(`${elapsed}s\n`)
  }
}
