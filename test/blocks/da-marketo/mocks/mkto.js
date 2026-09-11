// Minimal test mock of mkto/mkto.js's loadMkto pipeline (real one loads forms2.min.js
// and the full MCZ script chain from Marketo's live host, which unit tests can't reach).
// Tests can pre-seed window.MktoForms2 with their own stub before calling loadMarketo();
// this mock only installs a default when none is present, and set window.mktoMockFail = true
// to simulate a pipeline load failure.

export default async function loadMkto(marketoHost, munchkinID, formID) {
  if (window.mktoMockFail) throw new Error('mocked forms2 load failure');

  if (!window.MktoForms2) {
    window.MktoForms2 = {
      whenReady: (cb) => {
        const formEl = document.querySelector(`#mktoForm_${formID}`) || document.querySelector('form');
        cb({
          getFormElem: () => ({ get: () => formEl }),
          onValidate: () => {},
          onSubmit: () => {},
          onSuccess: () => {},
        });
      },
    };
  }
}
