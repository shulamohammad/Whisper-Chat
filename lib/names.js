const ADJECTIVES = [
  'Silent', 'Curious', 'Lucky', 'Mystic', 'Brave', 'Calm', 'Swift', 'Cosmic',
  'Hidden', 'Wandering', 'Gentle', 'Bold', 'Quiet', 'Neon', 'Golden', 'Silver',
  'Midnight', 'Sunny', 'Frozen', 'Wild', 'Shy', 'Clever', 'Dreamy', 'Velvet',
];

const NOUNS = [
  'Fox', 'Owl', 'Panda', 'Wolf', 'Hawk', 'Tiger', 'Bear', 'Raven',
  'Phoenix', 'Dolphin', 'Lynx', 'Falcon', 'Otter', 'Badger', 'Crane', 'Koala',
  'Panther', 'Moth', 'Comet', 'River', 'Cloud', 'Shadow', 'Spark', 'Echo',
];

export function generateStrangerName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${suffix}`;
}

export function uniqueStrangerName(usedNames) {
  for (let i = 0; i < 20; i++) {
    const name = generateStrangerName();
    if (!usedNames.has(name)) return name;
  }
  return generateStrangerName();
}
