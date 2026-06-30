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
  ],
};
