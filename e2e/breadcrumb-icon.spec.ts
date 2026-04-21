import { expect, test } from '@playwright/test';

test('renders KRDS breadcrumb pseudo icons', async ({ page }) => {
  await page.goto('/');
  await page.setContent(
    `<!doctype html>
    <html data-theme-resolved="light">
      <head>
        <link rel="stylesheet" href="/src/styles/theme-tokens.css" />
        <link rel="stylesheet" href="/src/styles/krds.scss" />
        <link rel="stylesheet" href="/src/styles/app.scss" />
      </head>
      <body>
        <nav class="krds-breadcrumb-wrap" aria-label="브래드크럼">
          <ol class="breadcrumb" role="list">
            <li class="home"><a href="/dashboard" class="txt">홈</a></li>
            <li><a href="/stats/projects" class="txt" aria-current="page">프로젝트 통계</a></li>
          </ol>
        </nav>
      </body>
    </html>`,
    { waitUntil: 'networkidle' },
  );

  const iconStyles = await page.locator('.breadcrumb .home .txt').evaluate((element) => {
    const homeIcon = getComputedStyle(element, '::before');
    const separatorIcon = getComputedStyle(
      document.querySelector('.breadcrumb li'),
      '::after',
    );

    return {
      homeBackground: homeIcon.backgroundColor,
      homeMask: homeIcon.webkitMaskImage || homeIcon.maskImage,
      homeWidth: homeIcon.width,
      separatorBackground: separatorIcon.backgroundColor,
      separatorMask: separatorIcon.webkitMaskImage || separatorIcon.maskImage,
      separatorWidth: separatorIcon.width,
    };
  });

  expect(iconStyles.homeWidth).not.toBe('0px');
  expect(iconStyles.homeMask).toContain('data:image/svg+xml');
  expect(iconStyles.homeBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(iconStyles.separatorWidth).not.toBe('0px');
  expect(iconStyles.separatorMask).toContain('data:image/svg+xml');
  expect(iconStyles.separatorBackground).not.toBe('rgba(0, 0, 0, 0)');
});
