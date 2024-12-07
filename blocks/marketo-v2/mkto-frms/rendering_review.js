// ##
// ## Updated 20240507T183528
// ##
// ##
// ## Rendering Review
// ##

if (typeof renderingReview !== "function" && typeof form_dynamics !== "undefined") {
  mkf_c.log("Rendering Review - Loaded");

  function renderingReview() {
    function getMktoFormID1() {
      const mktoForm = document.querySelector("form.mktoForm");
      if (mktoForm && mktoForm.id) {
        const formId = parseInt(mktoForm.id.replace("mktoForm_", ""));
        return isNaN(formId) ? null : formId;
      }
      return null;
    }

    var translations_ready1 = false;
    var interval_wait_whenReady;

    function wait_whenReady() {
      if (!translations_ready1 && typeof MktoForms2 === "object") {
        const formId = getMktoFormID1();
        if (
          formId &&
          typeof MktoForms2.getForm === "function" &&
          typeof MktoForms2.whenReady === "function"
        ) {
          const form = MktoForms2.getForm(formId);
          if (form) {
            clearInterval(interval_wait_whenReady);
            translations_ready1 = true;

            MktoForms2.whenReady(function (form) {
              function wait_fields(form) {
                const formSelector = "#mktoForm_" + form.getId() + " .fnc_field_change_country";
                const formElements = document.querySelectorAll(formSelector);
                if (formElements.length > 0) {




                  const formParentId = "mktoForm_" + form.getId();
                  const formParentElem = document.getElementById(formParentId);
                  if (formParentElem.classList.contains("mktoWhenRendered")) {
                    return;
                  } else {
                    formParentElem.classList.add("mktoWhenRendered");

                    marketoFormSetup();
                    field_pref();
                    categoryFilters();
                    cleaning_validation();
                    templateManager();
                  }
                } else {
                  privacyValidation();

                  if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
                    mkf_c.log("knownMktoVisitor is not defined");
                  } else {
                    setTimeout(function () {
                      wait_fields(form);
                    }, 10);
                  }
                }
              }
              wait_fields(form);
            });
          }
        }
      }
    }
    interval_wait_whenReady = setInterval(function () {
      setTimeout(wait_whenReady, 10);
    }, 10);
  }
}

// ##
// ##