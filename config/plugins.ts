export default ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        s3Options: {
          endpoint: env('SPACES_ENDPOINT'),
          region: env('SPACES_REGION', 'nyc3'),
          credentials: {
            accessKeyId: env('SPACES_KEY'),
            secretAccessKey: env('SPACES_SECRET'),
          },
        },
        params: {
          Bucket: env('SPACES_BUCKET'),
        },
        baseUrl: env('SPACES_BASE_URL'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
