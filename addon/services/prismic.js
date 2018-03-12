import Service from '@ember/service';
import Prismic from 'prismic-javascript';
import { getOwner } from '@ember/application';

export default Service.extend({
  getApi() {
    const config = getOwner(this).resolveRegistration('config:environment');
    const apiEndpoint = config.prismic.apiEndpoint;
    const options = { accessToken: config.prismic.accessToken };
    return Prismic.getApi(apiEndpoint, options);
  }
});
