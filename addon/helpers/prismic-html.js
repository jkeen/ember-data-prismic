import Helper from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import { RichText } from 'prismic-dom';
import { inject } from '@ember/service';
import { get } from '@ember/object';
export default Helper.extend({
  router: inject(),

  compute(params/*, hash*/) {
    return htmlSafe(RichText.asHtml(params[0], (doc) => {
      let router = get(this, 'router');
      return router.urlFor(doc.type, doc.id);
    }));
  }
});
