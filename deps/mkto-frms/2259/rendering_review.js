// <![CDATA[
// ##
// ## Updated 20230829T233059
// ##
// ##
// ##
// ## Rendering Review
// ##
// ##
if (typeof getMktoFormID1 != "function") {
  console.log("Rendering Review - Loaded");
  function getMktoFormID1() {
    let mktoForm = document.querySelector("form.mktoForm");
    if (mktoForm) {
      let formId = document.querySelector("form.mktoForm")
        ? document.querySelector("form.mktoForm").id
        : null;
      formId = formId.replace("mktoForm_", "");
      formId = parseInt(formId);
      if (formId) {
        return formId;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  var translations_ready1 = false;
  var translations_added1 = false;
  async function wait_whenReady() {
    if (!translations_ready1) {
      if (typeof MktoForms2 == "object") {
        let formId = getMktoFormID1();
        if (formId) {
          if (
            typeof MktoForms2.getForm == "function" &&
            typeof MktoForms2.whenReady == "function"
          ) {
            let form = MktoForms2.getForm(formId);
            if (form) {
              translations_ready1 = true;

              MktoForms2.whenReady(function (form) {
                var this_form = "mktoForm_" + form.getId();
                var this_form_elem = document.getElementById(this_form);
                if (this_form_elem) {
                  setTimeout(function () {
                    this_form_elem.classList.add("mktoWhenRendered");
                  }, 10);
                }
              });
            } else {
              setTimeout(wait_whenReady, 10);
            }
          } else {
            setTimeout(wait_whenReady, 10);
          }
        } else {
          setTimeout(wait_whenReady, 10);
        }
      } else {
        setTimeout(wait_whenReady, 10);
      }
    }
  }

  setTimeout(wait_whenReady, 10);
}

// ##
// ##
// ]]>