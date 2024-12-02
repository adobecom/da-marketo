// ##
// ## Updated 20240715T190611
// ##
// ##
// ##
// ## Cleaning and Validation
// ##

var rendering_ready = false;
if (typeof cleaning_validation != "function" && typeof form_dynamics !== "undefined") {
  function cleaning_validation() {
    mkf_c.log("Cleaning & Validation - Loaded");

    var firstrun = true;

    var lbl_rendering = {
      temp: "temp",
    };

    async function mkto_addCSS(mktoForm) {
      if (!mktoForm.classList.contains("mktoForm--styles-added")) {
        const baseCss = `
        .starting_fieldset fieldset{
            opacity: 0;
            visibility: hidden;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        form.mktoForm {
            display: none;
        }
        form.mktoForm.mktoForm--fade-in {
            display: block;
        }
        .mktoForm--fade-in fieldset{
            opacity: 1;
            visibility: visible;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        .mktoHidden,
        .mktoFormRow .mktoClear,
        .mktoFormRow .mktoError,
        .mktoFormRow .mktoInstruction,
        .mktoFormRow .mktoOffset,
        .mktoFormRow .mktoOffset,
        .mktoFormRow legend,
        .mktoFormRow label:empty {
            display: none !important;
        }
        .mktoForm #db_data_container{
            display: none !important;
        }
        .mktoFormRow > fieldset > 
        .mktoFormRow > .mktoPlaceholder:empty{
            display: none;
        }
        .mktoFormRow fieldset { 
            padding: 0
        }
        .mktoFormRow {
            height: auto;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        form.mktoForm--fade-in {
            visibility: hidden;
            opacity: 0;
        }
        form.mktoForm--fade-in.mktoVisible {
            visibility: visible;
            opacity: 1;
            height: auto;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        .mktoForm--fade-in .mktoFieldDescriptor {
            visibility: hidden;
            opacity: 0;
            height: 0;
        }
        .mktoForm--fade-in .mktoFieldDescriptor.mktoVisible:not([style]) {
            visibility: visible;
            opacity: 1;
            height: auto;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }            
        div[data-mktofield="mktoQuestionComments"] fieldset {
            width: 100% !important;
        }
        .mktoForm-wrap {
            position: relative;
            width: 100%;
            height: 100%;
            z-index: 1;
            display: block;
            text-align: center;
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        .ty-message {
            padding: 20px;
            opacity: 0; /* on submit */
            visibility: hidden; /* on submit */
            -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
            transition: opacity 0.1s ease-in, height 0.1s ease-in;
        }
        .mktoNotYou{
            cursor: pointer;
        }    
        .mktoForm--fade-in fieldset.mktoFormCol {
            display: none;
        }
        .mktoForm--fade-in fieldset.mktoFormCol.mktoVisible {
            display: block;
        }
        .mktoForm--fade-in .mktoHtmlText[style] {
            opacity: 0;
            visibility: hidden;
            -webkit-transition: opacity 0.1s ease-in, height 0.3s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.3s ease-in;
            transition: opacity 0.1s ease-in, height 0.3s ease-in;
        }
        .mktoForm--fade-in .mktoHtmlText:not([style]) {
            opacity: 1;
            visibility: visible;
            -webkit-transition: opacity 0.1s ease-in, height 0.3s ease-in;
            -moz-transition: opacity 0.1s ease-in, height 0.3s ease-in;
            transition: opacity 0.1s ease-in, height 0.3s ease-in;
        }   

        form.mktoForm {
            max-height: 0;
            overflow: hidden;
            -webkit-transition: max-height 1s ease-in;
            -moz-transition: max-height 1s ease-in;
            transition: max-height 1s ease-in;
        }
            
        form.mktoForm.mktoVisible {
            max-height: 10000px;
            overflow: visible;
        }
        `;

        let head = document.head || document.getElementsByTagName("head")[0];
        let style = document.createElement("style");
        head.appendChild(style);
        style.appendChild(document.createTextNode(baseCss));

        mktoForm.classList.add("mktoForm--styles-added");
      }
    }

    function makeHidden(fieldname, shouldHide = true) {
      {
        const fieldMap = {};
        if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
          for (var key in window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
            if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping.hasOwnProperty(key)) {
              fieldMap[key.toLowerCase()] =
                window?.mcz_marketoForm_pref?.value_setup?.field_mapping[key];
            }
          }
        }

        let setting = "" + window?.mcz_marketoForm_pref?.field_visibility?.[fieldname];
        if (setting === "hidden" && shouldHide === false) {
          mkf_c.log("Field is set to be hidden in mcz_marketoForm_pref, cannot be shown");
          shouldHide = true;
        }

        let shouldbeRequired = false;
        if (setting === "required") {
          shouldbeRequired = true;
        } else {
          shouldbeRequired = false;
        }

        if (fieldMap[fieldname]) {
          fieldname = fieldMap[fieldname];
        }

        let field = document.querySelector(`[name="${fieldname}"]`);
        if (field) {
          let parentRow = field.parentNode;
          let veryTop = null;
          let localRow = null;

          while (parentRow != null) {
            if (parentRow && parentRow.classList && parentRow.classList.contains("mktoFormRow")) {
              veryTop = parentRow;
              if (localRow == null) {
                localRow = parentRow;
              }
            }
            parentRow = parentRow.parentNode;
          }

          if (shouldHide) {
            if (veryTop) {
              veryTop.classList.add("mktoHidden");
            }
            localRow.classList.add("mktoHidden");
            setRequired(fieldname, false);
          } else {
            if (veryTop) {
              veryTop.classList.remove("mktoHidden");
            }
            localRow.classList.remove("mktoHidden");
            if (shouldbeRequired) {
              setRequired(fieldname, true);
            } else {
              setRequired(fieldname, false);
            }
          }
        }
      }
    }

    function translateDDlbls(dropdownName, translateValues) {
      let dropdownField = document.querySelector(`select[name="${dropdownName}"]:not(.translated)`);

      if (dropdownField) {
        let optionsArray = Array.from(dropdownField.options);
        let optionsWithValues = optionsArray.filter((option) => option.value !== "");

        if (optionsWithValues.length === 0) {
          mkf_c.log("No options with values found for " + dropdownName + " hiding field");
          makeHidden(dropdownName, true);
          dropdownField.classList.add("translated");
          return;
        } else {
          makeHidden(dropdownName, false);
        }

        if (
          translateValues === null ||
          translateValues === undefined ||
          Object.keys(translateValues).length === 0
        ) {
          dropdownField.classList.add("translated");
          return;
        }

        dropdownField.classList.add("translated");

        if (translateFormElems.hasOwnProperty(dropdownName.toLowerCase())) {
          let language = mcz_marketoForm_pref?.profile?.prefLanguage;
          if (language && language.length > 0) {
            language = language.toLowerCase();
            language = language.replace("-", "_");
          } else {
            language = "en_us";
          }
          if (language) {
            let translatedElem = translateFormElems[dropdownName.toLowerCase()][language];
            if (translatedElem) {
              let label = document.querySelector('label[for="' + dropdownName + '"]');
              if (label) {
                let required = false;
                let originalElemTxt = label.innerText;
                originalElemTxt = originalElemTxt.trim();
                translatedElem = translatedElem.replace(":", "").trim();
                label.innerHTML = translatedElem;

                if (originalElemTxt.indexOf("*") > -1) {
                  originalElemTxt = originalElemTxt.replace(/\*/g, "");
                  translatedElem = translatedElem + "*";
                  required = true;
                }
                let options = dropdownField.querySelectorAll("option");
                for (let i = 0; i < options.length; i++) {
                  let option = options[i];
                  if (
                    option.text.toLowerCase().replace(/\*/g, "").trim() ===
                    translatedElem.toLowerCase().replace(/\*/g, "").trim()
                  ) {
                    option.setAttribute("data-original-label", option.text);
                    option.text = translatedElem;
                  }
                }
              }
            }
          }
        }

        let unsortedOptions = [];
        let selectedValue = dropdownField.value;
        let select_lbloption;

        optionsArray = optionsArray.filter((option) => {
          if (translateValues.hasOwnProperty(option.value)) {
            if (!option.getAttribute("data-original-label")) {
              option.setAttribute("data-original-label", option.text);
            }
            option.text = translateValues[option.value];
            return true;
          } else if (option.value === "" || option.value === "_" || option?.value === null) {
            select_lbloption = option;
            return false;
          } else {
            unsortedOptions.push(option);
            return false;
          }
        });

        if (!select_lbloption) {
          select_lbloption = document.createElement("option");
          select_lbloption.value = "";
          let label = document.querySelector('label[for="' + dropdownName + '"]');

          if (label) {
            select_lbloption.text = label.innerText;
          } else {
            select_lbloption.text = "Select";
          }
          dropdownField.add(select_lbloption);
        }

        optionsArray = optionsArray.concat(unsortedOptions);

        optionsArray.sort((a, b) => {
          let aText = a.text.toLowerCase();
          let bText = b.text.toLowerCase();
          if (aText < bText) {
            return -1;
          }
          if (aText > bText) {
            return 1;
          }
          return 0;
        });

        if (select_lbloption) {
          optionsArray.unshift(select_lbloption);
        }

        dropdownField.innerHTML = "";

        optionsArray.forEach((option) => {
          dropdownField.add(option);
        });

        dropdownField.value = selectedValue;
      }
    }

    var normalizeMktoStyles_run = 0;
    function normalizeMktoStyles() {
      normalizeMktoStyles_run += 1;

      let mktoForm = document.querySelector(".mktoForm[id]");

      let mktoFormElements = mktoForm.querySelectorAll("[style]:not(.mktoCleaned)");
      if (mktoFormElements.length > 0) {
        for (var i = 0; i < mktoFormElements.length; i++) {
          let mktoFormElement = mktoFormElements[i];
          if (mktoFormElement.hasAttribute("style")) {
            mktoFormElement.classList.add("mktoVisible");
            mktoFormElement.removeAttribute("style");
          }
          mktoFormElement.classList.remove("mktoHasWidth");
        }
      }

      let mktoAsterix = mktoForm.querySelectorAll(".mktoAsterix");
      if (mktoAsterix.length > 0) {
        for (var i = 0; i < mktoAsterix.length; i++) {
          let mktoAsterixElement = mktoAsterix[i];
          mktoAsterixElement.parentNode.removeChild(mktoAsterixElement);
        }
      }

      let mktoFields = mktoForm.querySelectorAll(".mktoField[name]:not(.mktofield_anchor)");
      if (mktoFields.length > 0) {
        for (var i = 0; i < mktoFields.length; i++) {
          let mktoField = mktoFields[i];
          if (
            document.querySelector(
              `.mktoFormRow[data-mktofield="${mktoField.getAttribute("name")}"]`
            ) == null
          ) {
            let mktoFieldParent = mktoField.parentNode;
            while (mktoFieldParent != null) {
              if (
                mktoFieldParent.classList &&
                mktoFieldParent.classList.contains("mktoFormRow") &&
                !mktoFieldParent.hasAttribute("data-mktofield")
              ) {
                mktoField.classList.add("mktofield_anchor");
                mktoFieldParent.setAttribute("data-mktofield", mktoField.getAttribute("name"));
                break;
              }
              mktoFieldParent = mktoFieldParent.parentNode;
            }
          }
        }
      }

      let privacyRows = mktoForm.querySelectorAll(".mktoFormRowTop:not(.adobe-privacy)");
      for (var i = 0; i < privacyRows.length; i++) {
        let privacyRow = privacyRows[i];
        if (privacyRow.querySelector('[class*="adobe-privacy"]')) {
          privacyRow.classList.add("adobe-privacy");
        }
      }

      mkt_optionals(mktoForm);

      let mktoFormRowTops = mktoForm.querySelectorAll(".mktoFormRow:not(.mktoFormRowTop)");
      if (mktoFormRowTops.length > 0) {
        for (var i = 0; i < mktoFormRowTops.length; i++) {
          let mktoFormRowTop = mktoFormRowTops[i];
          if (mktoFormRowTop.parentNode.classList.contains("mktoForm")) {
            mktoFormRowTop.classList.add("mktoFormRowTop");
          }
        }
      }

      let mktoFormRows = document.querySelectorAll(".mktoFormRow:not([data-mktofield])");
      if (mktoFormRows.length > 0) {
        for (var i = 0; i < mktoFormRows.length; i++) {
          let mktoFormRow = mktoFormRows[i];
          let mktoFormRowChild = mktoFormRow.querySelector(".mktoFormRow:not(.mktoFormRowTop)");
          if (mktoFormRow.parentNode.classList.contains("mktoForm")) {
            mktoFormRow.classList.add("mktoFormRowTop");
            let mktoPlaceholderHtmlText = mktoFormRow.querySelector(
              "[class*='mktoPlaceholderHtmlText']"
            );
            if (mktoPlaceholderHtmlText) {
              mktoFormRow.classList.add("mktoHtmlText");
            }
          }
          if (mktoFormRowChild == null) {
            if (!mktoFormRow.hasAttribute("data-mktofield")) {
              let mktoField = mktoFormRow.querySelector(".mktoField");
              if (mktoField && mktoField.length == 1) {
                mktoFormRow.setAttribute("data-mktofield", mktoField.getAttribute("name"));
                let mktoFieldDescriptor = mktoFormRow.querySelector(".mktoFieldDescriptor");
                if (mktoFieldDescriptor) {
                  mktoFieldDescriptor.setAttribute(
                    "data-mktofield",
                    mktoField.getAttribute("name")
                  );
                  let mktoFieldDescriptorLabel = mktoFieldDescriptor.querySelector(
                    "label[for='" + mktoField.getAttribute("name") + "']"
                  );
                  if (mktoFieldDescriptorLabel) {
                    let lblText = mktoFieldDescriptorLabel.innerText
                      .replace(/\*/g, "")
                      .replace(":", "")
                      .toLowerCase();
                    let primaryRow = mktoFormRow;
                    let mktoFormRowParent = mktoFormRow.parentNode;
                    while (mktoFormRowParent != null) {
                      if (
                        mktoFormRowParent.classList &&
                        mktoFormRowParent.classList.contains("mktoFormRow") &&
                        !mktoFormRowParent.hasAttribute("data-mktofield")
                      ) {
                        primaryRow = mktoFormRowParent;
                      }
                      mktoFormRowParent = mktoFormRowParent.parentNode;
                    }
                    primaryRow.setAttribute("data-mktofield", mktoField.getAttribute("name"));
                    primaryRow.setAttribute("data-mktolbl", lblText);
                  }
                  mktoFieldDescriptor.classList.add("mktoVisible");
                  normalizeMktoStyles_pass_descriptor += 1;
                }
              }
            }

            let mktoFormRowScript = mktoFormRow.querySelector("script:not(.mktoCleanedScript)");
            if (mktoFormRowScript != null) {
              mktoFormRow.classList.add("mktoHidden");
              mktoFormRow.classList.add("mktoCleanedScript");
              normalizeMktoStyles_pass_scripts += 1;
            }
          }

          let RuleLegend_try = 0;
          let handleFieldRuleLegend_max = 30;
          function handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset) {
            mktoFormRow.classList.add("mktoHidden");
            mktoFormRow.classList.add("mktoFieldRuleLegend");
            mktoFormRowLegend.classList.add("mktoRuleLegend");

            const mktoHtmlTexts = mktoFieldset.querySelectorAll(".mktoHtmlText:not(.mktoHidden)");

            mktoHtmlTexts.forEach((textElem, index) => {
              let mktohandleFieldRuleLegend = mktoFormRowLegend.querySelector(
                ".mktohandleFieldRuleLegend"
              );

              if (index !== 0) {
                return;
              }

              if (!mktohandleFieldRuleLegend) {
                mktohandleFieldRuleLegend = document.createElement("span");
                mktohandleFieldRuleLegend.classList.add("mktohandleFieldRuleLegend");
                mktoFormRowLegend.appendChild(mktohandleFieldRuleLegend);
              } else {
                return;
              }

              let reference = textElem.innerText.toLowerCase().split("field_rule")[1].trim();

              let [fieldname, valueset] = mktoFormRowLegend.innerText
                .trim()
                .split("=")
                .map((str) => str.trim());
              if (!fieldname || !valueset) return;

              let mktoSelect = mktoForm.querySelector(`select[name='${fieldname}']`);
              let mktoSelect_option = mktoForm.querySelector(`select[name='${fieldname}'] option`);
              if (!mktoSelect || !mktoSelect_option) {
                RuleLegend_try += 1;
                if (RuleLegend_try < handleFieldRuleLegend_max) {
                  setTimeout(function () {
                    handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset);
                  }, 25);
                  return;
                } else {
                  mkf_c.log(
                    "handleFieldRuleLegend >> fieldname not found after " +
                      RuleLegend_try +
                      " attempts."
                  );
                  return;
                }
              }

              valueset = valueset.toLowerCase();

              if (typeof setRequired != "function") {
                return;
              }

              let mktoFormRowTop = mktoForm.querySelector(
                `.mktoFormRowTop[data-handleFieldRuleLegend='${fieldname}']`
              );
              if (mktoFormRowTop == null) {
                mktoFormRowTop = mktoSelect.closest(
                  ".mktoFormRowTop:not(.mktohandleFieldRuleLegend)"
                );
              }
              if (mktoFormRowTop == null) {
                return;
              }

              mktoFormRowTop.setAttribute("data-handleFieldRuleLegend", fieldname);
              mktohandleFieldRuleLegend.setAttribute("data-handleFieldRuleLegend", fieldname);

              if (valueset === "none") {
                setRequired(fieldname, false);

                if (mktoFormRowTop) {
                  let mktoFieldDescriptor = mktoFormRowTop.querySelectorAll(".mktoFieldDescriptor");
                  if (mktoFieldDescriptor) {
                    mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                      mktoFieldDescriptor.classList.add("mktoFieldDescriptor__hidden");
                      mktoFieldDescriptor.classList.remove("mktoFieldDescriptor");
                    });
                  }
                  mktoFormRowTop.classList.add("mktoHidden", "mktohandleFieldRuleLegend");
                }
                return;
              }

              let starting_option = [];
              let newOptions = [];
              let other_option = [];
              if (
                mktoFormRowTop &&
                mktoFormRowTop.classList.contains("mktohandleFieldRuleLegend")
              ) {
                setRequired(fieldname, true);

                let mktoFieldDescriptor = mktoFormRowTop.querySelectorAll(
                  ".mktoFieldDescriptor__hidden"
                );
                if (mktoFieldDescriptor) {
                  mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                    mktoFieldDescriptor.classList.add("mktoFieldDescriptor");
                    mktoFieldDescriptor.classList.remove("mktoFieldDescriptor__hidden");
                  });
                }

                mktoFormRowTop.classList.remove("mktoHidden", "mktohandleFieldRuleLegend");
              }

              if (mktoFormRowTop) {
                setTimeout(() => {
                  let mktoFieldplaceHolder = mktoFormRowTop.querySelectorAll(
                    "select.mktoUpdated, input.mktoUpdated, textarea.mktoUpdated"
                  );
                  if (mktoFieldplaceHolder) {
                    mktoFieldplaceHolder.forEach((mktoFieldplaceHolder) => {
                      mktoFieldplaceHolder.classList.remove("mktoUpdated");
                    });
                  }
                }, 100);
              }

              if (valueset === "all") {
                //lets clean the select
                let empty_option = mktoSelect.querySelector("option[value='']");
                if (empty_option) {
                  mktoSelect.removeChild(empty_option);
                  mktoSelect.prepend(empty_option);
                }
                other_option = mktoSelect.querySelector(
                  "option[value='other'], option[value='Other'], option[value='OTHER']"
                );
                if (other_option) {
                  mktoSelect.removeChild(other_option);
                  mktoSelect.appendChild(other_option);
                }
                return;
              }

              let mktoSelectClone = document.querySelector(`select[name='${fieldname}_clone']`);
              if (!mktoSelectClone) {
                mktoSelectClone = mktoSelect.cloneNode(true);
                mktoSelectClone.style = "display:none;position:absolute;top:-1000px;left:-1000px;";
                for (var i = mktoSelectClone.attributes.length - 1; i >= 0; i--) {
                  let attribute = mktoSelectClone.attributes[i];
                  if (
                    attribute.name !== "name" &&
                    attribute.name !== "id" &&
                    attribute.name !== "style"
                  ) {
                    mktoSelectClone.removeAttribute(attribute.name);
                  }
                }
                mktoSelectClone.id = `${mktoSelect.getAttribute("name")}_clone`;
                mktoSelectClone.name = `${mktoSelect.getAttribute("name")}_clone`;
                mktoForm.parentNode.insertBefore(mktoSelectClone, mktoForm.nextSibling);
              }

              var valuesetArray = valueset.split("|");
              var valuesetArray1 = [];
              var valuesetArray2 = [];
              valuesetArray.forEach((value) => {
                if (value.includes(":")) {
                  let valueArray = value.split(":");
                  if (valueArray.length > 1) {
                    if (valueArray[0] === "1") {
                      valuesetArray1.push(valueArray[1].trim().toLowerCase());
                    }
                    if (valueArray[0] === "2") {
                      valuesetArray2.push(valueArray[1].trim().toLowerCase());
                    }
                  }
                }else{
                  valuesetArray1.push(value.trim().toLowerCase());
                }
              });

              function addOption(option) {
                if (option) {
                  let optionValue = option.value;
                  if (
                    optionValue.trim().toLowerCase() === "" ||
                    optionValue === null ||
                    optionValue === "_"
                  ) {
                    starting_option.push(option);
                  } else if (optionValue.trim().toLowerCase() === "other") {
                    other_option.push(option);
                  } else {
                    newOptions.push(option);
                  }
                }
              }

              var seenOptions = [];
              var observedOptions = [];
              var backValue =
                mktoSelect.selectedIndex > -1
                  ? mktoSelect.options[mktoSelect.selectedIndex].value
                  : "";

              mktoSelectClone.querySelectorAll("option").forEach((option) => {
                let optionValue = option.value.toLowerCase().trim();
                let optionValueText = option.innerText.toLowerCase().trim();
                let combinedValue = optionValue + ":" + optionValueText;

                if (optionValue === "" || optionValue === null || optionValue === "_") {
                  addOption(option.cloneNode(true));
                } else if (
                  reference === "keep" &&
                  valuesetArray1.includes(optionValue) &&
                  !seenOptions.includes(optionValue)
                ) {
                  if (!observedOptions.includes(combinedValue)) {
                    addOption(option.cloneNode(true));
                    observedOptions.push(combinedValue);
                  }
                } else if (
                  reference === "keep" &&
                  valuesetArray2.includes(optionValue) &&
                  seenOptions.includes(optionValue)
                ) {
                  if (!observedOptions.includes(combinedValue)) {
                    addOption(option.cloneNode(true));
                    observedOptions.push(combinedValue);
                  }
                } else if (reference === "hide" && valuesetArray.includes(optionValue)) {
                } else {
                  // do nothing
                }

                seenOptions.push(optionValue);
              });

              newOptions.sort((a, b) => {
                let aText = a.innerText.toLowerCase();
                let bText = b.innerText.toLowerCase();

                if (aText < bText) {
                  return -1;
                }
                if (aText > bText) {
                  return 1;
                }
                return 0;
              });
              newOptions = starting_option.concat(newOptions);
              newOptions = newOptions.concat(other_option);

              if (newOptions.length) {
                newOptions.forEach((option) => {
                  let optionValue = option.value.toLowerCase();
                  let mktoSelect_option = mktoSelect.querySelector(
                    `option[value='${optionValue}']`
                  );
                  if (mktoSelect_option) {
                    option.innerText = mktoSelect_option.innerText;
                  }
                });
                mktoSelect.innerHTML = "";
                newOptions.forEach((option) => {
                  mktoSelect.add(option);
                });

                let mktoSelect_option = mktoSelect.querySelector(`option[value='${backValue}']`);
                if (mktoSelect_option) {
                  mktoSelect.selectedIndex = mktoSelect_option.index;
                } else {
                  mktoSelect.selectedIndex = 0;
                }
                let empty_option = mktoSelect.querySelector("option[value='']");
                if (empty_option) {
                  mktoSelect.removeChild(empty_option);
                  mktoSelect.prepend(empty_option);
                }
                other_option = mktoSelect.querySelector(
                  "option[value='other'], option[value='Other'], option[value='OTHER']"
                );
                if (other_option) {
                  mktoSelect.removeChild(other_option);
                  mktoSelect.appendChild(other_option);
                }
              } else {
                setRequired(fieldname, false);
                if (mktoFormRowTop) {
                  let mktoFieldDescriptor = mktoFormRowTop.querySelectorAll(".mktoFieldDescriptor");
                  if (mktoFieldDescriptor) {
                    mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                      mktoFieldDescriptor.classList.add("mktoFieldDescriptor__hidden");
                      mktoFieldDescriptor.classList.remove("mktoFieldDescriptor");
                    });
                  }
                  mktoFormRowTop.classList.add("mktoHidden", "mktohandleFieldRuleLegend");
                }
              }

              // textElem.innerHTML = "passed: " + reference.trim();
            });
          }

          function handleFieldsetLabelLegend(mktoFormRowLegend, mktoFormRow, mktoFieldset) {
            const mktoHtmlTexts = mktoFieldset.querySelectorAll(".mktoHtmlText");
            let rulefound = false;
            mktoHtmlTexts.forEach((textElem, index) => {
              if (textElem.innerText.trim().length > 0 && !rulefound) {
                rulefound = true;
                let reference = textElem.innerText.toLowerCase().split("fieldset_label")[1];
                //mkf_c.log(reference);
                let legendClassName = reference.split("rule:")[0];
                legendClassName = legendClassName.replace(/[^a-z0-9-]/gi, "");
                legendClassName = legendClassName.substring(0, 20);
                mktoFormRow.setAttribute("data-mkto_vis_src", legendClassName);
                mktoFormRow.classList.add("htmlRow");
                let mktoFormRowLegend_html = mktoFormRowLegend?.innerHTML || "";
                const regex = /__([a-zA-Z0-9]+)__/g;
                mktoFormRowLegend_html = mktoFormRowLegend_html.replace(
                  regex,
                  function (match, fieldName) {
                    let tentativeValue = "";
                    const fieldElement = document.querySelector(
                      `.mktoFormRow [name="${fieldName}"]`
                    );

                    if (fieldElement) {
                      tentativeValue = fieldElement.value || "";
                    }
                    if (tentativeValue.trim().length === 0) {
                      const fieldMappingToDL =
                        window?.mcz_marketoForm_pref?.value_setup?.field_mapping_dl || {};
                      if (fieldMappingToDL.hasOwnProperty(fieldName)) {
                        let tentativeValueLocation = fieldMappingToDL[fieldName].trim();
                        if (tentativeValueLocation.length > 0) {
                          const tentativeValueLocationArray = tentativeValueLocation.split(".");
                          let tentativeValueLocationObj = window?.mcz_marketoForm_pref;
                          for (const key of tentativeValueLocationArray) {
                            if (
                              tentativeValueLocationObj &&
                              tentativeValueLocationObj.hasOwnProperty(key)
                            ) {
                              tentativeValueLocationObj = tentativeValueLocationObj[key];
                            }
                          }
                          if (tentativeValueLocationObj) {
                            tentativeValue = tentativeValueLocationObj;
                          }
                        }
                      }
                    }
                    tentativeValue = tentativeValue.trim();
                    if (tentativeValue == "") {
                      mkf_c.log("Partner not found.");
                    }
                    tentativeValue = tentativeValue.replace(/\s\s+/g, " ");
                    return tentativeValue;
                  }
                );
                textElem.innerHTML = mktoFormRowLegend_html;
                if (reference.split("rule:").length > 1) {
                  reference = reference.split("rule:")[1];
                  //mktoFormRowLegend.innerText = reference;
                }
              } else {
                textElem.classList.add("mktoHidden");
              }
            });
          }

          function handleHiddenLegend(mktoFormRowLegend, mktoFormRow) {
            mktoFormRowLegend.classList.add("mktoCleanedlegend");
            mktoFormRow.classList.add("mktoCleaned", "mktoHidden");
            mktoFormRow.classList.add("mktoHiddenLegend");
            let legendClassName = mktoFormRowLegend.innerText.split("-");
            if (legendClassName.length > 1) {
              legendClassName = legendClassName[1];
              legendClassName = legendClassName.toLowerCase().replace(/[^a-z0-9-]/gi, "");
              legendClassName = legendClassName.substring(0, 20);
              mktoFormRow.setAttribute("data-mkto_vis_src", legendClassName);
            }
          }

          function handleSetupLegend(mktoFormRowLegend, mktoFormRow) {
            mktoFormRowLegend.classList.add("mktoCleanedlegend");
            mktoFormRow.classList.add("mktoCleaned", "mktoHidden");
            mktoFormRow.classList.add("mktoSetupLegend");

            let legendClassName = mktoFormRowLegend.innerText.split("-");
            if (legendClassName.length > 1) {
              legendClassName = legendClassName[1];
              legendClassName = legendClassName.toLowerCase().replace(/[^a-z0-9-]/gi, "");
              legendClassName = legendClassName.substring(0, 20);
              mktoFormRow.setAttribute("data-mkto_vis_src", legendClassName);
            }

            const mktoLogicalFields = mktoFormRow.querySelectorAll(".mktoLogicalField");
            mktoLogicalFields.forEach((logicalField) => {
              logicalField.parentNode.removeChild(logicalField);
            });
          }

          function handleOtherLegends(mktoFormRowLegend, mktoFormRow) {
            let otherClass = mktoFormRowLegend.innerText.toLowerCase().trim().replace(" ", "-");
            otherClass = otherClass.replace(/[^a-z0-9-]/gi, "");
            if (otherClass.length > 0) {
              otherClass = otherClass.substring(0, 20);
              mktoFormRowLegend.classList.add(otherClass);
              mktoFormRow.classList.add("mktoCleaned");
              mktoFormRow.classList.add(otherClass);
              mktoFormRow.setAttribute("data-mkto_vis_src", otherClass);
            }
          }

          const mktoFormRowLegends = mktoFormRow.querySelectorAll("legend:not(.mktoCleanedlegend)");
          if (mktoFormRowLegends.length) {
            mktoFormRowLegends.forEach((mktoFormRowLegend) => {
              const mktoFieldset = mktoFormRowLegend.closest("fieldset");
              const mktoHtmlText = mktoFieldset.querySelector(".mktoHtmlText");
              const innerTextLower = mktoFormRowLegend.innerText.toLowerCase();

              if (mktoHtmlText && mktoHtmlText.innerText.toLowerCase().includes("privacy")) {
                mktoFormRow.classList.add("adobe-privacy");
              }

              if (mktoHtmlText && mktoHtmlText.innerText.toLowerCase().includes("field_rule")) {
                handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset);
              } else if (
                mktoHtmlText &&
                mktoHtmlText.innerText.toLowerCase().includes("fieldset_label")
              ) {
                handleFieldsetLabelLegend(mktoFormRowLegend, mktoFormRow, mktoFieldset);
              } else if (innerTextLower.includes("hidden")) {
                handleHiddenLegend(mktoFormRowLegend, mktoFormRow);
              } else if (innerTextLower.includes("setup")) {
                handleSetupLegend(mktoFormRowLegend, mktoFormRow);
              } else {
                handleOtherLegends(mktoFormRowLegend, mktoFormRow);
              }

              mktoFormRowLegend.classList.add("mktoLegend");
            });
          }
        }
      }

      translateDDlbls("State", translateState);
      updateLabels();
      addPOIListeners();
      updatePlaceholders();

      if (mktoForm.classList.contains("validationActive")) {
        checkFormMsgs_throttle();
      }

      if (!mktoForm.classList.contains("mktoVisible") && firstrun === false) {
        //
        // Focus Logic for first interactions
        //

        let mktoFormCol_vis = mktoForm.querySelectorAll(
          ".mktoCleaned[data-mkto_vis_src] fieldset.mktoFormCol.mktoVisible"
        );
        for (let i = 0; i < mktoFormCol_vis.length; i++) {
          let mktoPlaceholderHtmlText = mktoFormCol_vis[i].querySelector(
            "[class*='mktoPlaceholderHtmlText']"
          );
          if (mktoPlaceholderHtmlText) {
            //wait for the form to be visible
          } else {
            mktoFormCol_vis[i].classList.remove("mktoVisible");
          }
        }

        if (!mktoForm.classList.contains("focusReady")) {
          focusFlds(mktoForm);
        }

        if (window?.mcz_marketoForm_pref?.field_filters?.products == "hidden") {
          let formId = getMktoFormID();
          let form = MktoForms2.getForm(formId);
          updateFormField(
            form,
            "mktoFormsPrimaryProductInterest",
            window?.mcz_marketoForm_pref?.program?.poi,
            true
          );
        }

        performance.mark("MarketoFormEnd");
        performance.measure("MarketoFormVisible", "MarketoFormStart", "MarketoFormEnd");

        mktoForm.removeAttribute("style");
        mktoForm.classList.add("mktoForm--fade-in");

        mktoForm.classList.add("mktoVisible");
      }

      return;
      //end normalizeMktoStyles
    }

    function mkt_optionals(mktoForm) {
      if (!mktoForm) {
        return;
      }
      let review_optoinal = mktoForm.querySelectorAll(
        ".mktoFormRow:not(.mktoHidden) fieldset.mktoFormCol .mktoFormRow[data-mktofield]"
      );
      if (review_optoinal.length > 0) {
        for (var i = 0; i < review_optoinal.length; i++) {
          let review_optoinal_elem = review_optoinal[i];
          let review_optoinal_elem_name = review_optoinal_elem.getAttribute("data-mktofield");
          let review_optoinal_elem_field = review_optoinal_elem.querySelector(
            `[name="${review_optoinal_elem_name}"]`
          );
          if (review_optoinal_elem_field == null) {
            review_optoinal_elem.parentNode.classList.remove("mktoVisible");
          } else {
            review_optoinal_elem.parentNode.classList.add("mktoVisible");
          }
        }
      }
    }

    var normalizeMktoStyles_pass_scripts = 0;
    var normalizeMktoStyles_pass_descriptor = 0;

    function updatePlaceholders() {
      let formFields = document.querySelectorAll(
        '.mktoFormRow  .mktoVisible input:not([type="hidden"]):not([placeholder]), .mktoFormRow .mktoVisible textarea:not([placeholder])'
      );
      for (var i = 0, len = formFields.length; i < len; i++) {
        let label = document.querySelectorAll(`label[for="${formFields[i].name}"]`)[0];
        if (label) {
          let labelText = label.innerText;
          if (labelText.length > 0) {
            labelText = labelText.replace(":", "").trim();
            labelText = labelText.replace(/\*/g, "").trim();
            label.innerHTML = labelText;

            if (formFields[i].classList.contains("mktoRequired")) {
              labelText = labelText + "*";
            }
            formFields[i].placeholder = labelText;
          }
        }
      }

      let selectFields = document.querySelectorAll(
        ".mktoFormRow  .mktoVisible select:not(.placeholder)"
      );
      for (var i = 0, len = selectFields.length; i < len; i++) {
        let label = document.querySelectorAll(`label[for="${selectFields[i].name}"]`)[0];
        if (label) {
          let labelText = label.innerText;
          if (labelText.length > 0) {
            labelText = labelText.replace(":", "").trim();
            labelText = labelText.replace(/\*/g, "").trim();
            label.innerHTML = labelText;
            if (selectFields[i].classList.contains("mktoRequired")) {
              labelText = labelText + "*";
            }

            let options = selectFields[i].querySelectorAll("option");
            let foundBlank = false;
            for (let j = 0; j < options.length; j++) {
              if (options[j].value === "") {
                foundBlank = true;
                options[j].text = labelText;
                break;
              }
            }
            if (!foundBlank) {
              let blankOption = document.createElement("option");
              blankOption.value = "";
              blankOption.text = labelText;
              selectFields[i].insertBefore(blankOption, selectFields[i].firstChild);
            }

            selectFields[i].classList.add("placeholder");
          }
        }
      }

      let mktoFormCols = document.querySelectorAll(".mktoFormCol");
      for (let i = 0; i < mktoFormCols.length; i++) {
        let mktoFormCol = mktoFormCols[i];
        let mktoFormColParent = mktoFormCol.parentNode;
        if (mktoFormColParent && mktoFormColParent.hasAttribute("data-mkto_vis_src")) {
          let mktoPlaceholderTxt = mktoFormCol.querySelector("[class*='HtmlText']");
          if (!mktoPlaceholderTxt) {
            let mktoField = mktoFormCol.querySelector(".mktoField");
            if (!mktoField) {
              mktoFormCol.classList.remove("mktoVisible");
            } else {
              mktoFormCol.classList.add("mktoVisible");
            }
          }
        }
      }
    }

    function addPOIListeners() {
      let mktoFormsPrimaryProductInterest = document.querySelector(
        '[name="mktoFormsPrimaryProductInterest"]:not(.changeListenerAdded)'
      );
      if (mktoFormsPrimaryProductInterest) {
        mktoFormsPrimaryProductInterest.addEventListener("change", function () {
          let poiValue = mktoFormsPrimaryProductInterest.value;
          let mcz_marketoForm_pref = window.mcz_marketoForm_pref || {};
          mcz_marketoForm_pref.program = mcz_marketoForm_pref.program || {};
          mcz_marketoForm_pref.program.poi = poiValue;
          window.mcz_marketoForm_pref = mcz_marketoForm_pref;
        });
        mktoFormsPrimaryProductInterest.classList.add("changeListenerAdded");
      }
    }

    function updateLabels() {
      const options = document.querySelectorAll(".mktoFormRow option[value='_']");
      for (let i = 0; i < options.length; i++) {
        options[i].value = "";
      }
      const links = document.querySelectorAll(".mktoFormRow a:not(.targetchecked)");
      links.forEach((link) => {
        const target = link.getAttribute("target");
        const href = link.getAttribute("href");
        if (target !== "_blank" && href && href.trim() !== "#") {
          link.setAttribute("target", "_blank");
          link.classList.add("targetchecked");
        }
      });

      let new_mktoUpdated = false;
      let language = mcz_marketoForm_pref?.profile?.prefLanguage;
      let subtype = mcz_marketoForm_pref?.form?.subtype;
      if (translateFormElems) {
        if (!language) {
          language = "en_us";
        }
        if (subtype && language) {
          if (mcz_marketoForm_pref?.subtypeRules?.[subtype]) {
            subtype = mcz_marketoForm_pref?.subtypeRules?.[subtype];
          }
          if (!translateFormElems?.[subtype]) {
            subtype = "submit";
          }
          let mktoButtons = document.querySelectorAll(".mktoButton:not(.mktoUpdatedBTN)");
          mktoButtons.forEach((mktoButton) => {
            let buttonContent = "" + mktoButton.innerHTML;
            buttonContent = buttonContent.toLowerCase();
            if (buttonContent.indexOf("undef") == -1) {
              if (buttonContent.indexOf("..") > -1) {
                let translateBTNText =
                  translateFormElems?.pleasewait?.[language] ||
                  translateFormElems?.pleasewait?.[language.substring(0, 2)] ||
                  null;
                if (translateBTNText) {
                  if (!translateBTNText.endsWith("...")) {
                    translateBTNText += "...";
                  }
                  if (translateBTNText !== mktoButton.innerHTML) {
                    mktoButton.innerHTML = translateBTNText;
                  }
                }
              } else {
                if (translateFormElems?.[subtype]?.[language]) {
                  let translateBTNText =
                    translateFormElems[subtype][language] ||
                    translateFormElems[subtype][language.substring(0, 2)] ||
                    translateFormElems[subtype].en_us;
                  if (translateBTNText !== mktoButton.innerHTML) {
                    mktoButton.innerHTML = translateBTNText;
                  }
                }
              }
            }
            mktoButton.classList.add("mktoUpdatedBTN");
          });
        }
      }

      let selectElements = document.querySelectorAll(".mktoFormRow select:not(.mktoUpdated)");
      for (let s = 0; s < selectElements.length; s++) {
        if (selectElements[s].options.length > 1) {
          let selectElement = selectElements[s];
          selectElement.classList.add("mktoUpdated");
          if (!selectElement.value) {
            let foundBlank = false;
            for (let i = 0; i < selectElement.options.length; i++) {
              let option = selectElement.options[i];
              if (option.value === "") {
                let sourceId = selectElement.getAttribute("id");
                if (sourceId) {
                  let sourceLabel = document.querySelector(`label[for="${sourceId}"]`);
                  if (sourceLabel && sourceLabel.innerText) {
                    let isRequired = selectElement.classList.contains("mktoRequired");
                    option.text = isRequired ? sourceLabel.innerText + "*" : sourceLabel.innerText;
                  }
                  selectElement.selectedIndex = 0;
                }
                foundBlank = true;
                break;
              }
            }
            if (!foundBlank) {
              let sourceId = selectElement.getAttribute("id");
              if (sourceId) {
                let blankOption = document.createElement("option");
                blankOption.value = "";
                blankOption.text = "";
                let sourceLabel = document.querySelector(`label[for="${sourceId}"]`);
                if (sourceLabel && sourceLabel.innerText) {
                  let isRequired = selectElement.classList.contains("mktoRequired");
                  blankOption.text = isRequired
                    ? sourceLabel.innerText + "*"
                    : sourceLabel.innerText;
                }
                selectElement.insertBefore(blankOption, selectElement.firstChild);
                selectElement.selectedIndex = 0;
              }
            }
            new_mktoUpdated = true;
          }
        }
      }

      const formRows = document.querySelectorAll('.mktoFormRow label:not(.labelUpdated)[id*="_0"]');
      for (let i = 0; i < formRows.length; i++) {
        const row = formRows[i];
        const sourceId = row.getAttribute("for");
        if (sourceId) {
          const sourceElem = document.querySelector(`[id="${sourceId}"]`);
          if (sourceElem) {
            const sourceName = sourceElem.getAttribute("name");
            if (sourceName) {
              const sourceLabelId = "Lbl" + sourceName;
              const sourceLabelText = document.querySelector(`label[id="${sourceLabelId}"]`);
              if (sourceLabelText) {
                let currentText = sourceLabelText.id;
                if (currentText && currentText.length > 0) {
                  if (lbl_rendering && lbl_rendering[currentText]) {
                    row.innerHTML = lbl_rendering[currentText];
                  } else {
                    lbl_rendering[currentText] = sourceLabelText.innerHTML;
                    row.innerHTML = sourceLabelText.innerHTML;
                  }
                  sourceLabelText.classList.add("labelUpdatedSRC");
                  row.classList.add("labelUpdated");
                }
              }
            }
          }
        } else {
          row.classList.add("labelUpdated");
          new_mktoUpdated = true;
        }
      }

      const updatedLabels = document.querySelectorAll(".labelUpdatedSRC");
      for (let i = 0; i < updatedLabels.length; i++) {
        updatedLabels[i].innerHTML = "";
        updatedLabels[i].classList.add("labelUpdated");
        updatedLabels[i].classList.remove("labelUpdatedSRC");
      }

      if (window.mcz_marketoForm_pref.profile.privacy_links) {
        for (const key in window.mcz_marketoForm_pref.profile.privacy_links) {
          const privacy_links = document.querySelectorAll(`.mktoFormRow a[href*="{${key}}"]`);
          privacy_links.forEach((link) => {
            link.href = window.mcz_marketoForm_pref.profile.privacy_links[key];
          });
        }
      }
      const labels = document.querySelectorAll(".labelUpdated");
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (label.innerHTML.indexOf("{country}") !== -1) {
          label.innerHTML = label.innerHTML.replace(
            /\{country\}/g,
            window.mcz_marketoForm_pref.profile.privacy_country
          );
        }
      }
    }

    function focusFlds(mktoForm) {
      let formFocusFields = mktoForm.querySelectorAll(
        ".mktoFormRowTop:not(.mktoHidden) .mktoField"
      );
      if (formFocusFields.length > 1) {
        mktoForm.classList.add("focusReady");
        function handleFirstFocus() {
          let mktoForm = document.querySelector(".mktoWhenRendered.mktoForm[id]");
          if (!mktoForm.classList.contains("focusActive")) {
            mktoForm.classList.add("focusActive");
            if (window?.mcz_marketoForm_pref?.profile !== undefined) {
              let nameoffield = this.getAttribute("name");
              if (nameoffield) {
                window.mcz_marketoForm_pref.profile.first_field = nameoffield;
              }
            }
            aaInteraction("Marketo Form Interaction", "formInteraction", null, null);
          }
        }
        formFocusFields.forEach(function (field) {
          field.addEventListener("focus", handleFirstFocus, true);
        });
      }
    }

    // ##
    // ## validation messages
    // ##
    let checkFormMsgs_rateLimit = 500;
    let checkFormMsgs_lastCall = 0;
    let checkFormMsgs_now = new Date().getTime();
    let checkFormMsgs_pending = false;
    function checkFormMsgs() {
      let mktoRequiredFields_invalid = document.querySelectorAll(
        ".mktoRequired.mktoValid:not(.warningMessage)"
      );
      for (var i = 0; i < mktoRequiredFields_invalid.length; i++) {
        let field = mktoRequiredFields_invalid[i];
        if (field?.value.length === 0) {
          field.classList.remove("mktoValid");
          field.classList.add("mktoInvalid");
        }
      }

      mktoRequiredFields_invalid = document.querySelectorAll(
        ".mktoRequiredVis.mktoInvalid:not(.warningMessage)"
      );
      let mktoRequiredFields_valid = document.querySelectorAll(
        ".mktoRequiredVis.mktoValid:not(.successMessage)"
      );
      let mktoRequiredFields_invalid_withSuccessMessage = document.querySelectorAll(
        ".mktoRequiredVis.mktoInvalid.successMessage"
      );
      let mktoRequiredFields_valid_withWarningMessage = document.querySelectorAll(
        ".mktoRequiredVis.mktoValid.warningMessage"
      );
      if (mktoRequiredFields_invalid instanceof Array) {
        for (var i = 0; i < mktoRequiredFields_invalid.length; i++) {
          let field = mktoRequiredFields_invalid[i];
          if (field) {
            field.classList.remove("successMessage");
            field.classList.add("warningMessage");
          }
        }
      }
      if (mktoRequiredFields_valid instanceof Array) {
        for (var i = 0; i < mktoRequiredFields_valid.length; i++) {
          let field = mktoRequiredFields_valid[i];
          if (field) {
            field.classList.remove("warningMessage");
            field.classList.add("successMessage");
          }
        }
      }
      if (mktoRequiredFields_invalid_withSuccessMessage instanceof Array) {
        for (var i = 0; i < mktoRequiredFields_invalid_withSuccessMessage.length; i++) {
          let field = mktoRequiredFields_invalid_withSuccessMessage[i];
          if (field) {
            field.classList.remove("successMessage");
            field.classList.add("warningMessage");
          }
        }
      }
      if (mktoRequiredFields_valid_withWarningMessage instanceof Array) {
        for (var i = 0; i < mktoRequiredFields_valid_withWarningMessage.length; i++) {
          let field = mktoRequiredFields_valid_withWarningMessage[i];
          if (field) {
            field.classList.remove("warningMessage");
            field.classList.add("successMessage");
          }
        }
      }
      let mktoRequiredFields = document.querySelectorAll(
        ".mktoRequiredVis:not([data-checkFormMsgs_throttle])"
      );

      let mktoButtons = document.querySelectorAll(".mktoButton:not([data-checkFormMsgs_throttle])");
      if (mktoButtons) {
        for (var i = 0; i < mktoButtons.length; i++) {
          let button = mktoButtons[i];
          if (button) {
            button.setAttribute("data-checkFormMsgs_throttle", true);
            button.addEventListener("mouseout", checkFormMsgs_throttle);
            button.addEventListener("click", clickCallValidation);
          }
        }
      }

      mktoRequiredFields.forEach(function (element) {
        if (element && !element.hasAttribute("data-checkFormMsgs_throttle")) {
          element.setAttribute("data-checkFormMsgs_throttle", true);
          element.addEventListener("blur", checkFormMsgs_throttle);
          element.addEventListener("change", checkFormMsgs_throttle);
          element.addEventListener("mouseout", checkFormMsgs_throttle);
          element.addEventListener("keyup", checkFormMsgs_throttle);
        }
      });
      if (checkFormMsgs_pending) {
        checkFormMsgs_pending = false;
        checkFormMsgs();
      }
    }

    function clickCallValidation() {
      setTimeout(function () {
        checkFormMsgs_throttle();
      }, 600);
    }

    function checkFormMsgs_throttle() {
      checkFormMsgs_now = new Date().getTime();
      if (checkFormMsgs_now - checkFormMsgs_lastCall > checkFormMsgs_rateLimit) {
        checkFormMsgs_lastCall = checkFormMsgs_now;
        checkFormMsgs();
      } else {
        checkFormMsgs_pending = true;
      }
    }

    function isElementVisible(el) {
      try {
        let style = window.getComputedStyle(el);
        if (style.display === "none") return false;
        if (style.visibility !== "visible") return false;
        if (style.opacity < 0.1) return false;
        if (style.overflow !== "visible") {
          if (
            el.offsetWidth +
              el.offsetHeight +
              el.getBoundingClientRect().height +
              el.getBoundingClientRect().width ===
            0
          ) {
            return false;
          }
        }
        el = el.parentNode;
        while (el != null && el.nodeType == 1) {
          let style = window.getComputedStyle(el);
          if (style.display === "none") return false;
          if (style.visibility !== "visible") return false;
          if (style.opacity < 0.1) return false;
          if (style.overflow !== "visible") {
            if (
              el.offsetWidth +
                el.offsetHeight +
                el.getBoundingClientRect().height +
                el.getBoundingClientRect().width ===
              0
            ) {
              return false;
            }
          }
          el = el.parentNode;
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    let mktoButtonRow = document.querySelector(".mktoButtonRow:not(.mktoButtonRow--observed)");
    if (mktoButtonRow) {
      mktoButtonRow.classList.add("mktoButtonRow--observed");

      mktoButtonRow.addEventListener("click", function (e) {
        if (!mktoButtonRow.hasAttribute("data-buttonObserver")) {
          mktoButtonRow.setAttribute("data-buttonObserver", true);
          let validateForms = document.querySelectorAll('[id*="mktoForm_"]:not(.validationActive)');
          if (validateForms) {
            for (var i = 0; i < validateForms.length; i++) {
              let validateForm = validateForms[i];
              validateForm.classList.add("validationActive");
            }
          }
        }
        let requiredFields = document.querySelectorAll(".mktoRequired:not(.mktoRequiredVis)");
        if (requiredFields) {
          for (var i = 0; i < requiredFields.length; i++) {
            let field = requiredFields[i];
            if (isElementVisible(field)) {
              field.classList.add("mktoRequiredVis");
            }
          }
          if (requiredFields.length > 0) {
            setTimeout(checkFormMsgs_throttle, 10);
          }
        }
      });
    }

    // ###########################################

    var nStyles_on = false;
    var isRequestedAgain = false;
    var chkFrmInt;

    function cleaning_validation_main() {
      let mktoForm = document.querySelector(".mktoWhenRendered.mktoForm[id]");
      if (mktoForm) {
        if (chkFrmInt) {
          clearInterval(chkFrmInt);
        }
        rendering_ready = true;

        mkto_addCSS(mktoForm);

        if (document.querySelector("#mktoFormsCompany")) {
          document.getElementById("mktoFormsCompany").id = "mkto_FormsCompany";
        }

        if (mktoForm && !mktoForm.classList.contains("observMKTO")) {
          mktoForm.classList.add("observMKTO");

          if (document.querySelector("#mktoFormsCompany")) {
            document.getElementById("mktoFormsCompany").id = "mkto_FormsCompany";
          }

          const observer = new MutationObserver((mutations) => {
            if (mutations && mutations.length > 0) {
              normalizeStyles();
            }
          });

          function normalizeStyles() {
            if (nStyles_on) {
              isRequestedAgain = true;
              return;
            }

            if (document.querySelector("#mktoFormsCompany")) {
              document.getElementById("mktoFormsCompany").id = "mkto_FormsCompany";
            }

            nStyles_on = true;
            observer.disconnect();
            try {
              normalizeMktoStyles();
            } catch (error) {
              mkf_c.log("normalizeMktoStyles > ", error);
            }

            observer.observe(mktoForm, config);
            nStyles_on = false;

            if (isRequestedAgain) {
              isRequestedAgain = false;
              normalizeStyles();
            } else {
              let mktoLegend = document.querySelectorAll("legend:not(.mktoLegend)");
              if (firstrun && normalizeMktoStyles_run > 1) {
                firstrun = false;
                normalizeStyles();
              }
            }
            return;
          }

          let config = {
            attributes: true,
            childList: true,
            characterData: false,
            subtree: true,
          };

          observer.observe(mktoForm, config);
          normalizeStyles();
        }
      }
    }

    cleaning_validation_main();
    if (!rendering_ready) {
      chkFrmInt = setInterval(cleaning_validation_main, 10);
    }
  }
}

// ##
// ##