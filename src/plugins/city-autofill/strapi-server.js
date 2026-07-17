'use strict';

module.exports = {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'city-with-uf',
      plugin: 'city-autofill',
      type: 'string',
    });
  },
};
