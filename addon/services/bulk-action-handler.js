import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  modal: service(),

  promptDelete(nodes) {
    get(this, 'modal').show('confirm-delete', { resources: nodes });
  },
});
