export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': [
            "'self'",
            'https://cms.undershows.com.br',
            'https://media.undershows.com.br',
            'https://api.github.com'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://media.undershows.com.br',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://media.undershows.com.br',
          ],
          'frame-src': ["'self'", 'https:'],
        },
      },
    },
  },

  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'https://shows.undershows.com.br',
        'https://cms.undershows.com.br',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },

  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::favicon',
  'strapi::public',
];
