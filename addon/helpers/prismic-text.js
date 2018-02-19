import { helper } from '@ember/component/helper';
import PrismicDom from 'prismic-dom';

export function prismicText(params/*, hash*/) {
  return PrismicDom.RichText.asText(params[0]);
}

export default helper(prismicText);
