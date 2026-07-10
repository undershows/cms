export default {
  routes: [
    {
      method: 'POST',
      path: '/fcm-tokens',
      handler: 'fcm-token.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/fcm-tokens',
      handler: 'fcm-token.find',
      config: {
        auth: true,
      },
    },
  ],
};
