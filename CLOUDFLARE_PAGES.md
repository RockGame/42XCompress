# Cloudflare Pages setup / Configuración de Cloudflare Pages

## Build settings
- Framework: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Environment variables: none required

The site is static. The browser processes images locally, so there is no Worker/API to configure for image processing.

## Publish from GitHub
1. Push this repository to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git.
3. Authorize GitHub and choose the repository.
4. Set the build settings above and deploy.
5. Each push to the selected production branch triggers a new build.

## Note
The optional GitHub Actions deployment workflow requires a Cloudflare API token, account ID, and a real Pages project name. The dashboard Git integration is simpler for a first deployment.
