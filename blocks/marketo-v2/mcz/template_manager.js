/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Template Manager Module v0.5b

let mkfC;

function mktoCss_LP() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  if (params.has('isPreview') && window.location.href?.indexOf('/landingPage/formContent') > -1) {
    function addSelectBox() {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      const selectBox = document.createElement('select');
      selectBox.id = 'form.template';

      const activeTemps = templateRules.map((template) => Object.keys(template)[0]);

      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Select Template';
      selectBox.appendChild(option);

      activeTemps.forEach((temp) => {
        const option = document.createElement('option');
        option.value = temp;
        option.textContent = temp;
        selectBox.appendChild(option);
      });

      if (params.has('template')) {
        const currTemp = params.get('template');
        if (currTemp) {
          selectBox.value = currTemp;
        }
      } else {
        selectBox.value = mcz_marketoForm_pref.form.template || '';
      }

      if (selectBox.value === 'subscription') {
        const subId = `SUBSCRIPTION-TEST-${
          new Date()
            .toISOString()
            .replace(/[^0-9]/g, '')
            .slice(0, 14)}`;
        const subName = 'Subscription Test ';
        window.mcz_marketoForm_pref.program.subscription.id = subId;
        window.mcz_marketoForm_pref.program.subscription.name = subName;
      }

      selectBox.style.position = 'absolute';
      selectBox.style.top = '20px';
      selectBox.style.left = '20px';
      selectBox.style.margin = '20px';

      selectBox.addEventListener('change', function () {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.set('template', this.value);
        params.set('isPreview', '1');
        if (params.has('audit_translations')) {
          params.set('audit_translations', 'true');
        }
        const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
        window.location.href = newURL;
      });

      document.body.appendChild(selectBox);
    }

    setTimeout(addSelectBox, 1000);

    function addLangSelectBox() {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      const selectBox = document.createElement('select');
      selectBox.id = 'form.lang';

      const activeLangs = Object.keys(translateFormElems.lang);

      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Select Language';
      selectBox.appendChild(option);

      activeLangs.forEach((temp) => {
        const option = document.createElement('option');
        option.value = temp;
        option.textContent = temp;
        selectBox.appendChild(option);
      });

      if (params.has('lang')) {
        const currLang = params.get('lang');
        if (currLang) {
          selectBox.value = currLang;
        }
      } else {
        selectBox.value = mcz_marketoForm_pref.profile.prefLanguage || '';
      }

      selectBox.style.position = 'absolute';
      selectBox.style.top = '60px';
      selectBox.style.left = '20px';
      selectBox.style.margin = '20px';

      selectBox.addEventListener('change', function () {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.set('lang', this.value);
        params.set('isPreview', '1');
        if (params.has('audit_translations')) {
          params.set('audit_translations', 'true');
        }
        const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
        window.location.href = newURL;
      });

      document.body.appendChild(selectBox);
    }

    setTimeout(addLangSelectBox, 1000);

    function auditSelectTranslations() {
      if (document.querySelector('.mktoFormTranslationH1')) {
        return;
      }
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const h1 = document.createElement('h1');
      h1.classList.add('mktoFormTranslationH1');
      h1.textContent = `${
        document.getElementById('form.template').value
      } (${
        mcz_marketoForm_pref.profile.prefLanguage
      })`;
      document.querySelector('form').insertBefore(h1, document.querySelector('form').firstChild);

      const selects = document.querySelectorAll('select');
      selects.forEach((select) => {
        const label = document.querySelector(`label[for="${select.name}"]`);
        if (label) {
          const table = document.createElement('table');
          table.style.width = '100%';
          table.setAttribute('border', '1');
          table.classList.add('mktoFormTranslationTable');

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          const thValue = document.createElement('th');
          thValue.textContent = 'Value';
          const thLabel = document.createElement('th');
          thLabel.textContent = 'Label' + ` (${mcz_marketoForm_pref.profile.prefLanguage})`;
          headerRow.appendChild(thValue);
          headerRow.appendChild(thLabel);
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');
          select.querySelectorAll('option').forEach((option) => {
            const row = document.createElement('tr');
            const valueCell = document.createElement('td');
            valueCell.textContent = option.value;
            const labelCell = document.createElement('td');
            labelCell.textContent = option.textContent;
            row.appendChild(valueCell);
            row.appendChild(labelCell);
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          select.parentNode.insertBefore(table, select.nextSibling);

          const h2 = document.createElement('h2');
          h2.classList.add('mktoFormTranslationH2');
          let h2_txt = label.textContent;
          h2_txt = h2_txt.replace(/\s+/g, ' ').trim();
          h2_txt = h2_txt.trim();

          if (select.name !== h2_txt) {
            h2_txt = `${h2_txt}<span class="marketo-field-name"> "${select.name}" </span>`;
          }
          h2.innerHTML = h2_txt;
          select.parentNode.insertBefore(h2, table);
        }
      });

      const cssAss = `
          
              .mktoLabel.mktoVisible {
              margin-top: 60px !important;
            }
          
          `;
      const style = document.createElement('style');
      style.innerHTML = cssAss;
      document.head.appendChild(style);

      const auditButton = document.getElementById('auditButton');
      if (auditButton) {
        auditButton.parentNode.removeChild(auditButton);
      }

      if (params.has('audit_translations')) {
        //
      } else {
        params.set('audit_translations', 'true');
        const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
        window.location.href = newURL;
      }
    }

    function removeAuditTable() {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      params.delete('audit_translations');
      const newURL = `${url.origin}${url.pathname}?${params.toString()}`;
      window.location.href = newURL;
    }

    function addAuditButton() {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      if (params.has('audit_translations')) {
        auditSelectTranslations();
        const auditButton = document.createElement('button');
        auditButton.textContent = 'Remove Option Tables';
        auditButton.style.position = 'absolute';
        auditButton.style.top = '100px';
        auditButton.style.left = '20px';
        auditButton.style.margin = '20px';
        auditButton.id = 'removeTableButton';
        auditButton.addEventListener('click', removeAuditTable);
        document.body.appendChild(auditButton);
      } else {
        const auditButton = document.createElement('button');
        auditButton.textContent = 'Audit Select Options';
        auditButton.style.position = 'absolute';
        auditButton.style.top = '100px';
        auditButton.style.left = '20px';
        auditButton.style.margin = '20px';
        auditButton.id = 'auditButton';
        auditButton.addEventListener('click', auditSelectTranslations);
        document.body.appendChild(auditButton);
      }
    }

    setTimeout(addAuditButton, 2000);

    const styleSheets = document.getElementsByTagName('link');
    for (let i = 0; i < styleSheets.length; i++) {
      if (styleSheets[i].rel === 'stylesheet') {
        styleSheets[i].parentNode.removeChild(styleSheets[i]);
      }
    }

    const inlineStyleBlock = document.querySelector('style');
    inlineStyleBlock.innerHTML += `
          
      
          span.marketo-field-name {
         
              font-size: 14px;
              font-weight: normal;
              color: #333;
              font-style: italic;
          }
        
          form.mktoForm.mktoVisible {
              max-height: fit-content !important;
              overflow: visible;
              margin-top: 100px;
              margin-bottom: 100px;
          }
          
          .mktoFormTranslationTable {  
              margin-bottom: 60px;
              border-collapse: collapse;
              border-color: white;
  
          }
  
          .mktoFormTranslationTable th {
          text-align: left;
          padding: 8px;
  
  
          }
  
          .mktoFormTranslationTable td {
          padding: 8px;
  
          }
  
          .mktoFormTranslationTable tr:nth-child(even) {
          background-color: #ffe5e4;
          }
  
          .mktoFormTranslationTable tr:hover {
          background-color: #0165dc;
          color: white;
          }
  
          .mktoFormTranslationTable tr {
          border-bottom: 1px solid #fff;
          }
  
          .mktoFormTranslationTable th {
          background-color: #f91101;
          color: white;
          }
          
      
  
          fieldset {
          border: none;
          float: left;
          width: 100%;
          margin: 0;
          }
  
          body {
          font-family: Arial, sans-serif;
          font-size: 14px; 
          }
  
          .mktoLabel.mktoVisible, .adobe-privacy, .mktoLogicalField{
          margin-top: 10px;
          display: block;
          padding-bottom: 2px;
          padding-left: 2px;
          } 
          .mktoLabel.mktoVisible{
          }
  
          .mktoField{
          color: #333333;
          border: #c5bfbf;
          border-bottom: 2px solid;
          margin-bottom:10px;
          margin-top:10px;
          }
  
  
          .mktoInvalid{ 
          color: red;
          border: red;
          border-bottom: 2px solid;
          }
  
  
          .mktoLogicalField.mktoVisible label {
          display: inline-table;
          padding-left: 5px;
          width: 80%;
          margin-top: 0;
          position: relative;
          top: -2px;
          }
          .mktoButtonRow {
          margin-top: 15px;
          display: block;
          margin-bottom: 20vh;
          }
          .mktoFormRow:empty, .mktoFormRowTop:empty{display:none}
          .mktoFormRowTop[data-mktofield]{
  
          margin-bottom: 5px;
          }
          form {
          max-width: 600px;
          margin: 0 auto;
          display: flex !important;
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
          min-height: 100vh;
          }
  
          .mktoPlaceholder:empty{display:none}
  
          .mktoRequiredField label::after {
          content: '*';
          }
  
       `;
  }
}

export function templateManager() {
  mktoCss_LP();

  const template_2_fields = {
    templates: 'form.template',
    purpose: 'form.subtype',
    formSuccessType: 'form.success.type',
    formVersion: 'form id',
    field_visibility: {
      name: 'field_visibility.name',
      phone: 'field_visibility.phone',
      company: 'field_visibility.company',
      website: 'field_visibility.website',
      state: 'field_visibility.state',
      postcode: 'field_visibility.postcode',
      company_size: 'field_visibility.company_size',
      comments: 'field_visibility.comments',
      demo: 'field_visibility.demo',
    },
    field_filters: {
      functional_area: 'field_filters.functional_area',
      products: 'field_filters.products',
      industry: 'field_filters.industry',
      job_role: 'field_filters.job_role',
    },
  };

  const templates = [];

  // This function will generate the template example with options available on the configurator
  function generateTemplateElem(templateSrc) {
    const templateExample = {
      [templateSrc]: {
        formVersion: getSelectOptions(template_2_fields.formVersion),
        purpose: getSelectOptions(template_2_fields.purpose),
        formSuccessType: getSelectOptions(template_2_fields.formSuccessType),
        field_visibility: {},
        field_filters: {},
      },
    };
    const populateFields = (fields, category) => {
      Object.keys(fields).forEach((key) => {
        const fieldId = fields[key];
        if (fieldId) {
          templateExample[templateSrc][category][key] = getSelectOptions(fieldId);
        }
      });
    };
    populateFields(template_2_fields.field_visibility, 'field_visibility');
    populateFields(template_2_fields.field_filters, 'field_filters');
    templates.push(templateExample);
  }

  // This function will get the options available in the field on the page
  function getSelectOptions(fieldId) {
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) return [''];
    let options = Array.from(selectElement.options)
      .map((option) => `${option.value}:${option.text}`)
      .join(',');
    options = options
      .split(',')
      .filter((item) => item.split(':')[0] !== '')
      .join(',');
    return [options];
  }

  // Output the template example file.
  function buildTemplates() {
    const selectElement = document.getElementById('form.template')?.querySelectorAll('option');
    selectElement?.forEach((template) => {
      if (template.value) {
        generateTemplateElem(template.value);
      }
    });
    mkfC.groupCollapsed(
      '\n\n\n################################\n'
          + '## Click here to copy this template code '
          + 'and paste it in the templatesRules.js file\n'
          + '## Remember each item can only contain one option'
          + ' in the final version of templatesRules.\n'
          + '################################\n\n\n',
    );

    mkfC.log(`const templateRules = \n${JSON.stringify(templates, null, 2)}`);
    mkfC.groupEnd();
  }

  // This is a function that checks the template options and returns an error message if there are any issues
  function checkTemplateOptions(templateRules) {
    const errors = [];
    templateRules.forEach((template) => {
      Object.keys(template).forEach((templateName) => {
        const templateData = template[templateName];
        const templateNameError = checkFields(templateData, templateName, 'formVersion');
        const purposeError = checkFields(templateData, templateName, 'purpose');
        const formSuccessTypeError = checkFields(templateData, templateName, 'formSuccessType');
        const fieldVisibilityError = checkNestedFields(
          templateData.field_visibility,
          templateName,
          'field_visibility',
        );
        const fieldFiltersError = checkNestedFields(
          templateData.field_filters,
          templateName,
          'field_filters',
        );
        if (
          templateNameError
            || purposeError
            || formSuccessTypeError
            || fieldVisibilityError
            || fieldFiltersError
        ) {
          errors.push(
            templateNameError,
            purposeError,
            formSuccessTypeError,
            fieldVisibilityError,
            fieldFiltersError,
          );
        }
      });
    });
    if (errors.length > 0) {
      mkfC.log('Bad News, Errors found in templateRules.js file, please review and fix.');
      mkfC.log(errors);
      return false;
    }
    mkfC.log('Good News. No errors found in templateRules.js file.');
    return true;
  }

  // This function checks if the option exists in the field on the page
  function checkOptionExists(fieldId, valOption, template) {
    const valOptionArray = valOption.split(':');
    if (valOptionArray.length !== 2) {
      mkfC.log(
        `The value:option pair '${valOption}' is not valid in the field '${fieldId}'.`,
      );
      return false;
    }
    const optionValue = valOptionArray[0];
    const optionText = valOptionArray[1];
    let fieldKey = '';
    Object.keys(template_2_fields).find((key) => {
      if (key === fieldId) {
        fieldKey = template_2_fields[key];
      }
    });
    if (!fieldKey) {
      mkfC.log(`Field '${fieldId}' is missing in the template_2_fields object.`);
      return false;
    }
    const selectElement = document.getElementById(fieldKey);
    if (!selectElement) {
      mkfC.log(
        `Field '${fieldKey}' is missing, please check your template '${template}'.`,
      );
      return false;
    }
    const options = Array.from(selectElement.options);
    const optionFound = options.some((opt) => opt.value === optionValue);
    if (!optionFound) {
      return false;
    }
    return true;
  }

  // This function checks the fields and returns an error message
  // if there are any issues as well as removing the field if it does not exist
  function checkFields(templateData, templateName, fieldName) {
    if (templateData[fieldName] && templateData[fieldName].length > 0) {
      const options = templateData[fieldName][0].split(',');
      if (options.length > 1) {
        mkfC.log(
          `Template: ${
            templateName
          }, Preference: ${
            fieldName
          },\n`
              + `contains more than one option:\n${
                options.join(', ')
              }\nWe can only use the first one: ${
                options[0]
              }\n`
              + 'Please check your templateRules file.\n\n',
        );
      }
      if (!checkOptionExists(fieldName, options[0], templateName)) {
        mkfC.log(
          `Template: ${
            templateName
          }, Preference: ${
            fieldName
          }, does not contain the option ${
            options[0]
          }.\n`
              + 'Please check your templateRules file.\n\n',
        );
        delete templateData[fieldName];
      } else {
        templateData[fieldName][0] = options[0];
      }
    } else {
      mkfC.log(
        `Template: ${
          templateName
        }, Preference: ${
          fieldName
        }, contains no options and will be removed.\n`
            + 'Please check your templateRules file.\n\n',
      );
      delete templateData[fieldName];
    }
  }

  // This function checks the nested fields and returns an error message
  // if there are any issues as well as removing the field if it does not exist
  function checkNestedFields(nestedFields, templateName, parentFieldName) {
    Object.keys(nestedFields).forEach((fieldName) => {
      if (nestedFields[fieldName][0].split(',').length > 1) {
        const options = nestedFields[fieldName][0].split(',');
        const firstOption = options[0];
        if (firstOption) {
          mkfC.log(
            `Template: ${
              templateName
            }, Preference: ${
              parentFieldName
            }.${
              fieldName
            },\n`
                + `contains more than one option:\n${
                  options.join(',\n')
                }\nWe can only use the first one: ${
                  firstOption
                }\n`
                + 'Please check your templateRules file.\n\n',
          );
          nestedFields[fieldName][0] = firstOption;
        } else {
          mkfC.log(
            `Template: ${
              templateName
            }, Preference: ${
              parentFieldName
            }.${
              fieldName
            },\n`
                + 'contains no options and will be removed.\n'
                + 'Please check your templateRules file.\n\n',
          );
          delete nestedFields[fieldName];
        }
      }
    });
  }

  function setTemplate(templateValue) {
    templateValue = templateValue.split(':')[0];
    if (!templateValue && templateValue !== '') {
      mkfC.log('Template is value is empty.');
    } else {
      const myRules = templateRules.filter(
        (template) => Object.keys(template)[0] === templateValue,
      )[0][templateValue];
      if (!myRules) {
        mkfC.log(`Template ${templateValue} does not exist in templateRules.js file.`);
      } else {
        buildTemplates();

        let templateLog = '\n\n\n################################\n';
        templateLog += '##\n';
        templateLog += `## Template '${templateValue}' selected.\n`;
        templateLog += '##\n';
        templateLog += '## Updating fields.\n';
        templateLog += '##\n';

        const event = new Event('change', { bubbles: true });
        if (myRules.formVersion) {
          const formId = myRules.formVersion[0].split(':')[0];
          if (formId) {
            templateLog += `## Version Form ID: ${formId}\n`;
            document.getElementById('form id').value = formId;
            document.getElementById('form id').dispatchEvent(event);
          }
        }
        if (myRules.formSuccessType) {
          const formSuccessType = myRules.formSuccessType[0].split(':')[0];
          if (formSuccessType) {
            templateLog += `## Success Type: ${formSuccessType}\n`;
            document.getElementById('form.success.type').value = formSuccessType;
            document.getElementById('form.success.type').dispatchEvent(event);
          }
        }
        if (myRules.purpose) {
          const purpose = myRules.purpose[0].split(':')[0];
          if (purpose) {
            templateLog += `## Purpose: ${purpose}\n`;
            document.getElementById('form.subtype').value = purpose;
            document.getElementById('form.subtype').dispatchEvent(event);
          }
        }
        if (myRules.field_visibility) {
          templateLog += '## \n## Field Visibility:\n';
          const { field_visibility } = myRules;
          Object.keys(field_visibility).forEach((key) => {
            const fieldId = field_visibility[key][0].split(':')[0];
            if (fieldId) {
              templateLog += `##  -${key} = "${fieldId}"\n`;
              document.getElementById(`field_visibility.${key}`).value = fieldId;
              document.getElementById(`field_visibility.${key}`).dispatchEvent(event);
              // mkfC.log(document.getElementById("field_visibility." + key));
            }
          });
        }
        if (myRules.field_filters) {
          templateLog += '## \n## Field Filters:\n';
          const { field_filters } = myRules;
          Object.keys(field_filters).forEach((key) => {
            const fieldId = field_filters[key][0].split(':')[0];
            if (fieldId) {
              templateLog += `##  -${key} = "${fieldId}"\n`;
              document.getElementById(`field_filters.${key}`).value = fieldId;
              document.getElementById(`field_filters.${key}`).dispatchEvent(event);
            }
          });
        }
        templateLog += '##\n';
        templateLog += '##\n';
        templateLog += '################################\n\n\n';

        mkfC.log(templateLog);
      }
    }
  }

  // Kick things off by checking if the configurator exists on the page
  const marketoConfigExists = document.querySelector('.marketo-config') !== null;
  if (marketoConfigExists) {
    mkfC.log('Template Manager - Loaded');
    const templateSrc = document.getElementById('form.template');
    const templateOptions = templateSrc?.querySelectorAll('option');
    if (templateRules.length > 0 && templateOptions.length > 0) {
      mkfC.log(
        '\n\n\n################################\n\n'
            + '## Marketo Config Interface exists. Starting Template Manager.\n\n'
            + '################################\n\n\n',
      );
      if (
        typeof templateRules !== 'undefined'
          && Array.isArray(templateRules)
          && templateRules.length > 0
      ) {
        const checkRules = checkTemplateOptions(templateRules);
        if (checkRules) {
          templateSrc.addEventListener('change', function () {
            setTemplate(this.value);
          });
        }
        buildTemplates();
      } else if (typeof templateRules !== 'undefined') {
        const errorMessage = templateRules
          ? 'templateRules does not contain any templates, please review and fix.'
          : 'templateRules does not exist, please review and fix.';
        mkfC.log(errorMessage);
        buildTemplates();
      } else {
        mkfC.log('templateRules does not exist, please review and fix.');
        buildTemplates();
      }
    }
  }
}

export default async function init(mkfCm, form_dynamics) {
  mkfC = mkfCm;
}
