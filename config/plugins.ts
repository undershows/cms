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

      security: {
        enabled: true,
        sizeLimit: 10 * 1024 * 1024,
        allowedExtensions: [
          '.jpg',
          '.jpeg',
          '.png',
          '.webp',
          '.gif',
          '.svg',
        ],
      },

      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
