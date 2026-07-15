const adjectives = [
  'Sleepy', 'Grumpy', 'Cheery', 'Clever', 'Dapper', 'Eager', 'Fancy', 'Jolly',
  'Witty', 'Spunky', 'Quirky', 'Silly', 'Lively', 'Zesty', 'Brave', 'Gentle',
  'Polite', 'Proud', 'Calm', 'Merry', 'Happy', 'Funky', 'Cosmic', 'Radiant',
  'Sparkly', 'Nifty', 'Speedy', 'Sneaky', 'Bubbly', 'Chilled'
];

const animals = [
  'Narwhal', 'Capybara', 'Koala', 'Panda', 'Otter', 'Sloth', 'Penguin', 'Alpaca',
  'Axolotl', 'Meerkat', 'Hedgehog', 'Wombat', 'Quokka', 'Octopus', 'Dolphin', 'Fox',
  'Squirrel', 'Lemur', 'Platypus', 'Chameleon', 'Giraffe', 'Koala', 'Hamster', 'Badger',
  'Beaver', 'Chipmunk', 'Flamingo', 'Seal', 'Walrus', 'Ferret'
];

export function generateRandomName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const anim = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${anim}`;
}

const PLAYER_COLOR_COUNT = 4;

export interface PlayerColor {
  /** Solid, theme-aware, AA-contrast text/icon color */
  fg: string;
  /** Soft tint for avatar/chip backgrounds */
  bg: string;
  /** Stronger tint for borders/rings */
  border: string;
}

/**
 * Deterministic per-player color, derived from the display name so the host
 * roster, the buzz-queue cards, the results screen and the player's own
 * screen all agree without any extra protocol traffic. Values resolve
 * through the theme-aware --player-N tokens in main.css.
 */
export function getPlayerColor(name: string): PlayerColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const n = (hash % PLAYER_COLOR_COUNT) + 1;
  return {
    fg: `var(--player-${n})`,
    bg: `color-mix(in srgb, var(--player-${n}) 14%, transparent)`,
    border: `color-mix(in srgb, var(--player-${n}) 45%, transparent)`
  };
}

/** "Sleepy Otter" -> "SO", "Max" -> "M" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}
