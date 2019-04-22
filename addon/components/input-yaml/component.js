import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { get, set, computed } from '@ember/object';
import { Promise as EmberPromise, all } from 'rsvp';
import layout from './template';
import jsyaml from 'js-yaml';

import { isSafari } from '@rancher/ember-shared/utils/platform';
import ThrottledResize from '@rancher/ember-shared/mixins/throttled-resize';
import { downloadFile } from '@rancher/ember-shared/utils/download';
import { PREF } from '@rancher/ember-shared/utils/constants';

export default Component.extend(ThrottledResize, {
  growl: service(),
  theme: service(),
  prefs: service(),

  layout,
  classNames: ['input-yaml'],

  downloadClasses:  'btn bg-link icon-btn',
  copyClasses:      'bg-link',
  uploadClasses:    'btn bg-link icon-btn',

  name:             null,
  value:            null,
  placeholder:      '',
  fileChosen:       null,

  showCopy:         true,
  showDownload:     true,
  showUpload:       true,
  accept:           'text/*, .yml, .yaml',
  multiple:         false,

  autoResize:       false,
  footerSpace:      100,
  minHeight:        50,

  init() {
    this._super(...arguments);

    if ( typeof window.jsyaml === 'undefined' ) {
      window.jsyaml = jsyaml;
    }
  },

  actions: {
    upload() {
      this.$('INPUT[type=file]')[0].click();
    },

    download() {
      let yaml = get(this, 'value');

      downloadFile(get(this, 'name') || 'download.yaml', yaml);
    },
  },

  actualAccept: computed('accept', function() {
    if ( isSafari ) {
      return '';
    } else {
      return get(this, 'accept');
    }
  }),

  codeMirrorHash: computed('theme.current', `prefs.${ PREF.EDITOR_KEYMAP }`, 'codeMirrorOptions', function() {
    let out = Object.assign({
      autofocus:      true,
      theme:          `base16-${ get(this, 'theme.current') }`,
      tabSize:        2,
      lineNumbers:    true,
      mode:           'yaml',
      readOnly:       false,
      gutters:        ['CodeMirror-lint-markers'],
      lint:           true,
      lineWrapping:   true,
      viewportMargin: Infinity,
    }, get(this, 'codeMirrorOptions') || {});

    return out;
  }),

  onResize() {
    if ( get(this, 'autoResize') ) {
      this.fit();
    }
  },

  fit() {
    if ( get(this, 'autoResize') ) {
      var container = this.$('.codemirror-container');

      if ( !container || !container.length ) {
        return;
      }

      const offset = container.offset();

      if ( !offset ) {
        return;
      }

      const desired = this.$(window).height() - offset.top - get(this, 'footerSpace');

      container.css('height', Math.max(get(this, 'minHeight'), desired));
    }
  },

  change(event) {
    var input = event.target;

    if ( !input.files || !input.files.length ) {
      return;
    }

    const promises = [];
    let file;

    for ( let i = 0 ; i < input.files.length ; i++ ) {
      file = input.files[i];
      promises.push(new EmberPromise((resolve, reject) => {
        var reader = new FileReader();

        reader.onload = (res) => {
          var out = res.target.result;

          resolve(out);
        };

        reader.onerror = (err) => {
          get(this, 'growl').fromError(get(err, 'srcElement.error.message'));
          reject(err);
        };

        reader.readAsText(file);
      }));
    }

    all(promises).then((res) => {
      if ( this.isDestroyed || this.isDestroying ) {
        return;
      }

      let value = res.join('\n---\n');

      set(this, 'value', value);
      if ( value && this.fileChosen ) {
        this.fileChosen();
      }
    }).finally(() => {
      input.value = '';
    });
  },

});
