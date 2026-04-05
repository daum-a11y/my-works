'use strict';

module.exports = function format(results) {
  const lines = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const result of results) {
    if (!result.messages.length) {
      continue;
    }

    lines.push(result.filePath);

    for (const message of result.messages) {
      const severity = message.severity === 2 ? 'error' : 'warn';
      const location = `${message.line ?? 0}:${message.column ?? 0}`;
      const ruleId = message.ruleId ? ` ${message.ruleId}` : '';

      lines.push(`  ${location}  ${severity}  ${message.message}${ruleId}`);

      if (message.severity === 2) {
        errorCount += 1;
      } else {
        warningCount += 1;
      }
    }
  }

  if (lines.length === 0) {
    return '';
  }

  lines.push('');
  lines.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
  lines.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);

  return `${lines.join('\n')}\n`;
};
