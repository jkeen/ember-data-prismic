import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    return this.store.findRecord('post', params.post_id);
  },

  afterModel(model /*, transition */) {
    this.transitionTo('post', model.get('uid'));
  }
});
