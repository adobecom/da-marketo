// Marketo Global Form Functions

export function checkAdobePrivacy(adobePrivacy = window?.adobePrivacy) {
  if (typeof adobePrivacy?.hasUserProvidedConsent === 'function') {
    if (adobePrivacy.hasUserProvidedConsent()) {
      return true;
    }
    return false;
  }
  return true;
}

export function checkCookie(incMunchkin = true, cookieString = document.cookie) {
  const cookieMatch = cookieString.match(/_mkto_trk=([^;]+)/);
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
}

export function getMktoFormID(mczMarketoFormPref = window?.mcz_marketoForm_pref) {
  if (mczMarketoFormPref?.form?.id !== undefined) {
    return mczMarketoFormPref.form.id;
  }
  const mktoForm = document.querySelector('form.mktoForm');
  if (mktoForm) {
    let formId = document.querySelector('form.mktoForm')
      ? document.querySelector('form.mktoForm').id
      : null;
    formId = formId.replace('mktoForm_', '');
    formId = parseInt(formId, 10);
    if (formId) {
      if (mczMarketoFormPref?.form !== undefined) {
        mczMarketoFormPref.form.id = formId;
      }
      return formId;
    }
    // mkf_c.log('ERROR: unable to get form ID');
    if (mczMarketoFormPref?.form?.id !== undefined) {
      mczMarketoFormPref.form.id = null;
    }
    return null;
  }
  // mkf_c.log('ERROR: no Marketo form found');
  if (mczMarketoFormPref?.form) mczMarketoFormPref.form.id = null;
  return null;
}

export function getUniqueId(
  formValues,
  bypass = false,
  mczMarketoFormPref = window?.mcz_marketoForm_pref,
) {
  let uniqueIdTemp = '';
  let uniqueId = mczMarketoFormPref?.profile?.unique_id;
  if (!bypass && uniqueId !== '') {
    if (uniqueId.indexOf('v:') > -1) {
      return uniqueId;
    }
    const checkNew = getUniqueId(formValues, true, mczMarketoFormPref);
    if (checkNew.indexOf('v:') > -1) {
      uniqueId = checkNew;
      return checkNew;
    }
    return uniqueId;
  }
  if (window.activeCookie && uniqueId !== '' && !bypass) {
    return uniqueId;
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
  uniqueIdTemp += `#m:${munchkinId}`;
  uniqueIdTemp += `#f:${formValues.formid}`;
  uniqueIdTemp += `#t:${new Date().getTime()}`;

  if (checkAdobePrivacy()) {
    window.activeCookie = true;
    uniqueIdTemp += checkCookie(true);
  } else {
    window.activeCookie = false;
    uniqueIdTemp += checkCookie(false);
  }

  uniqueIdTemp = uniqueIdTemp.replace(/null/g, '');
  if (bypass) {
    return uniqueIdTemp;
  }
  uniqueId = uniqueIdTemp;
  if (mczMarketoFormPref?.profile !== undefined) {
    mczMarketoFormPref.profile.unique_id = uniqueId;
  }
  return uniqueId;
}
