# Ember Data Adapter For Prismic CMS
This is an ember data adapter for the V2 Prismic CMS. There are many incomplete ember/prismic addons trying to get ember to integrate easily into Prismic and none of them seemed to do the job. This one actually works and is being used and developed on multiple projects. Get in touch if you've got problems.

# Usage

#### Install
`ember install ember-data-prismic`

##### Environment
```javascript
  //config/environment.js

  prismic: {
    apiEndpoint: YOUR_PRISMIC_API_ENDPOINT, // Make sure this is the v2 API url
    accessToken: YOUR_PRISMIC_ACCESS_TOKEN
  }
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

  // PrismicDocument contains these fields

  // recordId            : attr('string'),
  // recordType          : attr('string'),
  // uid                 : attr('string'),
  // tags                : attr(),
  // slugs               : attr(),
  // alternateLanguages  : attr(),
  // firstPublicationDate: attr('date'),
  // lastPublicationDate : attr('date'),
  // body                : attr(),
  // linkedDocuments     : attr(),
  // slices // computed field of slice objects

  export default PrismicDocument.extend({
    // your prismic model fields
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

##### Routes and URLS

The Data Adapter's primary key is set to 'uid', so if your prismic model has a UID that's what will request the record and what the model's id will be set to. If `findRecord` doesn't find anything by looking for the UID, it will request by the internal prismic id.

```javascript
  //router.js

  this.route('post', {path: "post/:post_id"});

  // routes/post.js
  model(params) {
    return this.store.findRecord('post', params.post_id);
  },

  afterModel(model /*, transition */) {
    this.transitionTo('post', model.get('id')); // if there are multiple slugs this will transition to the correct url (the UID)
  }
```

## Still to do
1. Make a generator to create a prismic backed model, along with the ids inherited and a comment of the inherited fields

2. Make the slices real models that the adapter inserts into the store. Maybe by default if the slice on prismic is named "gallery", the data adapter will automatically look for a model called "prismic-slice-gallery"?

------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
