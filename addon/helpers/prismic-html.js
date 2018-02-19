import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import { RichText } from 'prismic-dom';

export function linkResolver(doc) {
  console.log(doc);
  // // Pretty URLs for known types
  // if (doc.type === 'blog') return "/post/" + doc.uid;
  // if (doc.type === 'page') return "/" + doc.uid;
  // // Fallback for other types, in case new custom types get created
  // return "/doc/" + doc.id;
}


export function prismicHtml(params/*, hash*/) {
  return htmlSafe(RichText.asHtml(params[0], linkResolver, function() {}));
}

export default helper(prismicHtml);
