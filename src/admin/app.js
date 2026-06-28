const RECAPTCHA_SITE_KEY = '6LdelTktAAAAAGNE7_tEqKrrFjxVKaBy_85MyRJv';

function loadRecaptcha() {
  if (document.getElementById('recaptcha-script')) return;
  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  script.async = true;
  document.head.appendChild(script);
}

function patchLoginFetch() {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url && url.includes('/admin/login') && init?.method === 'POST') {
      try {
        await new Promise((resolve) => {
          const check = () => (window.grecaptcha?.ready ? resolve(null) : setTimeout(check, 100));
          check();
        });

        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
        const body = JSON.parse(init.body);
        body.recaptchaToken = token;
        init = { ...init, body: JSON.stringify(body) };
      } catch (e) {
        console.error('reCAPTCHA error:', e);
      }
    }

    return originalFetch.call(this, input, init);
  };
}

export default {
  bootstrap() {
    loadRecaptcha();
    patchLoginFetch();
  },
  config: {
    datePicker: {
      maxDate: null,
      minDate: null,
    },
  },
};
