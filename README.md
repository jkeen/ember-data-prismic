# Ember Data Adapter For Prismic CMS
This is an ember data adapter for the V2 Prismic CMS. There are many incomplete projects trying to get ember to integrate easily into Prismic. This one actually works and is actually being used and developed.

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

  import PrismicDocument from 'ember-data-prismic/models/prismic-document';
  import attr from 'ember-data/attr';
  export default PrismicDocument.extend({
    // your fields
    date: attr('date') // a prismic date field
    description: attr() // this keeps a prismic object in tact so we can use our template helpers for displaying HTML or text
  });
```

##### In Templates
```javascript

  {{prismic-html model.description}} // displays html
  {{prismic-text model.description}} // converts the rich text to text



  {{#each model.slices as |slice|}}

    {{#if slice.sliceType == 'text'}}


    {{/if}}

  {{/each}}

```

##### Routes

```javascript
  //router.js

  this.route('post', {path: "post/:post_id"});


  // routes/post.js
  model(params) {
    return this.store.findRecord('post', params.post_id);
  },

  afterModel(model /*, transition */) {
    this.transitionTo('post', model.get('id')); // this will transition to the correct url
  }
```

------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
