// <![CDATA[
// ##
// ## Updated 20240117T235503
// ##
// ##
// ##
// ## Field Preferences
// ##
// ##

if (typeof field_pref != "function" && typeof form_dynamics == "undefined") {
  mkf_c.log("Field Preferences - Begin");

  function field_pref() {
    mkf_c.log("Field Preferences - Triggered");
    const fieldMap = {};
    if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
      for (var key in window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
        if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping.hasOwnProperty(key)) {
          fieldMap[key.toLowerCase()] =
            window?.mcz_marketoForm_pref?.value_setup?.field_mapping[key];
        }
      }
    }
    const field_dependance = {};
    if (window?.mcz_marketoForm_pref?.value_setup?.field_dependance) {
      for (var key in window?.mcz_marketoForm_pref?.value_setup?.field_dependance) {
        if (window?.mcz_marketoForm_pref?.value_setup?.field_dependance.hasOwnProperty(key)) {
          field_dependance[key.toLowerCase()] =
            window?.mcz_marketoForm_pref?.value_setup?.field_dependance[key];
        }
      }
    }
    //
    //
    //
    var lastFieldVisibility = "";
    var fieldVisibilityCheckInterval;
    var setRequired_set = {};

    const setRequired_attempts = 30;
    window.setRequired = function (fieldName, direction) {
      if (fieldName == "" || fieldName == null || fieldName == undefined) {
        // mkf_c.log("setRequired - fieldName is empty");
        return;
      }

      var field_active = false;
      let mktoFormRowInput = document.querySelector('[name="' + fieldName + '"]');
      if (mktoFormRowInput && mktoFormRowInput !== null) {
        field_active = true;
      } else {
        if (fieldMap[fieldName]) {
          fieldName = fieldMap[fieldName];
          mktoFormRowInput = document.querySelector('[name="' + fieldName + '"]');

          if (mktoFormRowInput && mktoFormRowInput !== null) {
            field_active = true;
          }
        }
      }

      if (setRequired_set[fieldName] === undefined) {
        setRequired_set[fieldName] = 0;
      }

      if (field_active) {
        setRequired_set[fieldName] = 0;
        let field = document.querySelector('[name="' + fieldName + '"]');
        if (direction == true) {
          field.classList.remove("mktoValid");
          field.classList.add("mktoRequired");
          field.classList.add("mkto_toggle");
          field.setAttribute("aria-required", "true");
          field.setAttribute("required", "true");
          if (field.placeholder && field.placeholder.indexOf("*") === -1) {
            field.placeholder = field.placeholder + "*";
          } else {
            let options = field.querySelectorAll("option[value='']");
            if (options && options.length > 0) {
              if (options[0].innerHTML.indexOf("*") === -1) {
                options[0].innerHTML = options[0].innerHTML + " *";
              }
            }
          }

          let row = field.closest(".mktoFormRow");
          if (row) {
            row.classList.add("mktoRequiredField");
          }
          let parent = field.closest(".mktoFieldWrap");
          if (parent) {
            parent.classList.add("mktoRequiredField");
          }
        } else {
          field.removeAttribute("required");
          field.classList.add("mktoValid");
          field.classList.remove("mktoRequired");
          field.classList.remove("mktoInvalid");
          field.classList.add("mkto_toggle");
          field.setAttribute("aria-invalid", "false");
          field.setAttribute("aria-required", "false");
          if (field.placeholder && field.placeholder.indexOf("*") !== -1) {
            field.placeholder = field.placeholder.replace("*", "");
          } else {
            let options = field.querySelectorAll("option[value='']");
            if (options && options.length > 0) {
              if (options[0].innerHTML.indexOf("*") > -1) {
                options[0].innerHTML = options[0].innerHTML.replace("*", "").trim();
              }
            }
          }
          let row = field.closest(".mktoFormRow");
          if (row) {
            row.classList.remove("mktoRequiredField");
          }
          let parent = field.closest(".mktoFieldWrap");
          if (parent) {
            parent.classList.remove("mktoRequiredField");
          }
        }

        setTimeout(function () {
          let row = field.closest(".mktoFormRow");
          if (row) {
            let mktoInstruction = row.querySelector(".mktoInstruction");
            if (mktoInstruction) {
              mktoInstruction.remove();
              if (field_dependance[fieldName.toLowerCase()]) {
                let fieldDependanceName = field_dependance[fieldName.toLowerCase()];
                let fieldDependanceElement = document.querySelector(
                  '.mktoFormRow [name="' + fieldDependanceName + '"]'
                );
                if (fieldDependanceElement) {
                  if (!fieldDependanceElement.classList.contains("mktoDependant")) {
                    fieldDependanceElement.classList.add("mktoDependant");
                    fieldDependanceElement.addEventListener("change", function () {
                      updateFieldPreferences();
                    });
                  }

                  let fieldDependanceParent = fieldDependanceElement.closest(
                    ".mktoFormRow:not(.mktoHidden)"
                  );
                  if (fieldDependanceParent) {
                    let event = new Event("change", { bubbles: true });
                    fieldDependanceElement.dispatchEvent(event);
                    for (let i = 0; i < 10; i++) {
                      setTimeout(function () {
                        fieldDependanceElement.dispatchEvent(event);
                      }, 100 * i);
                    }
                  }
                }
              }
            }
          }
        }, 20);
      } else {
        setRequired_set[fieldName] = setRequired_set[fieldName] + 1;
        if (setRequired_set[fieldName] < setRequired_attempts) {
          setTimeout(function () {
            setRequired(fieldName, direction);
          }, 30);
        } else {
          //mkf_c.log(`setRequired - [${fieldName}] found after ${setRequired_set[fieldName]} attempts.`)
        }
      }
    }

    function updateFieldPreferences() {
      let mktoFieldPreferences = document.querySelector(
        '.mktoFormRow [name="__mktoFieldPreferences"]'
      );
      let fieldNames = [];
      for (var key in window?.mcz_marketoForm_pref?.field_visibility) {
        if (window?.mcz_marketoForm_pref?.field_visibility.hasOwnProperty(key)) {
          fieldNames.push(key);
        }
      }
      var newFieldPreferences = "";
      if (fieldNames.length > 0) {
        for (var i = 0; i < fieldNames.length; i++) {
          let checkDL = window?.mcz_marketoForm_pref?.field_visibility;
          if (checkDL && window?.mcz_marketoForm_pref?.field_visibility?.[fieldNames[i]]) {
            let setting = window?.mcz_marketoForm_pref?.field_visibility?.[fieldNames[i]];
            setting = setting.toLowerCase();
            if (setting === "visible" || setting === "show" || setting === "all") {
              newFieldPreferences += fieldNames[i] + "#";
              setRequired(fieldNames[i], false);
            } else if (setting === "required") {
              newFieldPreferences += fieldNames[i] + "-required#";
              setRequired(fieldNames[i], true);
            }
          }
        }
        mktoFieldPreferences.value = newFieldPreferences;
        let event = new Event("change", { bubbles: true });
        mktoFieldPreferences.dispatchEvent(event);
        for (let i = 0; i < 10; i++) {
          setTimeout(function () {
            mktoFieldPreferences.dispatchEvent(event);
          }, 100 * i);
        }
      } else {
        setTimeout(updateFieldPreferences, 25);
      }
    }

    function checkDataLayer() {
      let marketoConfigExists = document.querySelector(".marketo-config") !== null;
      if (!marketoConfigExists && fieldVisibilityCheckInterval) {
        clearInterval(fieldVisibilityCheckInterval);
        mkf_c.log("Marketo Config Interface no longer exists. Stopping field visibility check.");
        return;
      }
      let fieldVisibility = window?.mcz_marketoForm_pref?.field_visibility;
      if (fieldVisibility) {
        let currentFieldVisibility = JSON.stringify(fieldVisibility);
        if (currentFieldVisibility !== lastFieldVisibility) {
          lastFieldVisibility = currentFieldVisibility;
          updateFieldPreferences();
        }
      }
    }

    async function fieldPrefs_wait_fieldPreferences() {
      let formObservMKTO = false;
      let sessionAttributesQS_fld = document.querySelector('[name="sessionAttributesQS"]');
      if (document.querySelectorAll(".observMKTO").length > 0) {
        if (sessionAttributesQS_fld != null) {
          formObservMKTO = true;
        }
      }
      if (formObservMKTO) {
        sessionAttributesQS_fld.name = "__mktoFieldPreferences";
        sessionAttributesQS_fld.id = "__mktoFieldPreferences";
        setTimeout(updateFieldPreferences, 25);

        if (document.querySelector(".marketo-config")) {
          mkf_c.log("Marketo Config Interface Found");
          fieldVisibilityCheckInterval = setInterval(checkDataLayer, 500);
        }
      } else {
        if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
          //mkf_c.log("Known Visitor - fieldPrefs_wait_fieldPreferences");
        } else {
          setTimeout(fieldPrefs_wait_fieldPreferences, 20);
        }
      }
    }

    fieldPrefs_wait_fieldPreferences();
  }
  mkf_c.log("Field Preferences - End");
}

// ##
// ##
// ]]>