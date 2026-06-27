# Patrick Ottley Portfolio

Concise one-page portfolio for Patrick Ottley, built with Vite, React, TypeScript, Framer Motion, and GitHub Pages.

## Local Development

```bash
pnpm install
pnpm dev
```

The site is configured for custom-domain root deployment:

```text
https://www.jpottley.com/
```

## Verification

```bash
pnpm test
pnpm lint
pnpm build
```

## Deployment

The included GitHub Actions workflow builds `dist/` and deploys it to GitHub Pages at the custom domain root when changes are pushed to `main` or `master`.
