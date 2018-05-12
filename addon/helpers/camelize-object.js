import { helper } from '@ember/component/helper';
import { camelize } from '@ember/string';

export function camelizeObject(source) {
  let dest = null;

  if (Array.isArray(source)) {
    dest = source.map(function(obj){
      return camelizeObject(obj);
    });
  } else if (source !== null && typeof source === "object") {
    dest = {};
    for (var prop in source){
      let newKey = camelize(prop);
      dest[newKey] = camelizeObject(source[prop]);
    }
  } else {
    dest = source;
  }

  return dest;
}

export default helper(camelizeObject);
