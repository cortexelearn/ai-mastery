# AI Mastery diagrams

Diagrams are served from the same origin as the lessons. Reference them in a
lesson's `content` array using an image block. Alt text is required and PNG is
preferred.

```js
{ type: "image", src: "diagrams/AIM-L02-token-loop.png", alt: "Diagram of the token loop.", caption: "Optional caption." }
```

Add new diagram files to `PRECACHE_URLS` in `sw.js` and bump `CACHE_NAME`.

Do not add a CDN or remote image host; image `src` must be a relative `diagrams/` path.

Illustrative teaching figures only.
