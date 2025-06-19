// <![CDATA[
// ##
// ## Updated 20250221T214643
// ##
// ##
// ##  Marketo Global Form Functions
// ##
// ##
export default async function init() {
  let adobeOrg = '';
  if (window?.imsOrgId) {
    adobeOrg = `AMCV_${encodeURIComponent(window.imsOrgId)};`;
  }

  window.checkAdobePrivacy = function () {
    if (typeof window?.adobePrivacy?.hasUserProvidedConsent === 'function') {
      if (window?.adobePrivacy?.hasUserProvidedConsent()) {
        return true;
      }
      return false;
    }
    return true;
  };

  window.checkCookie = function (incMunchkin = true) {
    const cookieMatch = document.cookie.match(/_mkto_trk=([^;]+)/);
    if (!cookieMatch) return null;
    const cookieValue = cookieMatch[1];
    const munch = cookieValue.match(/id:([^&]+)/)[0].replace('id:', '#m:');
    if (incMunchkin === false) {
      return munch ? `${munch}` : null;
    }
    const tokenMatch = cookieValue.match(/&token:_mch-adobe\.com-([^&]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const parts = token.split('-');
      if (parts.length === 2 && /^\d{9,}-\d{3,}$/.test(token)) {
        return `#c:${parts[0]}#v:${parts[1]}`;
      }
      return `#v:${token}`;
    }
    return null;
  };

  window.getMktoFormID = function () {
    if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
      return window.mcz_marketoForm_pref.form.id;
    }
    const mktoForm = document.querySelector('form.mktoForm');
    if (mktoForm) {
      let formId = document.querySelector('form.mktoForm')
        ? document.querySelector('form.mktoForm').id
        : null;
      formId = formId.replace('mktoForm_', '');
      formId = parseInt(formId);
      if (formId) {
        if (window?.mcz_marketoForm_pref?.form !== undefined) {
          window.mcz_marketoForm_pref.form.id = formId;
        }
        return formId;
      }
      mkf_c.log('ERROR: unable to get form ID');
      if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
        window.mcz_marketoForm_pref.form.id = null;
      }
      return null;
    }
    mkf_c.log('ERROR: no Marketo form found');
    window.mcz_marketoForm_pref.form.id = null;
    return null;
  };

  window.getUniqueID = function (formValues, bypass = false) {
    let unique_id_temp = '';
    let unique_id = mcz_marketoForm_pref?.profile?.unique_id;
    if (!bypass && unique_id !== '') {
      if (unique_id.indexOf('v:') > -1) {
        return unique_id;
      }
      const checkNew = getUniqueID(formValues, true);
      if (checkNew.indexOf('v:') > -1) {
        unique_id = checkNew;
        return checkNew;
      }
      return unique_id;
    }
    if (activeCookie && unique_id !== '' && !bypass) {
      return unique_id;
    }
    let munchkinId = '';
    if (formValues && formValues.munchkinId) {
      munchkinId = formValues.munchkinId;
    } else {
      const munchkinIdField = document.querySelector(".mktoForm[id] input[name='munchkinId']");
      if (munchkinIdField) {
        munchkinId = munchkinIdField.value;
      }
    }
    unique_id_temp += `#m:${munchkinId}`;
    unique_id_temp += `#f:${formValues.formid}`;
    unique_id_temp += `#t:${new Date().getTime()}`;

    if (checkAdobePrivacy()) {
      activeCookie = true;
      unique_id_temp += checkCookie(true);
    } else {
      activeCookie = false;
      unique_id_temp += checkCookie(false);
    }

    unique_id_temp = unique_id_temp.replace(/null/g, '');
    if (bypass) {
      return unique_id_temp;
    }
    unique_id = unique_id_temp;
    if (window?.mcz_marketoForm_pref?.profile !== undefined) {
      window.mcz_marketoForm_pref.profile.unique_id = unique_id;
    }
    return unique_id;
  };


      const head = document.head || document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      head.appendChild(style);
      style.appendChild(document.createTextNode(baseCss));

      mktoForm.classList.add('mktoForm--styles-added');
    }
  };
}

// ##
// ##
// ]]>
