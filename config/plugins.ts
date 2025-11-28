export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          endpoint: env('SPACES_ENDPOINT'),
          region: 'us-east-1',
          forcePathStyle: false,
          credentials: {
            accessKeyId: env('SPACES_KEY'),
            secretAccessKey: env('SPACES_SECRET'),
          },
          params: {
            Bucket: env('SPACES_BUCKET'),
            ACL: 'public-read',
          },
        },
        baseUrl: env('SPACES_BASE_URL'),
        prefix: env('SPACES_PREFIX', 'uploads'),
      },

      sizeLimit: 10 * 1024 * 1024,

      security: {
        allowedTypes: ['image/*'],
        deniedTypes: ['application/x-sh', 'application/x-dosexec'],
      },

      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
