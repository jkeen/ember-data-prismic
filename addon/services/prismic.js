import Service from '@ember/service';
import Prismic from 'prismic-javascript';
import { getOwner } from '@ember/application';
import { inject as service } from "@ember/service";
import config from "ember-get-config";

export default Service.extend({
  router: service(),
  getApi() {
    const config = getOwner(this).resolveRegistration('config:environment');
    const apiEndpoint = config.prismic.apiEndpoint;
    const options = { accessToken: config.prismic.accessToken };
    return Prismic.getApi(apiEndpoint, options);
  },

  urlFor(doc) {
    let url
    try {
      url = this.router.urlFor(doc.type, doc.uid);
    }
    catch(e) {
      console.error(e); // eslint-disable-line
      if (config.environment !== 'production') {
        console.warn('you might want to extend #urlFor in the parent app\'s prismic service'); // eslint-disable-line
      }

      url = "";
    }

    return url;
  }
});
