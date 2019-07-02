import Helper from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import { RichText } from 'prismic-dom';
import { inject } from '@ember/service';
export default Helper.extend({
  prismic: inject(),

  compute(params/*, hash*/) {
    if (params[0]) {
      return htmlSafe(RichText.asHtml(params[0], (doc) => {
        return this.prismic.urlFor(doc)
      }));
    }
  }
});
