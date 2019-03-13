export const EXPAND = {
  name:        'expand',
  sort:        false,
  searchField: null,
  width:       30
};

export const STATE = {
  name:           'state',
  sort:           ['sortState', 'sortName', 'id'],
  searchField:    'displayState',
  translationKey: 'generic.state',
  width:          120
};

export const NAME = {
  name:           'name',
  sort:           ['sortName', 'id'],
  searchField:    'displayName',
  translationKey: 'generic.name',
};

export const STACK = {
  name:           'stack',
  sort:           ['stack.sortName', 'sortName', 'id'],
  searchField:    'stack.displayName',
  translationKey: 'generic.stack',
};

export const CREATED = {
  name:           'created',
  sort:           ['createdTs', 'id'],
  searchField:    'created',
  translationKey: 'generic.created',
  width:          120,
};
