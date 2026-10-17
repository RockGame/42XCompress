# 42XCompress

**Local-first image compression and conversion** by RG42X Lab. Web app for Cloudflare Pages and optional Windows desktop builds.

- Compress and convert JPEG, PNG, WebP, AVIF and BMP in the browser.
- Batch queue, individual downloads, and ZIP download.
- Optional resize limits.
- English/Spanish interface.
- Local-first: selected images are processed by the browser and are not uploaded to a processing server.
- Copyright: © RG42X Lab 2026.
- License: GPL-3.0-only. See `LICENSE`.

> **Honest limitations:** the current browser build uses the browser's Canvas encoders, not a bundled MozJPEG/AVIF codec suite. AVIF export depends on browser support. BMP output is implemented as 24-bit BMP and flattens transparency to white. The “original” option re-encodes the image and may not preserve every original metadata field or animation. File sizes can increase; 80–90% savings are not guaranteed. Files over 100 MB are rejected by the processing function; browser memory limits can be lower than the file-size limit.

## Quick start (English)

Requirements: Node.js 20 LTS or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Build and test:

```bash
npm run build
npm test
npm run preview
```

## Cloudflare Pages deployment

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select this repository.
4. Configure:
   - Framework preset: **Vite** (or None if Vite is not listed)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
5. Deploy. No backend or environment variables are required for the local processing workflow.

`public/` is not required for this starter. The site is static and all image processing runs in the user's browser. Do not add a server URL or API key; this app does not need a processing server.

## Windows desktop build

Requirements: Windows is recommended for producing native Windows artifacts.

```bash
npm install
npm run desktop:dev
npm run desktop:build
```

Build outputs are written to `release/`, including an NSIS installer and portable executable. Electron packaging is configured in `package.json`. Cross-platform packaging can have platform-specific requirements; build Windows releases on Windows for best results.

## Features and formats

| Format | Input | Output | Notes |
|---|---:|---:|---|
| JPEG/JPG | Yes | Yes | Lossy quality control; transparency is flattened to white |
| PNG | Yes | Yes | Canvas PNG output; quality slider does not affect PNG encoding |
| WebP | Yes | Yes | Output depends on browser codec support |
| AVIF | Yes | Yes | Output depends on browser codec support |
| BMP | Yes | Yes | Custom 24-bit BMP output; transparency is flattened to white |

The quality slider controls the browser's lossy encoder where supported. It is not a universal quality score across formats.

## Privacy

42XCompress has no image-processing server, analytics, account system, or remote upload code. The UI currently loads Google Fonts from a CDN; to make every network request local, remove the `@import` line in `src/styles.css` or bundle the fonts locally. Images selected for processing remain in the browser session unless the user downloads them.

## License

This project is licensed under GNU GPL version 3.0 only. Third-party dependencies keep their own licenses; see `THIRD_PARTY_NOTICES.md`.
