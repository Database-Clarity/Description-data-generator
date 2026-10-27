# How to add a category

1. Add `<id>.ts` exporting a default `Category` with `id`, `label`, `group`, `order`, and `select(manifest)`.
2. `select` returns inventory or trait entries with real hashes and `inGameDescription`.
3. Use `legacyCategory` for an existing legacy type; write a selector for a new manifest source.
4. Import the file and add it to the single `categories` list in `index.ts`.
5. Run `npm run check:v2` and `npm run generate`.
6. Inspect `templates/v2/coverage.json`; legacy counts and hashes must all be preserved.

IDs are stable kebab-case. Orders control navigation. Duplicate IDs/hashes fail generation.
Empty categories remain registered. Sandbox hashes are aliases, never separate tooltip entries.
