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

/**
 * Returns a CSS hex/variable style configuration for a participant based on join order
 */
export function getParticipantColor(index: number): { name: string; bg: string; text: string } {
  // Orange, Teal, Purple, Blue rotating
  const palette = [
    { name: 'Orange', bg: 'rgba(222, 131, 0, 0.15)', text: '#de8300' },
    { name: 'Teal', bg: 'rgba(15, 123, 108, 0.15)', text: '#0f7b6c' },
    { name: 'Purple', bg: 'rgba(111, 66, 193, 0.15)', text: '#6f42c1' },
    { name: 'Blue', bg: 'rgba(18, 100, 163, 0.15)', text: '#1264a3' }
  ];
  return palette[index % palette.length];
}
