export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          endpoint: env('MAGALU_S3_ENDPOINT'),
          region: 'br-se1',
          forcePathStyle: true,
          signatureVersion: 'v4',
          credentials: {
            accessKeyId: env('MAGALU_S3_KEY'),
            secretAccessKey: env('MAGALU_S3_SECRET'),
          },
          params: {
            Bucket: env('MAGALU_S3_BUCKET'),
          },
        },

        baseUrl: env('MAGALU_S3_BASE_URL', 'https://undershows.br-se1.magaluobjects.com'),
      },

      sizeLimit: 10 * 1024 * 1024,

      security: {
        allowedTypes: ['image/*'],
        deniedTypes: ['application/x-sh', 'application/x-dosexec'],
      },
    },
  },

  email: {
    config: {
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: 'no-reply@undershows.com.br',
        defaultReplyTo: 'no-reply@undershows.com.br',
      },
    },
  },
})