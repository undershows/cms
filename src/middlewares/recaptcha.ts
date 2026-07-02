const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;
const EXPECTED_ACTION = 'login';

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const isAdminLogin = ctx.method === 'POST' && ctx.path === '/admin/login';

    if (!isAdminLogin) {
      return next();
    }

    const deny = (message = 'Verificação reCAPTCHA falhou.') => {
      ctx.status = 400;
      ctx.body = { error: { message } };
    };

    const token = ctx.request.body?.recaptchaToken;

    if (!token || typeof token !== 'string') {
      return deny('reCAPTCHA token ausente.');
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      strapi.log.error('[recaptcha] RECAPTCHA_SECRET_KEY não configurado, negando login.');
      return deny();
    }

    // Falha fechada: qualquer erro de rede/parse nega o login em vez de estourar 500.
    let data: any;
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }).toString(),
      });
      data = await response.json();
    } catch (err) {
      strapi.log.error('[recaptcha] Erro ao verificar token com o Google:', err);
      return deny();
    }

    // O hostname só é validado quando RECAPTCHA_HOSTNAME está definido (evita quebrar
    // dev local). Em produção, defina-o como o domínio do admin.
    const expectedHostname = process.env.RECAPTCHA_HOSTNAME;

    const ok =
      data?.success === true &&
      typeof data.score === 'number' &&
      data.score >= MIN_SCORE &&
      data.action === EXPECTED_ACTION &&
      (!expectedHostname || data.hostname === expectedHostname);

    if (!ok) {
      strapi.log.warn(
        `[recaptcha] Verificação reprovada: success=${data?.success} score=${data?.score} action=${data?.action} hostname=${data?.hostname}`
      );
      return deny();
    }

    return next();
  };
};
