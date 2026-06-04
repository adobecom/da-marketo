// ##
// ## Updated 20251125T142522
// ##
// ##
// ##
// ## 90_build/rendering_review.js - 20251125T142522
// ##
// ##

if (typeof window?.renderingReview !== "function" && typeof form_dynamics !== "undefined") {
  mkf_c.log("Rendering Review - Loaded");

  window.renderingReview = function (src = "DataLayer - No Source") {
    if (window?.mkto_waitForFormReady === true) {
      return;
    }
    window.mkto_waitForFormReady = true;

    mkf_c.log("Rendering Review - " + src + " - Form processing started");

    const runSetupTasks = (form) => {
      const formEl = document.getElementById("mktoForm_" + form.getId());
      if (formEl && !formEl.classList.contains("mktoWhenRendered")) {
        formEl.classList.add("mktoWhenRendered");

        window.marketoFormSetup();
        window.field_pref();
        window.categoryFilters();
        window.cleaning_validation();
        window.mkto_prefillInit();
        window.templateManager();
      }
    };

    const onFormReady = (form) => {
      window.privacyValidation();

      const formEl = form.getFormElem()[0];
      const fieldSelector = ".fnc_field_change_country";

      if (formEl.querySelector(fieldSelector)) {
        runSetupTasks(form);
        return;
      }

      const observer = new MutationObserver(() => {
        if (formEl.querySelector(fieldSelector)) {
          runSetupTasks(form);
          observer.disconnect();
        }
      });

      observer.observe(formEl, {
        childList: true,
        subtree: true,
      });

      // Failsafe
      setTimeout(() => {
        observer.disconnect();
        runSetupTasks(form);
      }, 3000);
    };

    const waitForMktoForms2 = () => {
      if (typeof MktoForms2 === "object" && typeof MktoForms2.whenReady === "function") {
        MktoForms2.whenReady(onFormReady);
      } else {
        setTimeout(waitForMktoForms2, 10);
      }
    };

    waitForMktoForms2();
  };
}

// ##
// ##

// ##
// ##
