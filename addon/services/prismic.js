import Ember from 'ember';
import Service from '@ember/service';
import Prismic from 'prismic-javascript';

export default Service.extend({
  getApi() {
    const config = Ember.getOwner(this).resolveRegistration('config:environment');
    const apiEndpoint = config.prismic.apiEndpoint;
    const options = { accessToken: config.prismic.accessToken };
    return Prismic.getApi(apiEndpoint, options);
  }
});
