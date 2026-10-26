// Modèles articulés (mètres ; x droite, y avant, z haut ; origine = centre des pieds).
// Ces modèles servent uniquement de test de la méthode programmatique et de gabarits de proportions.
// Proportions stylisées (~4,5 têtes) : un rendu réaliste est illisible à moins de 40 px de haut.
import { Rig, rotX, rotY, rotZ, mmul, v } from './render.mjs';

const TAU = Math.PI * 2;

/** Jambe : rotation de la cuisse autour de l'axe x, flexion du genou. */
function leg(rig, side, swing, bend, hipZ, mats, L = { thigh: 0.3, shin: 0.29, r: 0.09, foot: [0.075, 0.125, 0.055] }) {
  const hip = [side * 0.1, 0, hipZ];
  const knee = v.add(hip, [0, Math.sin(swing) * L.thigh, -Math.cos(swing) * L.thigh]);
  const a2 = swing - bend;
  let ankle = v.add(knee, [0, Math.sin(a2) * L.shin, -Math.cos(a2) * L.shin]);
  if (ankle[2] < 0.06) ankle = [ankle[0], ankle[1], 0.06];
  rig.cap(hip, knee, L.r, mats.thigh);
  rig.cap(knee, ankle, L.r * 0.86, mats.shin);
  rig.ell(v.add(ankle, [0, 0.05, -0.01]), L.foot, mats.foot);
}

function arm(rig, shoulder, hand, elbowOut, mat, handMat, r = 0.068) {
  const elbow = v.add(v.lerp(shoulder, hand, 0.5), elbowOut);
  rig.cap(shoulder, elbow, r, mat);
  rig.cap(elbow, hand, r * 0.85, mat);
  rig.sphere(hand, r * 0.8, handMat);
}

/**
 * Survivant.
 * pose = { yaw, aimYaw, phase, stride, recoil, hit, reload, breathe }
 * stride : 0 (immobile) à 1 (marche) ou 1,4 (course).
 */
export function survivor(pose = {}, obj = 1) {
  const { yaw = Math.PI, phase = 0, stride = 0, recoil = 0, hit = 0, reload = 0, breathe = 0 } = pose;
  const aimYaw = pose.aimYaw ?? yaw;
  const rig = new Rig(obj);
  const bob = stride * Math.abs(Math.sin(phase * TAU)) * 0.04 + breathe * 0.015;
  const hipZ = 0.63 - stride * 0.025 + bob;

  // Bas du corps : orienté selon le déplacement.
  rig.push(rotZ(yaw));
  for (const [side, off] of [[1, 0], [-1, 0.5]]) {
    const ph = (phase + off) * TAU;
    const swing = Math.sin(ph) * 0.55 * stride;
    const bend = Math.max(0, -Math.cos(ph)) * 1.0 * stride + 0.06;
    leg(rig, side, swing, bend, hipZ, { thigh: 'pants', shin: 'pants', foot: 'leather' });
  }
  rig.ell([0, 0, hipZ + 0.03], [0.18, 0.125, 0.1], 'pants');
  rig.box([0, 0, hipZ + 0.11], [0.175, 0.125, 0.028], 'leather');
  rig.pop();

  // Haut du corps : orienté selon la visée, penché en arrière en cas de dégât.
  rig.push(rotZ(aimYaw));
  rig.push(rotX(hit * 0.35 - stride * 0.1), [0, 0, hipZ]);
  const tz = hipZ + 0.31;
  rig.ell([0, 0, tz], [0.215, 0.14, 0.22], 'jacket');
  rig.ell([0, 0.015, tz - 0.17], [0.19, 0.13, 0.08], 'jacket');
  rig.cap([0, 0, tz + 0.18], [0, 0.01, tz + 0.24], 0.065, 'skin');
  // Tête (grosse) ; casquette portée à l'envers pour dégager le visage vu d'en haut.
  const hz = tz + 0.39;
  rig.push(rotX(hit * 0.25 - reload * 0.35), [0, 0, tz + 0.22]);
  rig.sphere([0, 0.01, hz], 0.185, 'skin');
  rig.ell([0, -0.045, hz + 0.005], [0.18, 0.16, 0.17], 'hair');
  rig.ell([0, -0.01, hz + 0.1], [0.19, 0.19, 0.095], 'cap');
  rig.box([0, -0.2, hz + 0.075], [0.11, 0.085, 0.016], 'cap', rotX(0.15));
  for (const s of [-1, 1]) rig.decal([s * 0.065, 0.185, hz - 0.01], [24, 16, 22], { tolerance: 0.05 });
  rig.decal([0, 0.18, hz - 0.1], [120, 58, 50], { tolerance: 0.05 });
  rig.pop();
  // Sac à dos et couverture roulée.
  rig.box([0, -0.2, tz + 0.02], [0.155, 0.08, 0.17], 'pack');
  rig.cap([-0.15, -0.21, tz + 0.2], [0.15, -0.21, tz + 0.2], 0.06, 'leather');
  rig.box([0, -0.285, tz - 0.03], [0.11, 0.022, 0.08], 'pack');

  // Fusil d'assaut (surdimensionné pour la lisibilité) : recul axial, bascule au rechargement.
  const gz = tz - 0.05;
  const back = recoil * 0.08;
  rig.push(rotX(-reload * 0.7), [0.07, 0.1, gz]);
  rig.box([0.07, 0.3 - back, gz], [0.04, 0.27, 0.058], 'gun');
  rig.box([0.07, -0.02 - back, gz - 0.03], [0.036, 0.1, 0.058], 'gunwood');
  rig.box([0.07, 0.34 - back, gz - 0.11], [0.028, 0.04, 0.08 * (1 - reload * 0.8)], 'gun', rotX(0.25));
  rig.box([0.07, 0.24 - back, gz + 0.075], [0.016, 0.07, 0.018], 'gun');
  rig.cap([0.07, 0.57 - back, gz + 0.015], [0.07, 0.76 - back, gz + 0.015], 0.022, 'gun');
  rig.muzzle = rig.P([0.07, 0.79 - back, gz + 0.015]);
  const grip = [0.08, 0.12 - back, gz - 0.05];
  const fore = reload > 0.3 ? [0.03, 0.3, gz - 0.2] : [0.05, 0.46 - back, gz - 0.02];
  const foreW = rig.P(fore);
  const gripW = rig.P(grip);
  rig.pop();
  // Les mains suivent l'arme (positions calculées dans le repère de l'arme).
  arm(rig, [0.235, 0.0, tz + 0.13], toLocal(rig, gripW), [0.11, -0.08, -0.1], 'jacket', 'skin');
  arm(rig, [-0.235, 0.0, tz + 0.13], toLocal(rig, foreW), [-0.13, 0.02, -0.1], 'jacket', 'skin');
  rig.pop();
  rig.pop();
  return rig;
}

/** Convertit un point monde dans le repère courant du rig. */
function toLocal(rig, p) {
  const { M, t } = rig.T;
  const q = v.sub(p, t);
  return [M[0] * q[0] + M[3] * q[1] + M[6] * q[2], M[1] * q[0] + M[4] * q[1] + M[7] * q[2], M[2] * q[0] + M[5] * q[1] + M[8] * q[2]];
}

/**
 * Rôdeur : zombie de référence (archétype « standard », inspiré du concept des Husks,
 * design original). Silhouette voûtée, bras longs, excroissance cristalline d'énergie sur l'épaule.
 * pose = { yaw, phase, stride, attack, hit, death }
 */
export function shambler(pose = {}, obj = 2) {
  const { yaw = Math.PI, phase = 0, stride = 0, attack = 0, hit = 0, death = 0 } = pose;
  const rig = new Rig(obj);
  rig.push(rotZ(yaw));
  // Chute en arrière à la mort : rotation globale autour des talons.
  rig.push(rotX(death * 1.45), [0, -0.12, 0], [0, -death * 0.2, 0]);
  const limp = Math.sin(phase * TAU);
  const hipZ = 0.6 + stride * Math.abs(limp) * 0.035;
  const LEG = { thigh: 0.3, shin: 0.28, r: 0.082, foot: [0.07, 0.13, 0.05] };
  for (const [side, off, amp] of [[1, 0, 0.6], [-1, 0.5, 0.32]]) {
    const ph = (phase + off) * TAU;
    const swing = Math.sin(ph) * amp * stride;
    const bend = Math.max(0, -Math.cos(ph)) * 0.6 * stride + 0.2;
    leg(rig, side * 1.15, swing, bend, hipZ, { thigh: 'zpants', shin: 'zpants', foot: 'zskin' }, LEG);
  }
  rig.ell([0, 0, hipZ + 0.03], [0.18, 0.12, 0.1], 'zpants');

  // Buste voûté vers l'avant, roulis de démarche, recul lors d'un impact.
  // Attaque : armé en arrière (redressé), puis coup plongeant vers l'avant.
  const swing = attack > 0 ? Math.sin(attack * Math.PI) : 0;
  const hunch = 0.36 - hit * 0.45 - (attack > 0 && attack < 0.5 ? swing * 0.35 : 0) + (attack >= 0.5 ? swing * 0.45 : 0);
  rig.push(mmul(rotY(limp * 0.1 * stride), rotX(-hunch)), [0, 0, hipZ]);
  const tz = hipZ + 0.3;
  rig.ell([0, 0, tz], [0.23, 0.15, 0.24], 'zcloth');
  rig.ell([0.03, 0.05, tz - 0.12], [0.16, 0.11, 0.08], 'zskin');
  rig.ell([-0.13, 0.09, tz - 0.03], [0.07, 0.06, 0.09], 'zskin');
  // Excroissance cristalline (émissive) sur l'épaule gauche : signature visuelle de la famille.
  rig.box([-0.21, -0.05, tz + 0.22], [0.05, 0.05, 0.12], 'storm', mmul(rotY(-0.5), rotX(0.3)));
  rig.box([-0.12, -0.1, tz + 0.25], [0.035, 0.035, 0.08], 'storm', mmul(rotY(0.4), rotX(-0.3)));
  // Tête basse et projetée en avant, mâchoire pendante, yeux luminescents.
  const hz = tz + 0.31;
  rig.push(rotX(0.1 + hit * 0.45), [0, 0.05, tz + 0.2]);
  rig.sphere([0, 0.1, hz], 0.17, 'zskin');
  rig.ell([0, 0.19, hz - 0.1], [0.11, 0.08, 0.06], 'zskin');
  for (const s of [-1, 1]) rig.decal([s * 0.065, 0.265, hz + 0.01], [255, 122, 244], { tolerance: 0.06 });
  rig.decal([0, 0.27, hz - 0.11], [36, 18, 30], { tolerance: 0.05 });
  rig.pop();
  // Bras longs tendus ; balancement en marche, coup descendant pendant l'attaque.
  const reach = 0.44 + (attack >= 0.5 ? swing * 0.2 : -swing * 0.15);
  for (const s of [1, -1]) {
    const sway = Math.sin(phase * TAU + (s > 0 ? 0 : Math.PI)) * 0.09 * stride;
    const up = attack > 0 ? (attack < 0.5 ? swing * 0.75 : swing * 0.75 - (attack - 0.5) * 1.2) : 0;
    const hand = [s * 0.18, reach + sway, tz - 0.12 + up];
    arm(rig, [s * 0.24, 0.02, tz + 0.13], hand, [s * 0.07, -0.06, -0.06], 'zskin', 'zskin', 0.062);
  }
  rig.pop();
  rig.pop();
  rig.pop();
  return rig;
}

// --- Décor -----------------------------------------------------------------------------------

export function crate(rig, x, y, s = 0.8, yaw = 0) {
  rig.push(rotZ(yaw), [0, 0, 0], [x, y, 0]);
  const h = s / 2;
  rig.box([0, 0, h], [h * 0.93, h * 0.93, h * 0.93], 'wood');
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) rig.box([sx * h * 0.9, sy * h * 0.9, h], [0.045, 0.045, h], 'woodDark');
  rig.box([0, 0, s * 0.97], [h, 0.05, 0.03], 'woodDark');
  rig.pop();
}

export function barricade(rig, x, y, yaw = 0) {
  rig.push(rotZ(yaw), [0, 0, 0], [x, y, 0]);
  for (const sx of [-0.7, 0.7]) rig.box([sx, 0, 0.5], [0.06, 0.06, 0.5], 'woodDark');
  const planks = [[0.3, 0.05], [0.58, -0.07], [0.86, 0.1]];
  for (const [z, roll] of planks) rig.box([0, 0.08, z], [0.9, 0.025, 0.1], 'wood', rotY(roll));
  rig.pop();
}

export function barrel(rig, x, y) {
  rig.cyl([x, y, 0], 0.29, 0.88, 'barrel');
  rig.cyl([x, y, 0.27], 0.305, 0.04, 'metal');
  rig.cyl([x, y, 0.58], 0.305, 0.04, 'metal');
  rig.cyl([x, y, 0.88], 0.22, 0.015, 'metal');
}

export function jersey(rig, x, y, yaw = 0) {
  rig.push(rotZ(yaw), [0, 0, 0], [x, y, 0]);
  rig.box([0, 0, 0.2], [1.0, 0.3, 0.2], 'concrete');
  rig.box([0, 0, 0.55], [1.0, 0.13, 0.17], 'concrete');
  rig.pop();
}

export function tree(rig, x, y) {
  rig.cap([x, y, 0], [x, y, 1.6], 0.15, 'bark');
  rig.sphere([x, y, 2.2], 0.75, 'leaf');
  rig.sphere([x - 0.45, y + 0.1, 1.8], 0.5, 'leaf');
  rig.sphere([x + 0.5, y - 0.15, 1.9], 0.5, 'leaf');
  rig.sphere([x + 0.1, y + 0.2, 2.75], 0.45, 'leaf');
}

export function lamp(rig, x, y) {
  rig.cap([x, y, 0], [x, y, 3.0], 0.06, 'metal');
  rig.cap([x, y, 3.0], [x + 0.55, y, 3.05], 0.05, 'metal');
  rig.box([x + 0.6, y, 2.98], [0.14, 0.08, 0.05], 'metal');
  rig.box([x + 0.6, y, 2.92], [0.1, 0.05, 0.015], 'lamp');
}
