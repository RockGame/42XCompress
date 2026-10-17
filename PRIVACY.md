# Privacy / Privacidad

42XCompress processes selected images locally in the browser. It does not send image bytes to a processing API.

The current stylesheet imports Google Fonts from Google Fonts CDN, which means the page makes a network request for typography. To avoid this request too, remove the font import or bundle font files locally. Cloudflare Pages serves the static app assets, but selected images are not uploaded to Pages.

Browser support and memory limits vary. A 100 MB file limit does not guarantee that every browser/device has enough memory to decode an image of that size.
