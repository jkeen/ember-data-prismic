import { helper } from '@ember/component/helper';
import PrismicDom from 'prismic-dom';

export function prismicText(params/*, hash*/) {
  if (params[0]) {
    return PrismicDom.RichText.asText(params[0]);
  }
}

export default helper(prismicText);
