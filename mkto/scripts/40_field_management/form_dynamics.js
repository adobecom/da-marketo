// ##
// ## Updated 20240117T111827
// ## 40_field_management/form_dynamics.js
// ##

if (typeof form_dynamics == "undefined") {
  function isSafariBrowser() {
    var userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes("safari") && !userAgent.includes("chrome");
  }
  var form_dynamics = true;
  if (isSafariBrowser()) {
    if (typeof marketoFormSetup == "function") {
     // marketoFormSetup("stage1");
    }
  }
}


// ##
// ##

//# sourceURL=form_dynamics.js
