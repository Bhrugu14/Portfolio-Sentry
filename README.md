# Portfolio

A personal portfolio site: [Next.js](https://nextjs.org) frontend, content managed in a [Sanity](https://www.sanity.io) Studio. Two projects, one Sanity dataset:

- **[`web/`](web/)** — the Next.js site. Start here for setup, environment variables, running with Docker, and deploying. See [web/README.md](web/README.md).
- **[`studio/`](studio/)** — the Sanity Studio where projects, experience, skills, and site settings are edited. See [studio/README.md](studio/README.md) and `web/README.md`'s [Adding/editing content](web/README.md#addingediting-content-sanity-studio) section.

## Quickstart

```bash
git clone <this-repo-url>
cd Portfolio-Sentry
npm install --prefix web
npm install --prefix studio
cp web/.env.local.example web/.env.local       # fill in your own values — see web/README.md
cp studio/.env.local.example studio/.env.local # same project ID/dataset as above
npm run dev                                    # runs the Studio and the site together
```

This starts the Studio at [http://localhost:3333](http://localhost:3333) and the site at [http://localhost:3000](http://localhost:3000). `npm run dev` at the root is a convenience wrapper (see [package.json](package.json)) — each project also runs independently with its own `npm run dev` from inside `web/` or `studio/`.

For everything else — environment variables, Docker, testing, deploying — see [web/README.md](web/README.md).

## License

[MIT](LICENSE) — free to clone, modify, and deploy as your own portfolio.
