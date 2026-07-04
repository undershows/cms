import type { Core } from '@strapi/strapi';
import fetch from 'node-fetch';
import admin from 'firebase-admin';

const lastTriggered: Record<string | number, string> = {};

async function triggerGithub(strapi: Core.Strapi) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const eventType = process.env.GITHUB_EVENT_TYPE || 'rebuild_site';

  strapi.log.info(
    `[triggerGithub] GITHUB_OWNER=${owner || '<vazio>'} GITHUB_REPO=${repo || '<vazio>'} GITHUB_TOKEN=${
      token ? 'SET' : 'MISSING'
    } EVENT_TYPE=${eventType}`
  );

  if (!owner || !repo || !token) {
    strapi.log.error('GITHUB_* env vars não configuradas, não vou disparar build.');
    return;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  strapi.log.info(`[triggerGithub] Chamando ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ event_type: eventType }),
    });

    strapi.log.info(`[triggerGithub] GitHub respondeu status=${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      strapi.log.error(
        `[triggerGithub] Erro ao chamar GitHub Actions: ${res.status} - ${text}`
      );
    } else {
      strapi.log.info(
        '[triggerGithub] GitHub Actions disparado com sucesso (repository_dispatch).'
      );
    }
  } catch (err) {
    strapi.log.error('[triggerGithub] Erro ao chamar GitHub Actions:', err);
  }
}

function shouldTriggerOnce(event: any, strapi: Core.Strapi): boolean {
  const { result } = event;
  const id = result?.id;
  const publishedAt = result?.publishedAt;
  const updatedAt = result?.updatedAt;

  // se não estiver publicado, nem pensa em build
  if (!publishedAt) {
    strapi.log.info(
      `[lifecycles global] id=${id} ainda não publicado (publishedAt vazio), não disparando build.`
    );
    return false;
  }

  if (!id || !updatedAt) {
    strapi.log.warn(
      '[lifecycles global] Sem id ou updatedAt no result, disparando build por segurança.'
    );
    return true;
  }

  const last = lastTriggered[id];

  if (last === updatedAt) {
    strapi.log.info(
      `[lifecycles global] Já disparei build para id=${id} em updatedAt=${updatedAt}, ignorando chamada duplicada.`
    );
    return false;
  }

  lastTriggered[id] = updatedAt;
  return true;
}

function initFirebase() {
  if (admin.apps.length > 0) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function sendWeeklyPushNotification(strapi: Core.Strapi) {
  try {
    initFirebase();

    const tokens = await strapi.db.query('api::fcm-token.fcm-token').findMany({});

    if (tokens.length === 0) {
      strapi.log.info('[push] Nenhum token cadastrado, pulando envio.');
      return;
    }

    const tokenList = tokens.map((t: any) => t.token);

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenList,
      notification: {
        title: 'Undershows',
        body: 'Ei! Não esquece de ver os shows do fim de semana! 🤘',
      },
    });

    strapi.log.info(
      `[push] Enviado: ${response.successCount} ok, ${response.failureCount} falhas.`
    );

    response.responses.forEach((r: any, i: number) => {
      if (!r.success) {
        strapi.log.error(`[push] Falha token[${i}]: ${r.error?.code} — ${r.error?.message}`);
      }
    });
  } catch (err) {
    strapi.log.error('[push] Erro ao enviar push notification:', err);
  }
}

export default {
  register() {},

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.log.info('🔍 ENV DEBUG', {
      GITHUB_OWNER: process.env.GITHUB_OWNER,
      GITHUB_REPO: process.env.GITHUB_REPO,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'SET' : 'MISSING',
      GITHUB_EVENT_TYPE: process.env.GITHUB_EVENT_TYPE,
      NODE_ENV: process.env.NODE_ENV,
    });

    // toda sexta às 11h (horário de Brasília = UTC-3, ou seja, 14h UTC)
    strapi.cron.add({
      weeklyPush: {
        task: async () => {
          strapi.log.info('[push] Disparando push notification semanal...');
          await sendWeeklyPushNotification(strapi);
        },
        options: '43 2 * * *',
      },
    });

    strapi.log.info('🔥 Registrando lifecycle global para api::show.show');

    strapi.db.lifecycles.subscribe({
      models: ['api::show.show'],

      async afterCreate(event) {
        const { result } = event;
        strapi.log.info(
          `[lifecycles global] afterCreate(show) id=${result?.id} publishedAt=${result?.publishedAt} updatedAt=${result?.updatedAt}`
        );

        if (shouldTriggerOnce(event, strapi)) {
          strapi.log.info(
            '[lifecycles global] afterCreate => registro publicado, disparando triggerGithub()'
          );
          await triggerGithub(strapi);
        }
      },

      async afterUpdate(event) {
        const { result } = event;
        strapi.log.info(
          `[lifecycles global] afterUpdate(show) id=${result?.id} publishedAt=${result?.publishedAt} updatedAt=${result?.updatedAt}`
        );

        if (shouldTriggerOnce(event, strapi)) {
          strapi.log.info(
            '[lifecycles global] afterUpdate => registro publicado, disparando triggerGithub()'
          );
          await triggerGithub(strapi);
        }
      },

      async afterDelete(event) {
        const { result } = event;
        strapi.log.info(
          `[lifecycles global] afterDelete(show) id=${result?.id}, disparando triggerGithub()`
        );

        await triggerGithub(strapi);
      },
    });
  },
};
