# 42XCompress

**Compresión y conversión local de imágenes**, por RG42X Lab. Aplicación web para Cloudflare Pages y compilación opcional para Windows.

- Comprime y convierte JPEG, PNG, WebP, AVIF y BMP desde el navegador.
- Cola por lotes, descarga individual y descarga ZIP.
- Redimensionado opcional.
- Interfaz en español e inglés.
- Procesamiento local: las imágenes seleccionadas se procesan en el navegador y no se suben a un servidor de procesamiento.
- Copyright: © RG42X Lab 2026.
- Licencia: GPL-3.0-only. Consulta `LICENSE`.

> **Limitaciones transparentes:** esta versión utiliza los codificadores Canvas del navegador, no incluye un paquete propio de codecs MozJPEG/AVIF. La exportación AVIF depende del navegador. La salida BMP es BMP de 24 bits y aplana la transparencia sobre blanco. La opción «Conservar / automático» vuelve a codificar la imagen y puede no conservar todos los metadatos o animaciones originales. El tamaño puede aumentar; no se garantiza una reducción del 80–90 %. La función de procesamiento rechaza archivos de más de 100 MB; los límites de memoria del navegador pueden ser menores.

## Inicio rápido

Requisitos: Node.js 20 LTS o posterior y npm.

```bash
npm install
npm run dev
```

Abre la dirección local que indique Vite (normalmente `http://localhost:5173`).

Compilar y probar:

```bash
npm run build
npm test
npm run preview
```

## Publicar en Cloudflare Pages

1. Sube este repositorio a GitHub.
2. En Cloudflare, entra en **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecciona este repositorio.
4. Configura:
   - Framework preset: **Vite** (o None si no aparece)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
5. Pulsa Deploy. No necesitas backend ni variables de entorno para el procesamiento local.

La web es estática y procesa las imágenes en el navegador. No configures una URL de servidor ni claves API: esta versión no necesita servidor de procesamiento.

## Crear la aplicación de Windows

Se recomienda compilar en Windows para generar los artefactos nativos.

```bash
npm install
npm run desktop:dev
npm run desktop:build
```

Los archivos se generan en `release/`, con instalador NSIS y ejecutable portable. La configuración de Electron está en `package.json`.

## Formatos compatibles

| Formato | Entrada | Salida | Notas |
|---|---:|---:|---|
| JPEG/JPG | Sí | Sí | Control de calidad con pérdida; transparencia a fondo blanco |
| PNG | Sí | Sí | Exportación Canvas; el control de calidad no cambia su codificación |
| WebP | Sí | Sí | La salida depende del soporte del navegador |
| AVIF | Sí | Sí | La salida depende del soporte del navegador |
| BMP | Sí | Sí | BMP personalizado de 24 bits; transparencia a fondo blanco |

El control de calidad afecta al codificador con pérdida del navegador cuando está disponible. No es una escala universal entre formatos.

## Privacidad

42XCompress no tiene servidor de procesamiento de imágenes, analítica, cuentas ni código de carga remota de imágenes. La interfaz sí carga Google Fonts desde un CDN; para evitar también esa conexión, elimina la línea `@import` de `src/styles.css` o incluye las fuentes localmente. Las imágenes seleccionadas permanecen en la sesión del navegador, salvo que el usuario descargue los resultados.

## Licencia

Este proyecto se distribuye bajo GNU GPL versión 3.0 únicamente. Las dependencias de terceros conservan sus propias licencias; consulta `THIRD_PARTY_NOTICES.md`.
