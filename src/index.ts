import type { Core } from '@strapi/strapi';
import fetch from 'node-fetch';

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

      // 👉 Não dispara nada na criação, só loga
      async afterCreate(event) {
        const { result } = event;
        strapi.log.info(
          `[lifecycles global] afterCreate(show) id=${result?.id} publishedAt=${result?.publishedAt}`
        );
      },

      // 👉 Só dispara quando o registro ESTÁ publicado
      async afterUpdate(event) {
        const { result } = event;

        const isPublished = !!result?.publishedAt;

        strapi.log.info(
          `[lifecycles global] afterUpdate(show) id=${result?.id} isPublished=${isPublished}`
        );

        if (isPublished) {
          strapi.log.info(
            '[lifecycles global] Registro publicado/atualizado, disparando triggerGithub()'
          );
          await triggerGithub(strapi);
        } else {
          strapi.log.info(
            '[lifecycles global] Registro ainda não publicado, não disparando build.'
          );
        }
      },
    });
  },
};
