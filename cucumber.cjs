module.exports = {
  default: {
    format: [
      './src/formatters/tail-formatter.ts',
      'html:cucumber-report.html',
      'json:cucumber-report.json',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    import: ['src/steps/**/*.ts', 'src/hooks/**/*.ts'],
    paths: ['src/features/**/*.feature'],
    publishQuiet: true,
    tags: 'not @skip',
    timeout: 120000,
  },
}
