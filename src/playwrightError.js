function formatPlaywrightLaunchError(err) {
  const rawMessage = err && err.message ? String(err.message) : String(err);

  if (/Executable doesn't exist/i.test(rawMessage)) {
    return [
      'Playwright could not find a Chromium executable to launch.',
      '',
      'Fix:',
      '  - Run `npx playwright install chromium`',
      '',
      'Notes:',
      '  - If you previously set `PLAYWRIGHT_BROWSERS_PATH=0`, remove it or reinstall browsers with that env var set.',
    ].join('\n');
  }

  if (/libglib-2\.0\.so\.0/i.test(rawMessage)) {
    return [
      'Playwright launched Chromium, but the host OS is missing required shared libraries (libglib-2.0.so.0).',
      '',
      'Fix (Linux/Debian/Ubuntu):',
      '  - Run `npx playwright install --with-deps chromium`',
      '',
      'Fix (Docker):',
      '  - Use a Playwright base image (recommended), or install the system deps in your image.',
    ].join('\n');
  }

  if (/browserType\.launch/i.test(rawMessage)) {
    return [
      'Playwright failed to launch Chromium.',
      '',
      rawMessage,
      '',
      'Common fixes:',
      '  - Run `npx playwright install chromium`',
      '  - On Linux, run `npx playwright install --with-deps chromium`',
    ].join('\n');
  }

  return rawMessage;
}

module.exports = {
  formatPlaywrightLaunchError,
};
