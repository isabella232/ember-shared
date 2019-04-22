'use strict';

const Funnel = require('broccoli-funnel');

module.exports = {
  name: require('./package').name,

  treeForStyles() {
    return new Funnel(__dirname+"/addon/styles", {
      destDir: 'ember-shared'
    });
  }
};
