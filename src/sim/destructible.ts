// Structure destructible à états visuels prédéfinis (intact → endommagé → détruit).
export interface StateThreshold {
  name: string;
  /** L'état s'applique tant que pv/pvMax est strictement supérieur à ce seuil (le dernier état à 0). */
  above: number;
}

export const DEFAULT_STATES: StateThreshold[] = [
  { name: 'intact', above: 0.5 },
  { name: 'damaged', above: 0 },
  { name: 'destroyed', above: -Infinity },
];

export class Destructible {
  hp: number;
  constructor(readonly maxHp: number, readonly states: StateThreshold[] = DEFAULT_STATES) {
    this.hp = maxHp;
  }
  get state(): string {
    const f = this.hp / this.maxHp;
    return (this.states.find((s) => f > s.above) ?? this.states[this.states.length - 1]).name;
  }
  get destroyed(): boolean {
    return this.hp <= 0;
  }
  /** Applique des dégâts ; renvoie le nouvel état s'il a changé, sinon null. */
  damage(amount: number): string | null {
    if (this.destroyed) return null;
    const before = this.state;
    this.hp = Math.max(0, this.hp - amount);
    const after = this.state;
    return after !== before ? after : null;
  }
}
