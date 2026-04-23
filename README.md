# DA Marketo
Marketo form block and script pipeline for business.adobe.com. See [ARCHITECTURE.md](/ARCHITECTURE.md) for the full loading chain and phase roadmap.

## Contributing
Please carefully review the [contributing doc](/CONTRIBUTING.md) *before* beginning development.

## Developing
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `sudo npm install -g @adobe/aem-cli`
2. Add `AEM_PORT=6586` to a `.env` file in this repo's root (avoids port conflict with da-bacom).
3. Run `aem up` in this repo's folder.
4. Open this repo's folder in your favorite editor and start coding.

## Testing Changes on BACOM Pages
The `?marketolibs` param controls which branch of da-marketo is used for both the block and `mkto/` scripts.

1. Run `aem up` in this repo (serves at `http://localhost:6586`).
2. Run `aem up` in the da-bacom repo (serves at `http://localhost:3000`).
3. On any `localhost:3000` page with a Marketo form, add `?marketolibs=local`.
4. The `da-marketo` block and `mkto/` scripts will load from `localhost:6586`.

To test a deployed branch without running locally:
```
?marketolibs=sync-forms   →  https://sync-forms--da-marketo--adobecom.aem.live
?marketolibs=main         →  https://main--da-marketo--adobecom.aem.live
```

This works on `localhost:3000`, `main--da-bacom--adobecom.aem.live`, and `business.adobe.com`.

## Testing
```sh
npm run test
```
or:
```sh
npm run test:watch
```

### E2E Tests
```sh
npm run test:nala           # headless
npm run test:nala:headed    # headed
npm run test:nala:bstack    # BrowserStack cross-browser
```

To run a single test:
```sh
npx playwright test nala/tests/marketo.block.test.js --grep "Full template"
```

## Linting
```sh
npm run lint        # JS + CSS
npm run lint:js
npm run lint:css
```

Note: `mkto/` scripts are excluded from linting.

## Logging
Do not use `console` — use `window.lana.log` instead. Logs go to Splunk.

Severity levels:
```
critical = outage-level or security impact
error    = failures that block expected behavior
warning  = misconfigurations or recoverable issues
info     = general operational details (default when omitted)
debug    = verbose troubleshooting details
```

Example:
```js
window.lana.log('message', { severity: 'warning', tags: 'da-marketo' });
```
