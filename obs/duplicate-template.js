// @ts-check
const { writeFileSync } = require('fs');
const { dirname, resolve } = require('path');

const OPTIONS = {
  FILE: resolve(__dirname, 'Adultos.json'),
  REPEAT_COUNT: 20,
  SCENE_PREFIX: 'Slide-',
  IMAGE_PREFIX: 'slide:',
};

// Process arguments
for (let index = 2; index < process.argv.length; index++) {
  const argument = process.argv[index];
  const next = () => process.argv[++index];

  switch (argument) {
    case '--file':
      OPTIONS.FILE = resolve(next());
      break;
    case '--count':
      OPTIONS.REPEAT_COUNT = Number(next());
      break;
    default:
      console.error(`Unrecognized option: ${argument}`);
      process.exit(1);
  }
}

const { REPEAT_COUNT, SCENE_PREFIX, IMAGE_PREFIX, FILE } = OPTIONS;

// /** @type {import('./Adultos.json')} */
// const json = require(resolve(__dirname, FILE));

// const scriptureTemplate = json.sources.filter(
//   (s) => s.id === "scene" && s.name.startsWith(SCENE_PREFIX)
// )[0];
// const slideTemplate = json.sources.filter(
//   (s) => s.id === "image_source" && s.name.startsWith(IMAGE_PREFIX)
// )[0];

// json.sources = json.sources.filter((s) => !s.name.startsWith(SCENE_PREFIX));
// json.sources = json.sources.filter((s) => !s.name.startsWith(IMAGE_PREFIX));
// json.scene_order = json.scene_order
//   .filter((s) => !s.name.startsWith(SCENE_PREFIX))
//   .concat(
//     [...new Array(REPEAT_COUNT)].map((_, i) => ({
//       name: `${SCENE_PREFIX}${(i + 1).toString().padStart(2, "0")}`,
//     }))
//   );

// for (let index = 1; index <= REPEAT_COUNT; index++) {
//   /** @type {typeof scriptureTemplate} */
//   const scripture = JSON.parse(JSON.stringify(scriptureTemplate));
//   /** @type {typeof slideTemplate} */
//   const slide = JSON.parse(JSON.stringify(slideTemplate));

//   const paddedIndex = index.toString().padStart(2, "0");

//   slide.name = `${IMAGE_PREFIX}${paddedIndex}`;
//   slide.hotkeys = {};
//   slide.settings.file = slide.settings.file.replace(/\d+/i, index.toString());

//   scripture.hotkeys = {};
//   scripture.name = scripture.name.replace(/\d+/i, paddedIndex);
//   scripture.settings.items.forEach((item) => {
//     if (item.name.startsWith(IMAGE_PREFIX)) {
//       item.name = slide.name;
//     }
//   });
//   json.sources.push(slide, scripture);
// }

// writeFileSync(FILE, JSON.stringify(json, null, "  "));

class Source {
  /** @type {'scene' | 'image_source'} */
  id = 'scene';
  name = '';

  constructor(source) {
    Object.assign(this, source);
  }
}

class Scene extends Source {
  // this['push-to-mute'] = false;
  // this['push-to-mute-delay'] = 0;
  // this['push-to-talk'] = false;
  // this['push-to-talk-delay'] = 0;
  balance = 0.5;
  deinterlace_field_order = 0;
  deinterlace_mode = 0;
  enabled = true;
  flags = 0;
  hotkeys = {};
  /** @type {'scene'} */
  id = 'scene';
  mixers = 0;
  monitoring_type = 0;
  muted = false;
  name = '';
  prev_ver = 0;
  private_settings = {};
  settings = {
    custom_size: false,
    id_counter: 0,
    items: [],
  };
  sync = 0;
  volume = 1;

  /**
   *
   * @param {Source} source
   * @param {SceneCollection} collection
   */
  constructor(source, collection) {
    super(source);
    this.collection = collection;
  }

  clone() {
    var other = new Scene(this, collection);
    Object.assign(other.settings, this.settings);
    other.settings.items = this.settings.items.map((item) =>
      Object.assign({}, item)
    );
  }

  remove() {
    this.collection.removeSource(this);
  }

  /** @return {input is Scene} */
  static is(input) {
    if (!input) return false;
    return input.id === 'scene';
  }
}

class SceneTemplate extends Scene {
  baseName = '';
  rendition = 0;

  /**
   * @param {Source} source
   * @param {SceneCollection} collection
   */
  constructor(source, collection) {
    super(source, collection);

    const [_, baseName, rendition] = this.name.match(/(.*?)(\d+)$/);

    this.baseName = baseName;
    this.rendition = Number(rendition);
  }

  createInstances(count = 1) {
    for (let iSource = 1; iSource < count; iSource++) {
      const source = this.clone();
    }
  }

  removeInstances() {
    this.collection.sources.forEach((source) => {
      if (source.name === this.name) return;
      if (source.name.startsWith(this.baseName)) {
        this.collection.removeSource(source);
      }
    });
  }
}

class SceneCollection {
  current_program_scene = '';
  current_scene = '';
  current_transition = '';
  groups = [];
  modules = [];
  name = '';
  preview_locked = false;
  quick_transitions = [];
  saved_projectors = [];
  scaling_enabled = false;
  scaling_level = 0;
  scaling_off_x = 0.0;
  scaling_off_y = 0.0;
  /** @type {{name: string}[]} */
  scene_order = [];
  /** @type {Source[]} */
  sources = [];
  transition_duration = 300;
  transitions = [];

  constructor(json) {
    Object.assign(this, json);
  }

  get sceneTemplates() {
    /** @type {Map<string, SceneTemplate>} */
    const templates = new Map();

    this.sources.forEach((source) => {
      if (!Scene.is(source)) return;
      if (/\D\d+$/.test(source.name)) {
        const template = new SceneTemplate(source, this);
        const existing = templates.get(template.baseName);

        if (!existing || template.rendition < existing.rendition) {
          templates.set(template.baseName, template);
        }
      }
    });

    return templates.values();
  }

  /**
   * @param {Source} source
   */
  removeSource(source) {
    {
      const index = this.sources.findIndex(
        (other) => other.name === source.name
      );
      if (index >= 0) this.sources.splice(index, 1);
    }
    {
      const index = this.scene_order.findIndex(
        (other) => other.name === source.name
      );
      if (index >= 0) this.scene_order.splice(index, 1);
    }
  }
}

class SceneCollectionFactory {
  /**
   * @param {string} filePath
   */
  static fromFile(filePath) {
    return new SceneCollection(require(resolve(filePath)));
  }

  /**
   *
   * @param {string} filePath
   * @param {SceneCollection} collection
   */
  static toFile(filePath, collection) {
    writeFileSync(filePath, JSON.stringify(collection, null, '  '));
  }
}

const collection = SceneCollectionFactory.fromFile(FILE);

for (const template of collection.sceneTemplates) {
  console.log(template.baseName);
  template.removeInstances();
}

collection.name = 'Out';

SceneCollectionFactory.toFile(resolve(dirname(FILE), 'out.json'), collection);
