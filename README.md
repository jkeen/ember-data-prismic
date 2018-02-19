# Ember Data Adapter For Prismic CMS
This is an ember data adapter for the V2 Prismic CMS. There are many incomplete projects trying to get ember to integrate easily into Prismic. This one actually works and is actually being used and developed

# Usage

#### Install
`ember install ember-data-prismic`

##### Environment
```javascript
  //config/environment.js

  prismic: {
    apiEndpoint: YOUR_PRISMIC_API_ENDPOINT, // Make sure this is the v2 API url
    accessToken: YOUR_PRISMIC_ACCESS_TOKEN
  },
```

##### Adapter
```javascript
  // adapters/application.js

  import PrismicAdapter from 'ember-data-prismic/adapters/prismic';
  export default PrismicAdapter.extend({});
```

##### Models
```javascript

  //models/example.js

  import Prismic from 'ember-data-prismic/models/prismic';
  import attr from 'ember-data/attr';
  export default Prismic.extend({
    // your fields
    date: attr('date') // a prismic date field
    description: attr('prismic-object') // this keeps a prismic object in tact so we can use our template helpers for displaying HTML or text
  });
```

##### In Templates
```javascript

  {{prismic-html model.description}} // displays html


  {{prismic-text model.description}} // converts the rich text to text

```

------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
