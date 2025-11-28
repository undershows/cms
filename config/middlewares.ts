export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://undershows.nyc3.cdn.digitaloceanspaces.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'undershows.nyc3.cdn.digitaloceanspaces.com',
          ],
          'frame-src': ["'self'", 'https:'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::favicon',
  'strapi::public',
];
