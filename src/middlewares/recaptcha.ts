export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const isAdminLogin =
      ctx.method === 'POST' && ctx.path === '/admin/login';

    if (!isAdminLogin) {
      return next();
    }

    const token = ctx.request.body?.recaptchaToken;

    if (!token) {
      ctx.status = 400;
      ctx.body = { error: { message: 'reCAPTCHA token ausente.' } };
      return;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      { method: 'POST' }
    );

    const data: any = await response.json();

    if (!data.success || data.score < 0.5) {
      ctx.status = 400;
      ctx.body = { error: { message: 'Verificação reCAPTCHA falhou.' } };
      return;
    }

    return next();
  };
};
