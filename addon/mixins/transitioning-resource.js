import { reject } from 'rsvp';
import { computed, get } from '@ember/object';
import { equal, alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Mixin from '@ember/object/mixin';
import { ucFirst, sortableNumericSuffix } from '@rancher/ember-shared/utils/string';
import { addQueryParams } from '@rancher/ember-shared/utils/url';

function terminatedIcon(inst) {
  if ( get(inst, 'exitCode') === 0 ) {
    return 'icon icon-dot-circlefill';
  } else {
    return 'icon icon-circle';
  }
}

function terminatedColor(inst) {
  if ( get(inst, 'exitCode') === 0 ) {
    return 'text-success';
  } else {
    return 'text-error';
  }
}

const defaultStateMap = { /* eslint-disable object-property-newline */
  'active':        { icon: 'icon icon-dot-open', color: 'text-success'  },
  'deactivating':  { icon: 'icon icon-dot-half icon-rotate-180', color: 'text-info'     },
  'not-ready':     { icon: 'icon icon-dot-half', color: 'text-info'     },
  'error':         { icon: 'icon icon-error',    color: 'text-error'    },
  'inactive':      { icon: 'icon icon-dot',      color: 'text-error'    },
  'terminated':    { icon: terminatedIcon,       color: terminatedColor },
};

const stateColorSortMap = {
  'error':   1,
  'warning': 2,
  'info':    3,
  'success': 4,
  'other':   5,
};

export default Mixin.create({
  intl:        service(),
  session:     service(),

  modalService: service('modal'),
  reservedKeys: ['waitInterval', 'waitTimeout'],

  state:                 null,
  transitioning:         null,
  transitioningMessage:  null,
  transitioningProgress: null,

  availableActions: computed(() => {
    /*
      For custom actions not in _availableActions below, Override me and return [
        {
          enabled: true/false,    // Whether it's shown or not.  Anything other than exactly false will be shown.
          bulkable: true/false,   // If true, the action is shown in bulk actions on sortable-tables
          single: true/false,     // If exactly false, the action is not shown on individual resource actions (with bulkable=true for a bulk-only action)
          label: 'Delete',        // Label shown on hover or in menu
          icon: 'icon icon-trash',// Icon shown on screen
          action: 'promptDelete', // Action to call on the controller when clicked
          altAction: 'delete'     // Action to call on the controller when alt+clicked
          divider: true,          // Just this will make a divider
        },
        ...
      ]
    */
    return [];
  }),

  _availableActions: computed('availableActions.[]', 'links.{self,yaml}', 'canEditYaml', 'canEdit', 'canDelete', function() {
    const out = get(this, 'availableActions').slice();

    let nextSort = 1;

    out.forEach((entry) => {
      if ( !entry.sort ) {
        entry.sort = nextSort++;
      }
    });

    const l = get(this, 'links');

    out.push({
      sort:    -100,
      label:   'action.edit',
      icon:    'icon icon-edit',
      action:  'edit',
      enabled: get(this, 'canEdit'),
    });

    out.push({
      sort:    -90,
      label:   'action.clone',
      action:  'clone',
      icon:    'icon icon-copy',
      enabled: get(this, 'canClone'),
    });

    // Normal actions go here in the sort order

    out.push({
      sort:    60,
      divider: true
    });

    out.push({
      sort:    70,
      label:   'action.editYaml',
      icon:    'icon icon-edit',
      action:  'editYaml',
      enabled: get(this, 'canEditYaml'),
    });

    out.push({
      sort:    80,
      label:   'action.viewInApi',
      icon:    'icon icon-external-link',
      action:  'goToApi',
      enabled: !!l.self
    });

    out.push({
      sort:    90,
      divider: true
    });

    out.push({
      sort:      100,
      label:     'action.delete',
      icon:      'icon icon-trash',
      action:    'promptDelete',
      altAction: 'delete',
      bulkable:  true,
      enabled:   get(this, 'canDelete'),
    });

    return out.sortBy('sort');
  }),

  canClone: computed('actions.clone', function() {
    return !!get(this, 'actions.clone');
  }),

  canEditYaml: computed('links.update', 'actions.editYaml', function() {
    return !!get(this, 'links.update') && !!get(this, 'actions.editYaml');
  }),

  canEdit: computed('links.update', 'actions.edit', function() {
    return !!get(this, 'links.update') && !!get(this, 'actions.edit');
  }),

  canBulkDelete: alias('canDelete'),

  canDelete: computed('links.remove', function() {
    return !!get(this, 'links.remove') && !get(this, 'state') !== 'removed';
  }),

  actions: {
    promptDelete() {
      get(this, 'modalService').toggleModal('confirm-delete', {
        escToClose: true,
        resources:  [this]
      });
    },

    delete() {
      return this.delete();
    },

    goToApi() {
      const url = get(this, 'links.self');

      if ( url ) {
        window.open(url, '_blank');
      }
    },
  },

  displayName: computed('name', 'id', function() {
    return get(this, 'name') || `(${ get(this, 'id') })`;
  }),

  sortName: computed('displayName', function() {
    return sortableNumericSuffix(get(this, 'displayName').toLowerCase());
  }),

  isTransitioning: equal('transitioning', 'yes'),
  isError:         equal('transitioning', 'error'),
  isActive:        equal('state', 'active'),

  // You can override the state by providing your own relevantState and maybe reading from _relevantState
  relevantState: alias('_relevantState'),
  _relevantState: computed('state', function() {
    return get(this, 'state') || 'unknown';
  }),

  // You can override the displayed state by providing your own displayState and maybe reading from _displayState
  displayState:  alias('_displayState'),
  _displayState: computed('relevantState', 'intl.locale', function() {
    const state = get(this, 'relevantState') || 'unknown';
    const intl = get(this, 'intl');
    const key = `resourceState.${ state.toLowerCase() }`;

    if ( intl.exists(key) ) {
      return intl.t(key);
    }

    return state.split(/-/).map(ucFirst).join('-');
  }),

  showTransitioningMessage: computed('transitioning', 'transitioningMessage', 'displayState', function() {
    var trans = get(this, 'transitioning');

    if (trans === 'yes' || trans === 'error') {
      let message = (get(this, 'transitioningMessage') || '');

      // If the message is the same as the state, don't show it because that's dumb.
      if ( message.length && message.toLowerCase() !== get(this, 'displayState').toLowerCase() ) {
        return true;
      }
    }

    return false;
  }),

  stateIcon: computed('relevantState', 'transitioning', function() {
    var trans = get(this, 'transitioning');
    var icon = '';

    if ( trans === 'yes' ) {
      icon = 'icon icon-spinner icon-spin';
    } else if ( trans === 'error' ) {
      icon = 'icon icon-alert';
    } else {
      var map = this.constructor.stateMap;
      var key = (get(this, 'relevantState') || '').toLowerCase();

      if ( map && map[key] && map[key].icon !== undefined) {
        icon = this.maybeFn(map[key].icon);
      }

      if ( !icon && defaultStateMap[key] && defaultStateMap[key].icon ) {
        icon = this.maybeFn(defaultStateMap[key].icon);
      }

      if ( !icon ) {
        icon = this.constructor.defaultStateIcon;
      }

      if ( !icon.includes('icon ') ) {
        icon = `icon ${  icon }`;
      }
    }

    return icon;
  }),

  stateColor: computed('relevantState', 'isError', function() {
    if ( get(this, 'isError') ) {
      return 'text-error';
    }

    var map = this.constructor.stateMap;
    var key = (get(this, 'relevantState') || '').toLowerCase();

    if ( map && map[key] && map[key].color !== undefined ) {
      return this.maybeFn(map[key].color);
    }

    if ( defaultStateMap[key] && defaultStateMap[key].color ) {
      return this.maybeFn(defaultStateMap[key].color);
    }

    return this.constructor.defaultStateColor;
  }),

  sortState: computed('stateColor', 'relevantState', function() {
    var color = get(this, 'stateColor').replace('text-', '');

    return `${ stateColorSortMap[color] || stateColorSortMap['other']  } ${  get(this, 'relevantState') }`;
  }),

  stateBackground: computed('stateColor', function() {
    return get(this, 'stateColor').replace('text-', 'bg-');
  }),

  maybeFn(val) {
    if ( typeof val === 'function' ) {
      return val(this);
    } else {
      return val;
    }
  },

  cloneForNew() {
    var copy = this.clone();

    delete copy.actionLinks;
    delete copy.id;
    delete copy.links;
    delete copy.name;
    delete copy.uuid;

    return copy;
  },

  serializeForNew() {
    var copy = this.serialize();

    delete copy.id;
    delete copy.actionLinks;
    delete copy.links;
    delete copy.uuid;

    return copy;
  },

  // Show growls for errors on actions
  delete(/* arguments*/) {
    const promise = this._super(...arguments);

    return promise.catch((err) => {
      get(this, 'growl').fromError('Error deleting', err);
    });
  },

  doAction(name, data, opt) {
    opt = opt || {};

    const promise = this._super(...arguments);

    if ( opt.catchGrowl === false ) {
      return promise;
    } else {
      return promise.catch((err) => {
        get(this, 'growl').fromError(`${ ucFirst(name)  } Error`, err);

        return reject(err);
      });
    }
  },

  fetchYaml() {
    return this.request({
      url:     addQueryParams(this.linkFor('self'), { '_edit': true }),
      headers: { 'Accept': 'application/yaml' },
    });
  },

  putYaml(yaml) {
    const url = addQueryParams(this.linkFor('self'), {
      '_edited':  true,
      '_replace': true,
    });

    return this.request({
      method:  'PUT',
      url,
      headers: { 'Content-Type': 'application/yaml' },
      body:    yaml
    });
  },

  // You really shouldn't have to use any of these.
  // Needing these is a sign that the API is bad and should feel bad.
  // Yet here they are, nonetheless.
  /*
  waitInterval: 1000,
  waitTimeout:  30000,
  _waitForTestFn(testFn, msg) {
    return new EmberPromise((resolve, reject) => {
      // Do a first check immediately
      if ( testFn.apply(this) ) {
        resolve(this);

        return;
      }

      var timeout = setTimeout(() =>  {
        clearInterval(interval);
        clearTimeout(timeout);
        reject(`Failed while: ${ msg }`);
      }, get(this, 'waitTimeout'));

      var interval = setInterval(() => {
        if ( testFn.apply(this) ) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(this);
        }
      }, get(this, 'waitInterval'));
    }, msg || 'Wait for it...');
  },

  waitForState(state) {
    return this._waitForTestFn(function() {
      return get(this, 'state') === state;
    }, `Wait for state=${ state }`);
  },

  waitForTransition() {
    return this._waitForTestFn(function() {
      return get(this, 'transitioning') !== 'yes';
    }, 'Wait for transition');
  },

  waitForAction(name) {
    return this._waitForTestFn(function() {
      // console.log('waitForAction('+name+'):', this.hasAction(name));
      return this.hasAction(name);
    }, `Wait for action=${ name }`);
  },
  */
});
