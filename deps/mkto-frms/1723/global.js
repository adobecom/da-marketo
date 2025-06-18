// <![CDATA[
// ##
// ## Updated 20250221T214643
// ##
// ##
// ##  Marketo Global Form Functions
// ##
// ##
if (typeof getMktoFormID == "undefined") {
  var adobeOrg = "";
  if (window?.imsOrgId) {
    adobeOrg = "AMCV_" + encodeURIComponent(window.imsOrgId) + ";";
  }

  window.checkAdobePrivacy = function () {
    if (typeof window?.adobePrivacy?.hasUserProvidedConsent === "function") {
      if (window?.adobePrivacy?.hasUserProvidedConsent()) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  };

  window.checkCookie = function (incMunchkin = true) {
    const cookieMatch = document.cookie.match(/_mkto_trk=([^;]+)/);
    if (!cookieMatch) return null;
    let cookieValue = cookieMatch[1];
    let munch = cookieValue.match(/id:([^&]+)/)[0].replace("id:", "#m:");
    if (incMunchkin === false) {
      return munch ? `${munch}` : null;
    }
    let tokenMatch = cookieValue.match(/&token:_mch-adobe\.com-([^&]+)/);
    if (tokenMatch) {
      let token = tokenMatch[1];
      let parts = token.split("-");
      if (parts.length === 2 && /^\d{9,}-\d{3,}$/.test(token)) {
        return `#c:${parts[0]}#v:${parts[1]}`;
      } else {
        return `#v:${token}`;
      }
    } else {
      return null;
    }
  };

  window.getMktoFormID = function () {
    if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
      return window.mcz_marketoForm_pref.form.id;
    }
    let mktoForm = document.querySelector("form.mktoForm");
    if (mktoForm) {
      let formId = document.querySelector("form.mktoForm")
        ? document.querySelector("form.mktoForm").id
        : null;
      formId = formId.replace("mktoForm_", "");
      formId = parseInt(formId);
      if (formId) {
        if (window?.mcz_marketoForm_pref?.form !== undefined) {
          window.mcz_marketoForm_pref.form["id"] = formId;
        }
        return formId;
      } else {
        mkf_c.log("ERROR: unable to get form ID");
        if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
          window.mcz_marketoForm_pref.form.id = null;
        }
        return null;
      }
    } else {
      mkf_c.log("ERROR: no Marketo form found");
      window.mcz_marketoForm_pref.form.id = null;
      return null;
    }
  };

  window.getUniqueID = function (formValues, bypass = false) {
    let unique_id_temp = "";
    let unique_id = mcz_marketoForm_pref?.profile?.unique_id;
    if (!bypass && unique_id !== "") {
      if (unique_id.indexOf("v:") > -1) {
        return unique_id;
      } else {
        let checkNew = getUniqueID(formValues, true);
        if (checkNew.indexOf("v:") > -1) {
          unique_id = checkNew;
          return checkNew;
        } else {
          return unique_id;
        }
      }
    }
    if (activeCookie && unique_id !== "" && !bypass) {
      return unique_id;
    }
    let munchkinId = "";
    if (formValues && formValues.munchkinId) {
      munchkinId = formValues.munchkinId;
    } else {
      let munchkinIdField = document.querySelector(".mktoForm[id] input[name='munchkinId']");
      if (munchkinIdField) {
        munchkinId = munchkinIdField.value;
      }
    }
    unique_id_temp += "#m:" + munchkinId;
    unique_id_temp += "#f:" + formValues.formid;
    unique_id_temp += "#t:" + new Date().getTime();

    if (checkAdobePrivacy()) {
      activeCookie = true;
      unique_id_temp += checkCookie(true);
    } else {
      activeCookie = false;
      unique_id_temp += checkCookie(false);
    }

    unique_id_temp = unique_id_temp.replace(/null/g, "");
    if (bypass) {
      return unique_id_temp;
    } else {
      unique_id = unique_id_temp;
      if (window?.mcz_marketoForm_pref?.profile !== undefined) {
        window.mcz_marketoForm_pref.profile.unique_id = unique_id;
      }
      return unique_id;
    }
  };

  window.mkto_addCSS = async function (mktoForm) {
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
  };
}

// ##
// ##
// ]]>