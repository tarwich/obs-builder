// @ts-check
const { writeFileSync } = require('fs');
const { basename, resolve } = require('path');
const { Swatch } = require('./lib/swatch');
const { Source } = require('./lib/source');
const { SceneCollection } = require('./lib/scene-collection');

const OPTIONS = {
  FILE: resolve(__dirname, 'Adultos.json'),
  COLORS: {
    'barcelona-1': '#27282d',
    'barcelona-2': '#474d4b',
    'barcelona-3': '#f83d96',
    'barcelona-4': '#e0f700',
    'barcelona-5': '#fdfef6',
    'sky-1': '#332145',
    'sky-2': '#bd3254',
    'sky-3': '#99889a',
    'sky-4': '#ff5350',
    'sky-5': '#ffdd94',
    'human-1': '#284053',
    'human-2': '#427195',
    'human-3': '#8dbcdd',
    'human-4': '#f5d6ba',
    'human-5': '#f9e4cb',
    'hacker-1': '#ff660',
    'hacker-2': '#f6f6ee',
    'hacker-3': '#828282',
    'hacker-4': '#000000',
    'hacker-5': '#ff0000',
    'beach-1': '#886654',
    'beach-2': '#df9874',
    'beach-3': '#efcca7',
    'beach-4': '#eeeeee',
    'beach-5': '#cc98cd',
    'mac-1': '#425555',
    'mac-2': '#869999',
    'mac-3': '#3f98df',
    'mac-4': '#dddddd',
    'mac-5': '#a9cccd',
  },
};

// Process arguments
for (let index = 2; index < process.argv.length; index++) {
  const argument = process.argv[index];
  const next = () => process.argv[++index];

  switch (argument) {
    case '--file':
      OPTIONS.FILE = resolve(next());
      break;
    case '--out':
      OPTIONS.OUT = resolve(next());
      break;
    default:
      console.error(`Unrecognized option: ${argument}`);
      process.exit(1);
  }
}

const { COLORS, FILE, OUT = FILE } = OPTIONS;

/** @type {SceneCollection} */
const json = require(resolve(__dirname, FILE));

const swatchScene = json.sources.find(
  (source) => source.id === 'scene' && source.name === 'Swatches'
);

if (!swatchScene) {
  console.log('No swatch scene found');
  process.exit(0);
}

/**
 * @template T
 * @param {T} item
 * @returns {T}
 */
const clone = (item) => JSON.parse(JSON.stringify(item));

const swatchInstance = swatchScene.settings.items[0];

swatchScene.settings.items = [];

for (const [name, hex] of Object.entries(COLORS)) {
  const swatchName = `color:${name}`;
  const [r, g, b] = hex.match(/([a-f0-9]{2})/g);
  const color = parseInt(`ff${b}${g}${r}`, 16);
  json.sources = json.sources.filter((s) => s.name !== swatchName);
  const swatch = new Swatch({ name: swatchName, color });
  json.sources.push(swatch);

  const [_, base, generation] = name.match(/^(.*?)(\d+)$/);
  const iItem = swatchScene.settings.items.length;
  /** @type {Partial<swatchScene['settings']['items'][0]>} */
  const instance = Object.assign(new Source(), {
    name: swatchName,
    id: iItem,
    pos: {
      x: (iItem % 10) * 100,
      y: Math.floor(iItem / 10) * 100,
    },
  });
  instance.name = swatchName;

  swatchScene.settings.items[iItem] = instance;
}

swatchScene.settings.items = swatchScene.settings.items.reverse();

if (OUT !== FILE) json.name = basename(OUT);
writeFileSync(OUT, JSON.stringify(json, null, '  '));
