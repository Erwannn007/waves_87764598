// Point d'entrée : configuration Phaser pixel-art et mise à l'échelle par facteur entier.
import Phaser from 'phaser';
import { computeLayout, setLayout } from './core/screen';
import { onSettingsChange, settingsStatus } from './core/settings';
import { AnimLabScene } from './scenes/AnimLabScene';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MenuScene } from './scenes/MenuScene';

const l = computeLayout();
setLayout(l);
if (settingsStatus === 'corrupt') console.warn('Paramètres corrompus : valeurs par défaut utilisées (copie conservée dans le stockage local).');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#14110f',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, width: l.width, height: l.height, zoom: l.zoom },
  input: { activePointers: 4 },
  disableContextMenu: true,
  scene: [BootScene, MenuScene, GameScene, HudScene, AnimLabScene],
});

function fit(): void {
  const next = computeLayout();
  setLayout(next);
  game.scale.resize(next.width, next.height);
  game.scale.setZoom(next.zoom);
}
let pending = 0;
const schedule = () => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(fit);
};
window.addEventListener('resize', schedule);
window.addEventListener('orientationchange', () => setTimeout(schedule, 250));
window.visualViewport?.addEventListener('resize', schedule);
onSettingsChange(schedule);
// Pause automatique quand l'application passe en arrière-plan.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.loop.sleep();
  else game.loop.wake();
});
(window as unknown as { __game?: Phaser.Game }).__game = game;
