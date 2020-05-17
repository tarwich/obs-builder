const { Source } = require('./source');

class Swatch extends Source {
  id = 'color_source';
  name = '';
  versioned_id = 'color_source_v2';
  settings = {
    color: 0,
    height: 100,
    width: 100,
  };
  
  constructor({ name = '', color = 0 }) {
    super();

    if (color) this.settings.color = color;
    if (name) this.name = name;
  }
}

module.exports = { Swatch };
