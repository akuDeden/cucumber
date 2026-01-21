export default {
  default: {
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    import: ['src/steps/**/*.ts', 'src/hooks/**/*.ts'],
    paths: ['src/features/**/*.feature'],
    publishQuiet: true,
    tags: 'not @skip', // Exclude scenarios tagged with @skip
    timeout: 120000 // Increase timeout to 120 seconds (2 minutes)
  }
};
