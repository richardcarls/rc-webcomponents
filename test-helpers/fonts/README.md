# Test fonts

`scripts/playwright-env.mjs` mounts this directory read-only into the Playwright image's
font directory, so browser tests and screenshot baselines render in Roboto, the family the
Material theme names. The image ships without it.

- `roboto/`: Roboto variable fonts (roman and italic) from
  [google/fonts](https://github.com/google/fonts/tree/main/ofl/roboto) at commit
  `45e3d5269e4a`, under the SIL Open Font License (`roboto/OFL.txt`).

Changing these files changes every screenshot; re-record with `yarn test:screenshots:update`.
