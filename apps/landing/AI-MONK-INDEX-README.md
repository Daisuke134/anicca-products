# The Art of AI Monks — Open Index

Search the directory at https://aniccaai.com/ai-monk-database.
Read the English field guide at https://aniccaai.com/blog/ebook-publishing-ai-monk-economy-2026.

## Reuse the data

The canonical data is `public/data/ai-monk-avatar-database-2026.json`, also served at
https://aniccaai.com/data/ai-monk-avatar-database-2026.json. Read `scope`, `methodology`,
`sources` and each record's unknowns before interpreting the accounts array.
A researched profile may still be unverified. Screenshot leads are not confirmed AI avatars.

```sh
curl -fsS https://aniccaai.com/data/ai-monk-avatar-database-2026.json -o monks.json
python3 -c 'import json; d=json.load(open("monks.json")); print([(a["display_name"], a["ai_status"]) for a in d["accounts"]])'
```

## Run the existing web app

From `apps/landing`, use the repository's existing dependency lockfile and Next.js commands.
The directory consists of `app/ai-monk-database/page.tsx`, `components/AiMonkDatabase.tsx`,
`lib/ai-monk-directory.mjs` and its declaration/test files. It reads static JSON without a
new database or an account. The surrounding navigation is part of the existing site.

Run the focused contract with `node --test lib/ai-monk-directory.test.mjs`.
Follow the pinned canonical staging steps in `.github/workflows/landing-pr-build.yml` for a full-site build.

## Improve coverage

Open a GitHub issue with the exact public profile URL, creator disclosure or reporting that
supports an AI classification, the observed language, and dated source links for audience
counts and offers. Keep unknowns explicit. The latest numeric followers/subscribers on a
platform drive sorting; views, historical peaks, cross-platform sums and seller claims do not.

## Licenses

`AI-MONK-INDEX-LICENSE.md` applies MIT to the specified index implementation.
`public/data/ai-monk-avatar-database-license.md` applies CC BY 4.0 to Anicca-authored
annotations, compilation and the two original editorial illustrations listed there. Third-party videos, voices, faces, names, marks and source
material retain their own rights. This directory does not license them for reuse.
