import { expect, test, type Page } from '@playwright/test';

type Win = Window & { __game?: any; __waves?: any };

async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`échec ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  await page.goto('./');
  await page.waitForFunction(() => (window as Win).__game?.scene.isActive('menu'), null, { timeout: 30_000 });
  return errors;
}

/** Centre d'un bouton du menu, en pixels CSS. */
async function menuButton(page: Page, index: number): Promise<{ x: number; y: number }> {
  return page.evaluate((i) => {
    const g = (window as Win).__game;
    const b = g.scene.getScene('menu').router.buttons[i];
    const z = g.scale.zoom;
    return { x: (b.x + b.w / 2) * z, y: (b.y + b.h / 2) * z };
  }, index);
}

test('le jeu se charge, la mise à l’échelle est entière, aucun asset ne manque', async ({ page }, info) => {
  const errors = await boot(page);
  const m = await page.evaluate(() => {
    const g = (window as Win).__game;
    return { w: g.scale.width, h: g.scale.height, zoom: g.scale.zoom, dpr: devicePixelRatio };
  });
  // Un pixel interne = un nombre entier de pixels physiques.
  expect(Number.isInteger(Math.round(m.zoom * m.dpr * 1000) / 1000)).toBe(true);
  expect(m.h).toBeGreaterThanOrEqual(200);
  await page.screenshot({ path: `test-results/${info.project.name}-menu.png` });
  const p = await menuButton(page, 0);
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForFunction(() => (window as Win).__game?.scene.isActive('game') && (window as Win).__game?.scene.isActive('hud'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/${info.project.name}-jeu.png` });
  expect(errors).toEqual([]);
});

test('double joystick : déplacement, visée et tir au toucher (Chromium, multi-touch réel)', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'le multi-touch scripté passe par le protocole Chromium (CDP)');
  const errors = await boot(page);
  const p = await menuButton(page, 0);
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForFunction(() => (window as Win).__waves?.player);
  await page.waitForTimeout(300);
  const cdp = await page.context().newCDPSession(page);
  const vp = page.viewportSize()!;
  const before = await page.evaluate(() => { const g = (window as Win).__waves; return { x: g.player.x, y: g.player.y, ammo: g.player.weapon.ammo }; });
  const fire = await page.evaluate(() => {
    const h = (window as Win).__game.scene.getScene('hud');
    const b = h.fireBtn;
    const z = (window as Win).__game.scale.zoom;
    return { x: (b.x + b.w / 2) * z, y: (b.y + b.h / 2) * z };
  });
  const L = { x: vp.width * 0.18, y: vp.height * 0.7 };
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', pts: { x: number; y: number; id: number }[]) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((t) => ({ x: t.x, y: t.y, id: t.id })) });
  // Pouce gauche posé puis glissé vers la droite ; pouce droit sur TIR, glissé vers le haut (visée).
  await touch('touchStart', [{ ...L, id: 1 }]);
  await touch('touchStart', [{ ...L, id: 1 }, { ...fire, id: 2 }]);
  for (let i = 1; i <= 10; i++) {
    await touch('touchMove', [{ x: L.x + i * 6, y: L.y, id: 1 }, { x: fire.x - i * 3, y: fire.y - i * 4, id: 2 }]);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(700);
  const during = await page.evaluate(() => { const g = (window as Win).__waves; return { x: g.player.x, y: g.player.y, ammo: g.player.weapon.ammo }; });
  await page.screenshot({ path: `test-results/${info.project.name}-combat.png` });
  await touch('touchEnd', []);
  expect(Math.hypot(during.x - before.x, during.y - before.y)).toBeGreaterThan(1);
  expect(during.ammo).toBeLessThan(before.ammo);
  expect(errors).toEqual([]);
});
