import { defaultReporter } from '@web/test-runner';

function customReporter() {
  return {
    async reportTestFileResults({ logger, sessionsForTestFile }) {
      sessionsForTestFile.forEach((session) => {
        session.testResults.tests.forEach((test) => {
          if (!test.passed && !test.skipped) {
            logger.log(test);
          }
        });
      });
    },
  };
}
export default {
  coverageConfig: {
    exclude: [
      '**/mocks/**',
      '**/node_modules/**',
      '**/test/**',
      '**/deps/**',
    ],
  },
  plugins: [],
  // Note: the browser resolves the <script type="importmap"> below natively; the
  // @web/dev-server-import-maps plugin is intentionally NOT registered here, as it
  // rewrites dynamic-import requests to a `?wds-import-map=N` URL, which produces a
  // second, un-synced module instance for anything already mapped natively.
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    customReporter(),
  ],
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script type='importmap'>
          {
            "imports": {
              "https://main--milo--adobecom.aem.live/libs/utils/utils.js": "/test/blocks/da-marketo/mocks/utils.js",
              "https://main--milo--adobecom.aem.live/libs/utils/action.js": "/test/blocks/da-marketo/mocks/action.js",
              "https://main--milo--adobecom.aem.live/libs/features/placeholders.js": "/test/blocks/da-marketo/mocks/placeholders.js",
              "http://localhost:2000/mkto/mkto.js": "/test/blocks/da-marketo/mocks/mkto.js"
            }
          }
        </script>
        <script type='module'>
          const oldFetch = window.fetch;
          window.fetch = async (resource, options) => {
            if (!resource.startsWith('/') && !resource.startsWith('http://localhost')) {
              console.error(
                '** fetch request for an external resource is disallowed in unit tests, please find a way to mock! https://github.com/orgs/adobecom/discussions/814#discussioncomment-6060759 provides guidance on how to fix the issue.',
                resource
              );
            }
            return oldFetch.call(window, resource, options);
          };
          
          const oldXHROpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = async function (...args) {
            let [method, url, asyn] = args;
            if (!resource.startsWith('/') && url.startsWith('http://localhost')) {
              console.error(
                '** XMLHttpRequest request for an external resource is disallowed in unit tests, please find a way to mock! https://github.com/orgs/adobecom/discussions/814#discussioncomment-6060759 provides guidance on how to fix the issue.',
                url
              );
            }
            return oldXHROpen.apply(this, args);
          };

          const observer = new MutationObserver((mutationsList, observer) => {
            for(let mutation of mutationsList) {
              if (mutation.type === 'childList') {
                for(let node of mutation.addedNodes) {
                  if(node.nodeName === 'SCRIPT' && node.src && !node.src.startsWith('http://localhost')) {
                    console.error(
                      '** An external 3rd script has been added. This is disallowed in unit tests, please find a way to mock! https://github.com/orgs/adobecom/discussions/814#discussioncomment-6060891 provides guidance on how to fix the issue.',
                      node.src
                    );
                  }
                }
              }
            }
          });
          observer.observe(document.head, { childList: true });
        </script>
      </head>
      <body>
        <script type='module' src='${testFramework}'></script>
      </body>
    </html>`,
};
