import { setWorldConstructor, World } from '@cucumber/cucumber';

/**
 * Custom World class for Cucumber
 * Shares context between step definitions
 */
export class CustomWorld extends World {
  public page: any;
  public browser: any;
  public testData: Map<string, any> = new Map();
  public failedStep?: string;
  public failedStepError?: string;
  public scenarioName?: string;

  constructor(options: any) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
