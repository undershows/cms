"use strict";

const fetch = require("node-fetch");

async function triggerGithub() {
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const token = process.env.REPO_TOKEN;
  const eventType = process.env.REPO_EVENT_TYPE || "rebuild_site";

  if (!owner || !repo || !token) {
    strapi.log.error("REPO_* env vars não configuradas, não vou disparar build.");
    return;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

  strapi.log.info(`Disparando GitHub Actions para ${owner}/${repo} (event_type=${eventType})`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: eventType,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      strapi.log.error(`Erro ao chamar GitHub Actions: ${res.status} - ${text}`);
    } else {
      strapi.log.info("GitHub Actions disparado com sucesso (repository_dispatch).");
    }
  } catch (err) {
    strapi.log.error("Erro ao chamar GitHub Actions:", err);
  }
}

module.exports = {
  async afterCreate(event) {
    strapi.log.info("afterCreate(show) chamado, disparando triggerGithub()");
    await triggerGithub();
  },

  async afterUpdate(event) {
    const { result } = event;

    strapi.log.info("afterUpdate(show) chamado");

    if (result.publishedAt) {
      strapi.log.info("Registro publicado, disparando triggerGithub()");
      await triggerGithub();
    } else {
      strapi.log.info("Registro ainda não publicado, não disparando build.");
    }
  },
};
