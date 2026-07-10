import { factories } from '@strapi/strapi';

// Rate limit simples em memória por IP. A rota é pública (auth: false), então isso
// evita que alguém encha a tabela de tokens / a lista de push com requisições em massa.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// Evita que o Map cresça sem limite: limpa entradas expiradas periodicamente.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}, WINDOW_MS).unref?.();

export default factories.createCoreController('api::fcm-token.fcm-token' as any, ({ strapi }) => ({
  async find(ctx) {
    const tokens = await strapi.db.query('api::fcm-token.fcm-token').findMany({});
    return ctx.send({ data: tokens });
  },

  async create(ctx) {
    if (isRateLimited(ctx.request.ip)) {
      ctx.status = 429;
      ctx.body = { error: { message: 'Muitas requisições, tente novamente em instantes.' } };
      return;
    }

    const { token, platform } = ctx.request.body ?? {};

    // strapi.db.query().create() não roda validação de schema, então validamos o tipo aqui.
    if (typeof token !== 'string' || typeof platform !== 'string') {
      return ctx.badRequest('token e platform devem ser strings');
    }

    const trimmedToken = token.trim();

    if (!trimmedToken || trimmedToken.length > 512) {
      return ctx.badRequest('token inválido');
    }

    if (!platform.trim() || platform.length > 32) {
      return ctx.badRequest('platform inválida');
    }

    const existing = await strapi.db.query('api::fcm-token.fcm-token').findOne({
      where: { token: trimmedToken },
    });

    if (existing) {
      return ctx.send({ ok: true });
    }

    await strapi.db.query('api::fcm-token.fcm-token').create({
      data: { token: trimmedToken, platform },
    });

    return ctx.send({ ok: true });
  },
}));
