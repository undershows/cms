import type { Core } from '@strapi/strapi';
import fetch from 'node-fetch';

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
    });
  },
};
