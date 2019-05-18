import { or, alias } from '@ember/object/computed';
import Component from '@ember/component';
import {
  defineProperty,
  get,
  set,
  computed,
  observer
} from '@ember/object';
import { inject as service } from '@ember/service'
import { isArray } from '@ember/array';
import { run } from '@ember/runloop';
import $ from 'jquery';

import Sortable from '@rancher/ember-shared/mixins/sortable-base';
import StickyHeader from '@rancher/ember-shared/mixins/sticky-table-header';
import layout from './template';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import { isAlternate, isMore, isRange } from '@rancher/ember-shared/utils/platform';
import { PREF } from '@rancher/ember-shared/utils/constants';

export default Component.extend(Sortable, StickyHeader, {
  prefs:             service(),
  intl:              service(),
  bulkActionHandler: service(),

  layout,
  body:                 null,
  groupByKey:           null,
  groupByRef:           null,
  preSorts:             null,
  sortBy:               null,
  descending:           false,
  headers:              null,
  extraSearchFields:    null,
  extraSearchSubFields: null,
  prefix:               false,
  suffix:               false,
  bulkActions:          true,
  rowActions:           true,
  search:               true,
  searchToWormhole:     null,
  paging:               true,
  subRows:              false,
  checkWidth:           40,
  actionsWidth:         40,
  tableClassNames:      null,
  sortBaseIcon:         'icon-sort',
  sortDownIcon:         'icon-sort-down',
  sortUpIcon:           'icon-sort-up',
  idField:              'id',

  availableActions:     null,
  selectedNodes:        null,
  prevNode:             null,
  searchText:           null,
  page:                 1,
  pagingLabel:          'pagination.generic',

  showActionsRow:       or('bulkActions', 'searchInPlace'),

  // -----
  sortableContent:     alias('body'),
  init() {
    this._super(...arguments);

    set(this, 'selectedNodes', []);
    if (get(this, 'bulkActions')) {
      this.actionsChanged();
    }

    if ( !get(this, 'fastboot.isFastBoot') && get(this, 'bulkActions') ) {
      run.schedule('afterRender', () => {
        let table = $(this.element).find('> TABLE');
        let self = this; // need this context in click function and can't use arrow func there

        table.on('click', '> TBODY > TR', (e) => {
          self.rowClick(e);
        });

        table.on('mousedown', '> TBODY > TR', (e) => {
          if ( isRange(e) || e.target.tagName === 'INPUT') {
            e.preventDefault();
          }
        });
      });
    }

    let watchKey = 'pagedContent.[]';

    if ( get(this, 'groupByKey') ) {
      watchKey = `pagedContent.@each.${ get(this, 'groupByKey').replace(/\..*/g, '') }`;
    }

    let idField = get(this, 'idField');

    defineProperty(this, 'groupedContent', computed(watchKey, () => {
      let ary = [];
      let map = {};

      let groupKey = get(this, 'groupByKey');
      let refKey = get(this, 'groupByRef');

      get(this, 'pagedContent').forEach((obj) => {
        let group = get(obj, groupKey) || '';
        let ref = get(obj, refKey) || { displayName: group };
        let entry = map[group];

        if ( entry ) {
          entry.items.push(obj);
        } else {
          entry = {
            group,
            ref,
            items: [obj]
          };
          map[group] = entry;
          ary.push(entry);
        }

        if ( get(this, 'selectedNodes').includes(obj) ) {
          run.next(this, () => {
            toggleInput(obj, true, idField);
          });
        }
      });

      return ary;
    }));
  },

  actions: {
    clearSearch() {
      set(this, 'searchText', '');
    },

    executeBulkAction(name, e) {
      e.preventDefault();
      let handler = get(this, 'bulkActionHandler');
      let nodes = get(this, 'selectedNodes');

      if (isAlternate(e)) {
        var available = get(this, 'availableActions');
        var action = available.findBy('action', name);
        let alt = get(action, 'altAction');

        if ( alt ) {
          name = alt;
        }
      }

      if ( typeof handler[name] === 'function' ) {
        get(this, 'bulkActionHandler')[name](nodes);
      } else {
        nodes.forEach((node) => {
          node.send(name);
        });
      }
    },

    executeAction(action) {
      var node = get(this, 'selectedNodes')[0];

      node.send(action);
    },
  },

  // Pick a new sort if the current column disappears.
  headersChanged: observer('headers.@each.name', function() {
    let sortBy = get(this, 'sortBy');
    let headers = get(this, 'headers') || [];

    if ( headers && get(headers, 'length') ) {
      let cur = headers.findBy('name', sortBy);

      if ( !cur ) {
        run.next(this, function() {
          this.send('changeSort', get(headers, 'firstObject.name'));
        });
      }
    }
  }),

  pagedContentChanged: observer('pagedContent.[]', function() {
    this.cleanupOrphans();
  }),

  pageCountChanged: observer('indexFrom', 'filtered.length', function() {
    // Go to the last page if we end up past the last page
    let from = get(this, 'indexFrom');
    let last = get(this, 'filtered.length');
    var perPage = get(this, 'perPage');

    if ( get(this, 'page') > 1 && from > last) {
      let page = Math.ceil(last / perPage);

      set(this, 'page', page);
    }
  }),

  sortKeyChanged: observer('sortBy', function() {
    set(this, 'page', 1);
  }),

  actionsChanged: observer('selectedNodes.@each._availableActions', 'pagedContent.@each._availableActions', function() {
    if (!get(this, 'bulkActions')) {
      return;
    }

    let nodes = get(this, 'selectedNodes');
    let disableAll = false;

    if ( !nodes.length ) {
      disableAll = true;
      let firstNode = get(this, 'pagedContent.firstObject');

      if ( firstNode ) {
        nodes = [firstNode];
      }
    }

    const map = {};

    get(this, 'pagedContent').forEach((node) => {
      ( get(node, '_availableActions') || []).forEach((act) => {
        if ( !act.bulkable ) {
          return;
        }

        let obj = map[act.action];

        if ( !obj ) {
          obj = Object.assign({}, act);
          map[act.action] = obj;
        }

        if ( act.enabled !== false ) {
          obj.anyEnabled = true;
        }
      });
    });

    nodes.forEach((node) => {
      ( get(node, '_availableActions') || []).forEach((act) => {
        if ( !act.bulkable ) {
          return;
        }

        let obj = map[act.action];

        if ( !obj ) {
          obj = Object.assign({}, act);
          map[act.action] = obj;
        }

        obj.available = (obj.available || 0) + (act.enabled === false ? 0 : 1 );
        obj.total = (obj.total || 0) + 1;
      })
    });

    let out = Object.values(map).filterBy('anyEnabled', true);

    if ( disableAll ) {
      out.forEach((x) => {
        set(x, 'enabled', false);
      });
    } else {
      out.forEach((x) => {
        if ( x.available < x.total ) {
          set(x, 'enabled', false);
        } else {
          set(x, 'enabled', true);
        }
      });
    }

    set(this, 'availableActions', out);
  }),

  _tableClasssNames: computed('internalBulkActions', 'subRows', 'tableClassNames', function(){
    const out = ['fixed', 'sortable-table'];

    if ( get(this, 'internalBulkActions') ) {
      out.push('has-actions');
    }

    if ( get(this, 'subRows') ) {
      out.push('has-sub-rows');
    }

    return `${ out.join(' ') } ${ get(this, 'tableClassNames') || '' }`.trim();
  }),

  searchInPlace: computed('search', 'searchToWormhole', function() {
    return get(this, 'search') && !get(this, 'searchToWormhole');
  }),

  perPage: computed('paging', `prefs.${ PREF.TABLE_ROWS_PER_PAGE }`, function() {
    if ( get(this, 'paging') ) {
      return get(this, `prefs.${ PREF.TABLE_ROWS_PER_PAGE }`);
    } else {
      return 100000;
    }
  }),

  // hide bulkActions if content is empty.
  internalBulkActions: function(){
    let bulkActions = get(this, 'bulkActions');

    if (bulkActions && get(this, 'sortableContent')){
      let sortableContent = get(this, 'sortableContent');

      return !!get(sortableContent, 'length');
    } else {
      return false;
    }
  }.property('bulkActions', 'sortableContent.[]'),

  // Flow: body [-> sortableContent] -> arranged -> filtered -> pagedContent [-> groupedContent]
  pagedContent: pagedArray('filtered', {
    page:    alias('parent.page'),
    perPage: alias('parent.perPage')
  }),

  // For data-title properties on <td>s
  dt: computed('headers.@each.{name,label,translationKey}', 'intl.locale', function() {
    let intl = get(this, 'intl');
    let out = {
      check:   `${ intl.t('generic.select')  }: `,
      actions: `${ intl.t('generic.actions')  }: `,
    };

    get(this, 'headers').forEach((header) => {
      let name = get(header, 'name');
      let dtKey = get(header, 'dtTranslationKey');
      let key = get(header, 'translationKey');

      if ( dtKey ) {
        out[name] = `${ intl.t(dtKey)  }: `;
      } else if ( key ) {
        out[name] = `${ intl.t(key)  }: `;
      } else {
        out[name] = `${ get(header, 'label') || name  }: `;
      }
    });

    return out;
  }),

  // Table content
  fullColspan: computed('headers.length', 'internalBulkActions', 'rowActions', function() {
    return (get(this, 'headers.length') || 0) + (get(this, 'internalBulkActions') ? 1 : 0 ) + (get(this, 'rowActions') ? 1 : 0);
  }),

  // -----
  searchFields: computed('headers.@each.{searchField,name}', 'extraSearchFields.[]', function() {
    let out = headersToSearchField(get(this, 'headers'));

    return out.addObjects(get(this, 'extraSearchFields') || []);
  }),

  subFields: computed('subHeaders.@each.{searchField,name}', 'extraSearchSubFields.[]', function() {
    let out = headersToSearchField(get(this, 'subHeaders'));

    return out.addObjects(get(this, 'extraSearchSubFields') || []);
  }),

  filtered: computed('arranged.[]', 'searchText', function() {
    let out = get(this, 'arranged').slice();
    let searchFields = get(this, 'searchFields');
    let searchText =  (get(this, 'searchText') || '').trim().toLowerCase();
    let subSearchField = get(this, 'subSearchField');
    let subFields = get(this, 'subFields');
    let subMatches = null;
    let idField = get(this, 'idField');

    if ( searchText.length ) {
      subMatches = {};
      let searchTokens = searchText.split(/\s*[, ]\s*/);

      for ( let i = out.length - 1 ; i >= 0 ; i-- ) {
        let hits = 0;
        let row = out[i];
        let mainFound = true;

        for ( let j = 0 ; j < searchTokens.length ; j++ ) {
          let expect = true;
          let token = searchTokens[j];

          if ( token.substr(0, 1) === '!' ) {
            expect = false;
            token = token.substr(1);
          }

          if ( token && matches(searchFields, token, row) !== expect ) {
            mainFound = false;
            break;
          }
        }

        if ( subFields && subSearchField) {
          let subRows = (get(row, subSearchField) || []);

          for ( let k = subRows.length - 1 ; k >= 0 ; k-- ) {
            let subFound = true;

            for ( let l = 0 ; l < searchTokens.length ; l++ ) {
              let expect = true;
              let token = searchTokens[l];

              if ( token.substr(0, 1) === '!' ) {
                expect = false;
                token = token.substr(1);
              }

              if ( matches(subFields, token, subRows[k]) !== expect ) {
                subFound = false;
                break;
              }
            }

            if ( subFound ) {
              hits++;
            }
          }

          subMatches[get(row, idField)] = hits;
        }

        if ( !mainFound && hits === 0 ) {
          out.removeAt(i);
        }
      }
    }

    set(this, 'subMatches', subMatches);

    return out;
  }),

  indexFrom: computed('page', 'perPage', function() {
    var current =  get(this, 'page');
    var perPage =  get(this, 'perPage');

    return Math.max(0, 1 + perPage * (current - 1));
  }),

  indexTo: computed('indexFrom', 'perPage', 'filtered.length', function() {
    return Math.min(get(this, 'filtered.length'), get(this, 'indexFrom') + get(this, 'perPage') - 1);
  }),

  isAll: computed('selectedNodes.length', 'pagedContent.length', {
    get() {
      return get(this, 'selectedNodes.length') === get(this, 'pagedContent.length');
    },

    set(key, value) {
      var content = get(this, 'pagedContent');

      if ( value ) {
        this.toggleMulti(content, []);

        return true;
      } else {
        this.toggleMulti([], content);

        return false;
      }
    }
  }),

  cleanupOrphans() {
    // Remove selected items not in the current content
    let content = get(this, 'pagedContent');
    let nodesToAdd = [];
    let nodesToRemove = [];

    get(this, 'selectedNodes').forEach((node) => {
      if ( content.includes(node) ) {
        nodesToAdd.push(node);
      } else {
        nodesToRemove.push(node);
      }
    });

    this.toggleMulti(nodesToAdd, nodesToRemove);
  },

  // ------
  // Clicking
  // ------
  rowClick(e) {
    let tagName = e.target.tagName;
    let tgt = $(e.target);

    if ( tagName === 'A'  || tagName === 'BUTTON' || tgt.parents('.btn').length || typeof tgt.data('ember-action') !== 'undefined' || tgt.hasClass('copy-btn') ) {
      return;
    }

    let content = get(this, 'pagedContent');
    let selection = get(this, 'selectedNodes');
    let isCheckbox = tagName === 'INPUT' || tgt.hasClass('row-check');
    let tgtRow = $(e.currentTarget);

    if ( tgtRow.hasClass('separator-row') || tgt.hasClass('select-all-check')) {
      return;
    }

    while ( tgtRow && tgtRow.length && !tgtRow.hasClass('main-row') ) {
      tgtRow = tgtRow.prev();
    }

    if ( !tgtRow || !tgtRow.length ) {
      return;
    }

    let nodeId = tgtRow.find('input[type="checkbox"]').attr('nodeid');

    if ( !nodeId ) {
      return;
    }

    let node = content.findBy(get(this, 'idField'), nodeId);

    if ( !node ) {
      return;
    }

    let isSelected = selection.includes(node);
    let prevNode = get(this, 'prevNode');

    // PrevNode is only valid if it's in the current content
    if ( !prevNode || !content.includes(prevNode) ) {
      prevNode = node;
    }

    if ( isMore(e) ) {
      this.toggleSingle(node);
    } else if ( isRange(e) ) {
      let toToggle = this.nodesBetween(prevNode, node);

      if ( isSelected ) {
        this.toggleMulti([], toToggle);
      } else {
        this.toggleMulti(toToggle, []);
      }
    } else if ( isCheckbox ) {
      this.toggleSingle(node);
    } else {
      this.toggleMulti([node], content);
    }

    set(this, 'prevNode', node);
  },

  nodesBetween(a, b) {
    let toToggle = [];
    let key = get(this, 'groupByKey');

    if ( key ) {
      // Grouped has 2 levels to look through
      let grouped = get(this, 'groupedContent');

      let from = this.groupIdx(a);
      let to =  this.groupIdx(b);

      if ( !from || !to ) {
        return [];
      }

      // From has to come before To
      if ( (from.group > to.group) || ((from.group === to.group) && (from.item > to.item)) ) {
        [from, to] = [to, from];
      }

      for ( let i = from.group ; i <= to.group ; i++ ) {
        let items = grouped.objectAt(i).items;
        let j = (from.group === i ? from.item : 0);

        while ( items[j] && ( i < to.group || j <= to.item )) {
          toToggle.push(items[j]);
          j++;
        }
      }
    } else {
      // Ungrouped is much simpler
      let content = get(this, 'pagedContent');
      let from = content.indexOf(a);
      let to = content.indexOf(b);

      [from, to] = [Math.min(from, to), Math.max(from, to)];
      toToggle = content.slice(from, to + 1);
    }

    return toToggle;
  },

  groupIdx(node) {
    let grouped = get(this, 'groupedContent');

    for ( let i = 0 ; i < get(grouped, 'length') ; i++ ) {
      let items = grouped.objectAt(i).items;

      for ( let j = 0 ; j < get(items, 'length') ; j++ ) {
        if ( items.objectAt(j) === node ) {
          return {
            group: i,
            item:  j
          };
        }
      }
    }

    return null;
  },

  toggleSingle(node) {
    let selectedNodes = get(this, 'selectedNodes');

    if ( selectedNodes.includes(node) ) {
      this.toggleMulti([], [node]);
    } else {
      this.toggleMulti([node], []);
    }
  },

  toggleMulti(nodesToAdd, nodesToRemove) {
    let selectedNodes = get(this, 'selectedNodes');
    let idField = get(this, 'idField');

    if (nodesToRemove.length) {
      // removeObjects doesn't use ArrayProxy-safe looping
      if ( typeof nodesToRemove.toArray === 'function' ) {
        nodesToRemove = nodesToRemove.toArray();
      }
      selectedNodes.removeObjects(nodesToRemove);
      toggle(nodesToRemove, false);
    }

    if (nodesToAdd.length) {
      selectedNodes.addObjects(nodesToAdd);
      toggle(nodesToAdd, true);
    }

    function toggle(nodes, on) {
      run.next(() => {
        nodes.forEach((node) => {
          toggleInput(node, on, idField);
        });
      });
    }
  },
});

function headersToSearchField(headers) {
  let out = [];

  (headers || []).forEach((header) => {
    let field = get(header, 'searchField');

    if ( field ) {
      if ( typeof field === 'string' ) {
        out.addObject(field);
      } else if ( isArray(field) ) {
        out.addObjects(field);
      }
    } else if ( field === false ) {
      // Don't add the name
    } else {
      out.addObject(get(header, 'name'));
    }
  });

  return out.filter((x) => !!x);
}

function toggleInput(node, on, idField) {
  let id = get(node, idField);

  if ( id ) {
    let input = $(`input[nodeid="${ id }"]`);

    if ( input && input.length ) {
      // can't reuse the input ref here because the table has rerenderd and the ref is no longer good
      $(`input[nodeid="${ id }"]`).prop('checked', on);

      let tr    = $(`input[nodeid="${ id }"]`).closest('tr');
      let first = true;

      while ( tr && (first || tr.hasClass('sub-row') ) ) {
        tr.toggleClass('row-selected', on);
        tr    = tr.next();
        first = false;
      }
    }
  }
}

export function matches(fields, token, item) {
  let tokenMayBeIp = /^[0-9a-f\.:]+$/i.test(token);

  for ( let i = 0 ; i < fields.length ; i++ ) {
    let field = fields[i];

    if ( field ) {
      // Modifiers:
      //  id: The token must match id format (i.e. 1i123)
      let idx = field.indexOf(':');
      let modifier = null;

      if ( idx > 0 ) {
        modifier = field.substr(idx + 1);
        field = field.substr(0, idx);
      }

      let val = get(item, field);

      if ( val === undefined ) {
        continue;
      }

      val = (`${ val }`).toLowerCase();
      if ( !val ) {
        continue;
      }

      switch ( modifier ) {
      case 'exact':
        if ( val === token ) {
          return true;
        }
        break;

      case 'ip':
        if ( tokenMayBeIp ) {
          let re = new RegExp(`(?:^|\.)${  token  }(?:\.|$)`);

          if ( re.test(val) ) {
            return true;
          }
        }
        break;

      case 'prefix':
        if ( val.indexOf(token) === 0) {
          return true;
        }
        break;

      default:
        if ( val.indexOf(token) >= 0) {
          return true;
        }
      }
    }
  }

  return false;
}

