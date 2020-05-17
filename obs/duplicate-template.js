// @ts-check
const { writeFileSync } = require('fs');
const { basename, resolve } = require('path');

const OPTIONS = {
  REPEAT_COUNT: 20,
  SCENE_PREFIX: 'Slide-',
  IMAGE_PREFIX: 'slide:',
  FILE: resolve(__dirname, 'Adultos.json'),
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
    case '--count':
      OPTIONS.REPEAT_COUNT = Number(next());
      break;
    case '--scene-prefix':
      OPTIONS.SCENE_PREFIX = next();
      break;
    case '--image-prefix':
      OPTIONS.IMAGE_PREFIX = next();
      break;
    default:
      console.error(`Unrecognized option: ${argument}`);
      process.exit(1);
  }
}

const { REPEAT_COUNT, SCENE_PREFIX, IMAGE_PREFIX, FILE, OUT = FILE } = OPTIONS;

/** @type {import('./Adultos.json')} */
const json = require(resolve(__dirname, FILE));

const naturalCompare = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
}).compare;

const sceneTemplate = json.sources
  .filter((s) => s.id === 'scene' && s.name.startsWith(SCENE_PREFIX))
  .sort((a, b) => naturalCompare(a.name, b.name))[0];
const imageTemplate = json.sources
  .filter((s) => s.id === 'image_source' && s.name.startsWith(IMAGE_PREFIX))
  .sort((a, b) => naturalCompare(a.name, b.name))[0];

json.sources = json.sources.filter((s) => !s.name.startsWith(SCENE_PREFIX));
json.sources = json.sources.filter((s) => !s.name.startsWith(IMAGE_PREFIX));
json.scene_order = json.scene_order
  .filter((s) => !s.name.startsWith(SCENE_PREFIX))
  .concat(
    [...new Array(REPEAT_COUNT)].map((_, i) => ({
      name: `${SCENE_PREFIX}${(i + 1).toString().padStart(2, '0')}`,
    }))
  );

for (let index = 1; index <= REPEAT_COUNT; index++) {
  /** @type {typeof sceneTemplate} */
  const image = JSON.parse(JSON.stringify(sceneTemplate));
  /** @type {typeof imageTemplate} */
  const scene = JSON.parse(JSON.stringify(imageTemplate));

  const paddedIndex = index.toString().padStart(2, '0');

  scene.name = `${IMAGE_PREFIX}${paddedIndex}`;
  scene.hotkeys = {};
  scene.settings.file = scene.settings.file.replace(/\d+/i, index.toString());

  image.name = image.name.replace(/\d+/i, paddedIndex);
  image.settings.items.forEach((item) => {
    if (item.name.startsWith(IMAGE_PREFIX)) {
      item.name = scene.name;
    }
  });

  json.sources.push(scene, image);
}

if (OUT !== FILE) json.name = basename(OUT);
writeFileSync(OUT, JSON.stringify(json, null, '  '));
