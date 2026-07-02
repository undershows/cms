# Undershows — CMS

CMS headless (Strapi 5) que é a fonte de conteúdo da [Undershows](https://undershows.com.br), publicado em [cms.undershows.com.br](https://cms.undershows.com.br). Guarda a agenda de shows e é consumido pelo [site](https://shows.undershows.com.br) em build time e pelo app Android.

## Como funciona

O CMS não serve conteúdo direto pro usuário final — ele alimenta o site estático e dispara os processos abaixo:

```
Editor publica um show no painel
        │
        ├──► lifecycle afterCreate/Update/Delete
        │       └─► repository_dispatch (rebuild_site) ──► rebuild do site (Astro)
        │
        └──► cron sexta 14h UTC
                └─► push notification semanal (Firebase) pros tokens FCM
```

- **Rebuild do site:** ao publicar/editar/apagar um show, um lifecycle chama a API do GitHub (`repository_dispatch`) e dispara o rebuild do front.
- **Push semanal:** toda sexta um cron manda uma notificação via Firebase Admin SDK pra todos os tokens FCM cadastrados.
- **Uploads:** imagens (cartazes) vão pro Magalu Object Storage (S3), servidas em `media.undershows.com.br`.
- **E-mail:** transacional via Resend.

## API

| Content type | Rota | Acesso |
|--------------|------|--------|
| `show` | REST padrão (`GET /api/shows`, `GET /api/shows/:id`) | Público apenas leitura (configurar role no painel) |
| `fcm-token` | `POST /fcm-tokens` | Público, com rate limit e validação de tipo |

O painel admin fica em `/admin` e exige reCAPTCHA v3 no login.

## Desenvolvimento

Requisitos: **Node 20+** e yarn. Compartilha o PostgreSQL da API principal (não roda migrations próprias).

```sh
yarn install
yarn develop    # dev server com autoReload em localhost:1337
yarn build      # builda o painel admin
yarn start      # roda em produção, sem autoReload
```

### Variáveis de ambiente

Copie `.env.example` para `.env`. Além das chaves padrão do Strapi (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`):

| Variável | Descrição |
|----------|-----------|
| `DATABASE_CLIENT` / `DATABASE_URL` | Conexão com o PostgreSQL compartilhado |
| `MAGALU_S3_ENDPOINT` / `_KEY` / `_SECRET` / `_BUCKET` | Object Storage dos uploads |
| `MAGALU_S3_BASE_URL` | Base pública das imagens (`media.undershows.com.br`) |
| `RESEND_API_KEY` | Envio de e-mail |
| `RECAPTCHA_SECRET_KEY` | Verificação do reCAPTCHA no login do admin |
| `RECAPTCHA_HOSTNAME` | Domínio esperado no token reCAPTCHA (ex: `cms.undershows.com.br`) |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_TOKEN` | Disparo do rebuild do site via `repository_dispatch` |
| `GITHUB_EVENT_TYPE` | Nome do evento (padrão: `rebuild_site`) |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Credenciais do push notification |

## Deploy

`deploy.yml` roda a cada push na `main`: conecta no servidor via SSH, buildar a imagem Docker e sobe um container único.

O container roda com hardening: usuário não-root, `--read-only`, `--cap-drop ALL`, `--security-opt no-new-privileges` e exposto só em `127.0.0.1:1337` (atrás do reverse proxy).

## Segurança

- **Login do admin:** protegido por reCAPTCHA v3, com verificação *fail-closed* (qualquer falha nega o login) e validação de `action`/`hostname`.
- **Rota pública `/fcm-tokens`:** rate limit por IP e validação de tipo/tamanho dos campos.
- **CSP** restrita (sem `script-src 'unsafe-inline'`) e **CORS** limitado aos domínios da Undershows.
- **Uploads** restritos a imagens.
- **Deploy SSH** com verificação de host key (`StrictHostKeyChecking accept-new`, pinável via secret `SSH_KNOWN_HOSTS`).
