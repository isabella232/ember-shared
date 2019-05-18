import { get, set } from '@ember/object';
import Service from '@ember/service';
import { computed } from '@ember/object';

export default Service.extend({
  model:          null,
  open:           false,
  tooltipActions: null,
  actionToggle:   null,
  actionMenu:     null,
  actionContext:  null,

  setActionItems(model, context) {
    set(this, 'model', model);
    set(this, 'context', context);
  },

  triggerAction(actionName) {
    const model = get(this, 'model');
    const context = get(this, 'context');

    if ( model && model.send && model.actions && model.actions[actionName] ) {
      model.send(actionName, context);
    } else if ( context && context.send && context.actions && context.actions[actionName] ) {
      context.send(actionName, model);
    } else {
      x = new Error(`Unknown action: ${ actionName }`);
      x.model = model;
      x.context = context;
      throw x;
    }
  },

  activeActions: computed('model._availableActions.@each.{enabled,single,divider}', function() {
    let list = (get(this, 'model._availableActions') || []).filter((act) => {
      if ( get(act, 'single') === false || get(act, 'enabled') === false ) {
        return false;
      }

      return true;
    });

    // Remove dividers at the beginning
    while ( list.get('firstObject.divider') === true ) {
      list.shiftObject();
    }

    // Remove dividers at the end
    while ( list.get('lastObject.divider') === true ) {
      list.popObject();
    }

    // Remove consecutive dividers
    let last = null;

    list = list.filter((act) => {
      let cur = (act.divider === true);
      let ok = !cur || (cur && !last);

      last = cur;

      return ok;
    });

    return list;
  }),
});
