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
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
