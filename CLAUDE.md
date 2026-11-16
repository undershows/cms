# CLAUDE.md

## Commits and pull requests

- Never add `Co-Authored-By` trailers to commit messages, for any AI model or
  tool (Claude Fable, Opus, Sonnet, or anything else). Commits carry only the
  human author.
- Write commit messages in English, in the Conventional Commits style already
  used here (`chore(deps):`, `fix(docker):`, `fix(cron):`).

## Deploy

Production deploys run from `.github/workflows/deploy.yml` on every push to
`main`, with no path filter: any pushed commit, even a docs-only one, redeploys
the CMS.
