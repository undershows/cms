import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::fcm-token.fcm-token', ({ strapi }) => ({
  async create(ctx) {
    const { token, platform } = ctx.request.body;

    if (!token || !platform) {
      return ctx.badRequest('token e platform são obrigatórios');
    }

    const existing = await strapi.db.query('api::fcm-token.fcm-token').findOne({
      where: { token },
    });

    if (existing) {
      return ctx.send({ ok: true });
    }

    await strapi.db.query('api::fcm-token.fcm-token').create({
      data: { token, platform },
    });

    return ctx.send({ ok: true });
  },
}));
