// <![CDATA[
// ##
// ## Updated 20231002T193603
// ##
// ##
// ##
// ## Cleaning and Validation
// ##
// ##
if (typeof fld_row_cleaner != "function") {
  console.log("Cleaning & Validation - Loaded");
  let rendering_ready = false;
  function fld_row_cleaner() {
    if (!rendering_ready) {
      let mktoForm = document.querySelector(".mktoWhenRendered.mktoForm[id]");
      if (mktoForm) {
        rendering_ready = true;
        var lbl_rendering = {
          temp: "temp",
        };
        if (!mktoForm.classList.contains("mktoForm--styles-added")) {
          const baseCss = `
            .starting_fieldset fieldset{
              opacity: 0;
              visibility: hidden;
              -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              transition: opacity 0.1s ease-in, height 0.1s ease-in;
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
              -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              transition: opacity 0.1s ease-in, height 0.1s ease-in;
            }
            .mktoForm--fade-in .mktoHtmlText:not([style]) {
              opacity: 1;
              visibility: visible;
              -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
              transition: opacity 0.1s ease-in, height 0.1s ease-in;
            }            
          `;

          let head = document.head || document.getElementsByTagName("head")[0];
          let style = document.createElement("style");
          head.appendChild(style);
          style.type = "text/css";
          if (style.styleSheet) {
            style.styleSheet.cssText = baseCss;
          } else {
            style.appendChild(document.createTextNode(baseCss));
          }

          mktoForm.classList.add("mktoForm--styles-added");

          function translateDDlbls(dropdownName, translateValues) {
            let dropdownField = document.querySelector(
              `select[name="${dropdownName}"]:not(.translated)`
            );

            if (dropdownField) {
              if (typeof setRequired == "function") {
                let row = dropdownField.closest(".mktoFormRow");
                if (row) {
                  if (row.classList.contains("mktoRequiredField")) {
                    let mktoRequired = row.querySelector(".mktoRequired");
                    if (mktoRequired && mktoRequired !== null) {
                      //we may want to remove required later
                    } else {
                      setRequired(dropdownName, true);
                    }
                  }
                }
              }

              if (!translateValues || Object.keys(translateValues).length === 0) {
                console.log("translateDDlbls >> No translation values found for:" + dropdownName);
                return;
              }

              dropdownField.classList.add("translated");

              if (translateFormElems.hasOwnProperty(dropdownName.toLowerCase())) {
                let language = mcz_marketoForm_pref?.profile?.prefLanguage;
                if (language) {
                  language = language.toLowerCase();
                  language = language.replace("-", "_");
                } else {
                  language = "en_us";
                }
                if (language) {
                  let translatedElem = translateFormElems[dropdownName.toLowerCase()][language];
                  if (translatedElem) {
                    let label = dropdownField
                      .closest(".mktoFormRow")
                      .querySelector('label[for="' + dropdownName + '"]');
                    if (label) {
                      let required = false;
                      let originalElemTxt = label.innerText;
                      originalElemTxt = originalElemTxt.trim();
                      if (originalElemTxt.indexOf("*") > -1) {
                        originalElemTxt = originalElemTxt.replace("*", "");
                        translatedElem = translatedElem + "*";
                        required = true;
                      }
                      label.innerHTML = translatedElem;
                      let options = dropdownField.querySelectorAll("option");
                      for (let i = 0; i < options.length; i++) {
                        let option = options[i];
                        if (
                          option.text.toLowerCase().replace("*", "").trim() ===
                          translatedElem.toLowerCase().replace("*", "").trim()
                        ) {
                          option.setAttribute("data-original-label", option.text);
                          option.text = translatedElem;
                        }
                      }
                    }
                  }
                }
              }

              let optionsArray = Array.from(dropdownField.options);
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
                } else if (option.value === "" || option.value === "_") {
                  select_lbloption = option;
                  return false;
                } else {
                  unsortedOptions.push(option);
                  return false;
                }
              });
              if (select_lbloption) {
                optionsArray.unshift(select_lbloption);
              }

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

              optionsArray = optionsArray.concat(unsortedOptions);
              dropdownField.innerHTML = "";

              optionsArray.forEach((option) => {
                dropdownField.add(option);
              });

              dropdownField.value = selectedValue;
            } else {
              console.warn(`translateDDlbls >> No dropdown found for: ${dropdownName}`);
            }
          }

          function normalizeMktoStyles() {
            let mktoForm = document.querySelector(".mktoForm[id]");
            let mktoFormRows = document.querySelectorAll(".mktoFormRow:not([data-mktofield])");
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
                      mktoFieldParent.setAttribute(
                        "data-mktofield",
                        mktoField.getAttribute("name")
                      );
                      break;
                    }
                    mktoFieldParent = mktoFieldParent.parentNode;
                  }
                }
              }
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

            if (mktoFormRows.length > 0) {
              for (var i = 0; i < mktoFormRows.length; i++) {
                let mktoFormRow = mktoFormRows[i];
                let mktoFormRowChild = mktoFormRow.querySelector(
                  ".mktoFormRow:not(.mktoFormRowTop)"
                );
                if (mktoFormRow.parentNode.classList.contains("mktoForm")) {
                  mktoFormRow.classList.add("mktoFormRowTop");
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
                            .replace("*", "")
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

                  let mktoFormRowScript = mktoFormRow.querySelector(
                    "script:not(.mktoCleanedScript)"
                  );
                  if (mktoFormRowScript != null) {
                    mktoFormRow.classList.add("mktoHidden");
                    mktoFormRow.classList.add("mktoCleanedScript");
                    normalizeMktoStyles_pass_scripts += 1;
                  }
                }

                //
                //
                // Logic for field_rule legend
                //
                //
                let handleFieldRuleLegend_try = 0;
                let handleFieldRuleLegend_max = 30;

                async function handleFieldRuleLegend(
                  mktoFormRowLegend,
                  mktoFormRow,
                  mktoForm,
                  mktoFieldset
                ) {
                  mktoFormRow.classList.add("mktoHidden");
                  const mktoHtmlTexts = mktoFieldset.querySelectorAll(
                    ".mktoHtmlText:not(.mktoHidden)"
                  );

                  mktoHtmlTexts.forEach((textElem, index) => {
                    let mkto_handleFieldRuleLegend = mktoFormRowLegend.querySelector(
                      ".mkto_handleFieldRuleLegend"
                    );

                    if (index !== 0) {
                      return;
                    }

                    if (!mkto_handleFieldRuleLegend) {
                      mkto_handleFieldRuleLegend = document.createElement("span");
                      mkto_handleFieldRuleLegend.classList.add("mkto_handleFieldRuleLegend");
                      mktoFormRowLegend.appendChild(mkto_handleFieldRuleLegend);
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
                    let mktoSelect_option = mktoForm.querySelector(
                      `select[name='${fieldname}'] option`
                    );
                    if (!mktoSelect || !mktoSelect_option) {
                      handleFieldRuleLegend_try += 1;
                      if (handleFieldRuleLegend_try < handleFieldRuleLegend_max) {
                        setTimeout(function () {
                          handleFieldRuleLegend(
                            mktoFormRowLegend,
                            mktoFormRow,
                            mktoForm,
                            mktoFieldset
                          );
                        }, 25);
                        return;
                      } else {
                        console.log(
                          "handleFieldRuleLegend >> fieldname not found after " +
                            handleFieldRuleLegend_try +
                            " attempts."
                        );
                        return;
                      }
                    }

                    valueset = valueset.toLowerCase();

                    if (typeof setRequired != "function") {
                      return;
                    }

                    let mktoFormRowTop = mktoSelect.closest(
                      ".mktoFormRowTop:not(.mkto_handleFieldRuleLegend)"
                    );
                    if (valueset === "none") {
                      setRequired(fieldname, false);
                      if (mktoFormRowTop) {
                        let mktoFieldDescriptor =
                          mktoFormRowTop.querySelectorAll(".mktoFieldDescriptor");
                        if (mktoFieldDescriptor) {
                          mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                            mktoFieldDescriptor.classList.add("mktoFieldDescriptor__hidden");
                            mktoFieldDescriptor.classList.remove("mktoFieldDescriptor");
                          });
                        }
                        mktoFormRowTop.classList.add("mktoHidden", "mkto_handleFieldRuleLegend");
                      }
                      return;
                    }

                    let starting_option = [];
                    let newOptions = [];
                    let other_option = [];
                    if (
                      mktoFormRowTop &&
                      mktoFormRowTop.classList.contains("mkto_handleFieldRuleLegend")
                    ) {
                      setRequired(fieldname, true);
                      mktoFormRowTop.classList.remove("mktoHidden", "mkto_handleFieldRuleLegend");

                      let mktoFieldDescriptor = mktoFormRowTop.querySelectorAll(
                        ".mktoFieldDescriptor__hidden"
                      );
                      if (mktoFieldDescriptor) {
                        mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                          mktoFieldDescriptor.classList.add("mktoFieldDescriptor");
                          mktoFieldDescriptor.classList.remove("mktoFieldDescriptor__hidden");
                        });
                      }
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

                    let mktoSelectClone = document.querySelector(
                      `select[name='${fieldname}_clone']`
                    );
                    if (!mktoSelectClone) {
                      mktoSelectClone = mktoSelect.cloneNode(true);
                      mktoSelectClone.style =
                        "display:none;position:absolute;top:-1000px;left:-1000px;";
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

                    let valuesetArray = valueset.split("|");
                    let valuesetArray2 = [];
                    valuesetArray.forEach((value) => {
                      if (value.includes(":")) {
                        let valueArray = value.split(":");
                        if (valueArray.length > 1) {
                          if (valueArray[0] === "2") {
                            valuesetArray2.push(valueArray[1].trim().toLowerCase());
                          }
                          valuesetArray[valuesetArray.indexOf(value)] = valueArray[1]
                            .trim()
                            .toLowerCase();
                        }
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
                        }
                        if (optionValue.trim().toLowerCase() === "other") {
                          other_option.push(option);
                        }
                        if (
                          newOptions.some(
                            (option) =>
                              option.value.trim().toLowerCase() === optionValue.trim().toLowerCase()
                          )
                        ) {
                          if (valuesetArray2.includes(optionValue.trim().toLowerCase())) {
                            let newOption = newOptions.find(
                              (option) =>
                                option.value.trim().toLowerCase() ===
                                optionValue.trim().toLowerCase()
                            );
                            if (newOption) {
                              newOption.innerText = option.innerText;
                            }
                          }
                        } else {
                          newOptions.push(option);
                        }
                      }
                    }

                    let backValue =
                      mktoSelect.selectedIndex > -1
                        ? mktoSelect.options[mktoSelect.selectedIndex].value
                        : "";

                    mktoSelectClone.querySelectorAll("option").forEach((option) => {
                      let optionValue = option.value.toLowerCase();

                      if (
                        optionValue.trim().toLowerCase() === "" ||
                        optionValue === null ||
                        optionValue === "_"
                      ) {
                        addOption(option.cloneNode(true));
                      } else if (
                        reference === "keep" &&
                        !valuesetArray.includes(optionValue.trim().toLowerCase())
                      ) {
                        //  console.log(
                        //    `keep rule>> removed:${option.value} - ${option.innerText} from:${fieldname}`
                        //  );
                      } else if (reference === "hide" && valuesetArray.includes(optionValue)) {
                        //  console.log(
                        //    `hide rule>> removed:${option.value} - ${option.innerText} from:${fieldname}`
                        //  );
                      } else {
                        addOption(option.cloneNode(true));
                      }
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

                      let mktoSelect_option = mktoSelect.querySelector(
                        `option[value='${backValue}']`
                      );
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
                        let mktoFieldDescriptor =
                          mktoFormRowTop.querySelectorAll(".mktoFieldDescriptor");
                        if (mktoFieldDescriptor) {
                          mktoFieldDescriptor.forEach((mktoFieldDescriptor) => {
                            mktoFieldDescriptor.classList.add("mktoFieldDescriptor__hidden");
                            mktoFieldDescriptor.classList.remove("mktoFieldDescriptor");
                          });
                        }
                        mktoFormRowTop.classList.add("mktoHidden", "mkto_handleFieldRuleLegend");
                      }
                    }
                    textElem.innerHTML = "passed: " + reference.trim();
                  });
                }

                //
                //
                function handleFieldsetLabelLegend(mktoFormRowLegend, mktoFormRow, mktoFieldset) {
                  const mktoHtmlTexts = mktoFieldset.querySelectorAll(".mktoHtmlText");
                  let rulefound = false;
                  mktoHtmlTexts.forEach((textElem, index) => {
                    if (textElem.innerText.trim().length > 0 && !rulefound) {
                      rulefound = true;
                      let reference = textElem.innerText.toLowerCase().split("fieldset_label")[1];
                      //console.log(reference);
                      let legendClassName = reference.split("rule:")[0];
                      legendClassName = legendClassName.replace(/[^a-z0-9-]/gi, "");
                      legendClassName = legendClassName.substring(0, 20);
                      mktoFormRow.setAttribute("data-mkto_vis_src", legendClassName);
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
                                const tentativeValueLocationArray =
                                  tentativeValueLocation.split(".");
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
                            console.log("!Partner name not found.");
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
                //
                //
                function handleHiddenLegend(mktoFormRowLegend, mktoFormRow) {
                  mktoFormRowLegend.classList.add("mktoCleanedlegend");
                  mktoFormRow.classList.add("mktoCleaned", "mktoHidden");

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
                //
                //
                //
                function handleOtherLegends(mktoFormRowLegend, mktoFormRow) {
                  let otherClass = mktoFormRowLegend.innerText
                    .toLowerCase()
                    .trim()
                    .replace(" ", "-");
                  if (otherClass.length > 0) {
                    otherClass = otherClass.replace(/[^a-z0-9-]/gi, "");
                    otherClass = otherClass.substring(0, 20);
                    mktoFormRowLegend.classList.add(otherClass);
                    mktoFormRow.classList.add("mktoCleaned");
                    mktoFormRow.classList.add(otherClass);
                    mktoFormRow.setAttribute("data-mkto_vis_src", otherClass);
                  }
                }

                const mktoFormRowLegends = mktoFormRow.querySelectorAll(
                  "legend:not(.mktoCleanedlegend)"
                );

                if (mktoFormRowLegends.length) {
                  mktoFormRowLegends.forEach((mktoFormRowLegend) => {
                    const mktoFieldset = mktoFormRowLegend.closest("fieldset");
                    const mktoHtmlText = mktoFieldset.querySelector(".mktoHtmlText");
                    const innerTextLower = mktoFormRowLegend.innerText.toLowerCase();

                    if (
                      mktoHtmlText &&
                      mktoHtmlText.innerText.toLowerCase().includes("field_rule")
                    ) {
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
                  });
                }

                //
                //
              }
            }

            if (typeof translateState !== "undefined" && Object.keys(translateState).length > 0) {
              translateDDlbls("State", translateState);
            }

            updatePlaceholders();
            updateLabels();
            addPOIListeners();

            if (mktoForm.classList.contains("validationActive")) {
              checkFormMsgs_throttle();
            }

            if (normalizeMktoStyles_pending) {
              setTimeout(function () {
                normalizeMktoStyles_pending = false;
                normalizeMktoStyles();
              }, 50);
            } else {
              if (firstrun) {
                firstrun = false;
                let counter = 0;
                const interval = setInterval(function () {
                  normalizeMktoStyles();
                  counter += 50;
                  if (counter >= 3000) {
                    clearInterval(interval);
                    normalizeMktoStyles_pending = false;
                  }
                }, 50);
              }

              if (!mktoForm.classList.contains("mktoVisible")) {
                //
                // Focus Logic for first interactions
                //
                if (!mktoForm.classList.contains("focusReady")) {
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

                mktoForm.classList.add("mktoVisible");
                mktoForm.classList.add("mktoForm--fade-in");
                mktoForm.removeAttribute("style");
                performance.mark("MarketoFormEnd");
                performance.measure("MarketoFormVisible", "MarketoFormStart", "MarketoFormEnd");
              }
            }
          }

          let firstrun = true;
          let normalizeMktoStyles_rateLimit = 1000;
          let normalizeMktoStyles_lastCall = 0;
          let normalizeMktoStyles_now = new Date().getTime();
          let normalizeMktoStyles_pending = true;
          let normalizeMktoStyles_pass_scripts = 0;
          let normalizeMktoStyles_pass_legends = 0;
          let normalizeMktoStyles_pass_descriptor = 0;

          function normalizeMktoStyles_throttle() {
            normalizeMktoStyles_now = new Date().getTime();
            if (
              normalizeMktoStyles_now - normalizeMktoStyles_lastCall >
              normalizeMktoStyles_rateLimit
            ) {
              normalizeMktoStyles_lastCall = normalizeMktoStyles_now;
              setTimeout(function () {
                normalizeMktoStyles();
              }, 100);
            } else {
              normalizeMktoStyles_pending = true;
            }
          }

          function updatePlaceholders() {
            let formFields = document.querySelectorAll(
              ".mktoFormRow input:not(.mktoUpdated), .mktoFormRow textarea:not(.mktoUpdated)"
            );
            for (var i = 0, len = formFields.length; i < len; i++) {
              let label = formFields[i].closest(".mktoFormRow").querySelector("label");
              if (label) {
                let labelText = label.innerText;
                labelText = labelText.replace("*", "");
                labelText = labelText.replace(":", "");
                labelText = labelText.trim();
                if (labelText.length > 2) {
                  let mktoRequiredField = formFields[i]
                    .closest(".mktoFormRow")
                    .querySelector(".mktoRequiredField");
                  if (mktoRequiredField) {
                    labelText = labelText + "*";
                  }
                  let labelPlaceholder = formFields[i].placeholder;
                  if (labelPlaceholder.trim() !== labelText) {
                    formFields[i].placeholder = labelText;
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
                let mktoButtons = document.querySelectorAll(".mktoButton");
                mktoButtons.forEach((mktoButton) => {
                  let buttonContent = mktoButton.innerHTML.toLowerCase();
                  if (buttonContent.indexOf("undef") == -1) {
                    if (translateFormElems?.[subtype]?.[language]) {
                      if (translateFormElems[subtype][language] !== mktoButton.innerHTML) {
                        mktoButton.innerHTML = translateFormElems[subtype][language];
                      }
                    }
                  }
                  if (buttonContent.indexOf("..") > -1) {
                    if (translateFormElems?.pleasewait?.[language]) {
                      if (translateFormElems.pleasewait[language] !== mktoButton.innerHTML) {
                        mktoButton.innerHTML = translateFormElems.pleasewait[language];
                      }
                    }
                  }
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
                          option.text = isRequired
                            ? sourceLabel.innerText + "*"
                            : sourceLabel.innerText;
                        }
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

            const formRows = document.querySelectorAll(
              '.mktoFormRow label:not(.labelUpdated)[id*="_0"]'
            );
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
          }

          // ##
          // ## validation messages
          // ##
          let checkFormMsgs_rateLimit = 1000;
          let checkFormMsgs_lastCall = 0;
          let checkFormMsgs_now = new Date().getTime();
          let checkFormMsgs_pending = false;
          function checkFormMsgs() {
            let mktoRequiredFields_invalid = document.querySelectorAll(
              ".mktoRequired.mktoValid:not(.warningMessage)"
            );
            for (var i = 0; i < mktoRequiredFields_invalid.length; i++) {
              let field = mktoRequiredFields_invalid[i];
              if (field.value && field.value.length === 0) {
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
              setTimeout(function () {
                checkFormMsgs_pending = false;
                checkFormMsgs();
              }, 100);
            }
          }

          function checkFormMsgs_throttle() {
            checkFormMsgs_now = new Date().getTime();
            if (checkFormMsgs_now - checkFormMsgs_lastCall > checkFormMsgs_rateLimit) {
              checkFormMsgs_lastCall = checkFormMsgs_now;
              setTimeout(function () {
                checkFormMsgs();
              }, 50);
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

          let mktoButtonRow = document.querySelector(
            ".mktoButtonRow:not(.mktoButtonRow--observed)"
          );
          if (mktoButtonRow) {
            mktoButtonRow.classList.add("mktoButtonRow--observed");

            mktoButtonRow.addEventListener("click", function (e) {
              if (!mktoButtonRow.hasAttribute("data-buttonObserver")) {
                mktoButtonRow.setAttribute("data-buttonObserver", true);
                let validateForms = document.querySelectorAll(
                  '[id*="mktoForm_"]:not(.validationActive)'
                );
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
                  setTimeout(checkFormMsgs_throttle, 50);
                }
              }
            });
          }

          // ###########################################
        }

        let observeForm = document.querySelector('[id*="mktoForm_"]:not(.observMKTO)');
        if (observeForm) {
          observeForm.classList.add("observMKTO");
          let observer = new MutationObserver(debounce(normalizeMktoStyles, 50));
          let config = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
          };
          observer.observe(observeForm, config);
          setTimeout(normalizeMktoStyles, 10);
        }

        function debounce(func, wait) {
          let timeout;
          return function () {
            const context = this,
              args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
              timeout = null;
              func.apply(context, args);
            }, wait);
          };
        }
      } else {
        setTimeout(fld_row_cleaner, 10);
      }
    } else {
      setTimeout(fld_row_cleaner, 10);
    }
  }

  fld_row_cleaner();
}

// ##
// ##
// ]]>