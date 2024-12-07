// ##
// ## Updated 20240117T111827
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