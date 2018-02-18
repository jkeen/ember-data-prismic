# Ember Data Adapter For Prismic CMS
This is an ember data adapter for the Prismic CMS, there are many incomplete projects like this one, but this one actually works.

# Usage

#### Install
`ember install ember-data-prismic`

##### Environment
```javascript
  //config/environment.js

  prismic: {
    apiEndpoint: YOUR_PRISMIC_API_ENDPOINT,
    accessToken: YOUR_PRISMIC_ACCESS_TOKEN
  },
```

##### Adapter
```javascript
  // adapters/application.js

  import PrismicAdapter from 'ember-data-prismic/adapters/prismic';
  export default PrismicAdapter.extend({});
```

##### Serializer
```javascript

  // serializers/application.js
  import PrismicSerializer from 'ember-data-prismic/serializers/prismic';
  export default PrismicSerializer.extend({});
```


## Add
