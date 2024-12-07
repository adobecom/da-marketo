// ##
// ## Known Visitor
// ##
// ##

var knownMktoVisitor = true;
if (typeof knownVisitor != "function") {
  window.knownVisitor = function () {
    var leadFirstName = "{{lead.FirstName}}";

    console.log("Known Visitor - Triggered for " + leadFirstName);

    var checkNotYou = setInterval(function () {
      var notYouElements = document.querySelectorAll(".mktoNotYou:not(.notYouFound)");
      if (notYouElements.length > 0) {
        clearInterval(checkNotYou);
        notYouElements.forEach((element) => {
          element.classList.add("notYouFound");
          element.setAttribute("href", "#");

          element.addEventListener("click", function (event) {
            event.preventDefault();

            let currentHref = document.location.href;
            if (currentHref.indexOf("mkt_tok") > -1) {
              currentHref = currentHref.replace(/mkt_tok=[^&]+&?/g, "");
            }
            if (currentHref.indexOf("aliId") > -1) {
              currentHref = currentHref.replace(/aliId=[^&]+&?/g, "");
            }

            sessionStorage.removeItem("mktoPreFillFields");
            localStorage.removeItem("mkt_tok");
            let rootDomain = document.location.hostname;
            document.cookie =
              "_mkto_trk=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + rootDomain;
            if (window.history && window.history.pushState) {
              currentHref = currentHref.replace(/[&?]$/, "");
              window.history.pushState({}, "", currentHref);
              location.reload();
            } else {
              document.location = currentHref.replace(/[&?]$/, "");
            }
          });
        });
      }
    }, 250);

    if (typeof window.marketoFormSetup === "function") {
      if (window?.mcz_marketoForm_pref?.profile === undefined) {
        window.mcz_marketoForm_pref["profile"] = { known_visitor: true };
      } else {
        window.mcz_marketoForm_pref.profile["known_visitor"] = true;
      }
      marketoFormSetup("stage1");
      marketoFormSetup();
    } else {
      if (!mcz_marketoForm_pref.profile) {
        mcz_marketoForm_pref["profile"] = { known_visitor: true, prefLanguage: "en_us" };
      } else {
        mcz_marketoForm_pref.profile["known_visitor"] = true;
      }
    }

    function knownMktoVisitorFunction() {
      console.log("knownMktoVisitor called");

      let mktoForm = document.querySelector(".mktoForm[style]");
      let language = mcz_marketoForm_pref?.profile?.prefLanguage;

      if (language && language !== null) {
        mcz_marketoForm_pref.profile.known_visitor = true;
        if (language) {
          language = language.toLowerCase();
          language = language.replace("-", "_");
        } else {
          language = "en_us";
          console.log("No language found, defaulting to en_us");
        }

        for (var key in translateFormElems) {
          if (translateFormElems.hasOwnProperty(key)) {
            let langDef = document.querySelector(`[lang-def="${key}"]`);
            if (langDef) {
              console.log("langDef found for " + key);

              let translatedElem = translateFormElems[key][language];
              if (translatedElem) {
                let link = langDef.querySelector("a");
                if (link) {
                  console.log("link found for " + key);
                  langDef = link;
                }

                langDef.innerHTML = translatedElem;
              } else {
                console.log(
                  "Check General_Translations, No translated '" +
                    key +
                    "' text found for language: " +
                    language
                );
              }
            }
          }
        }

        let langDef_btn = document.querySelector(`.mktoButton`);
        if (langDef_btn) {
          const subtypeRules = mcz_marketoForm_pref?.form?.subtypeRules;
          var subtype = mcz_marketoForm_pref?.form?.subtype;
          if (subtype) {
            if (subtypeRules && subtypeRules !== null) {
              var subtypeRule = subtypeRules[subtype];
              if (subtypeRule) {
                let translatedSubmit = translateFormElems[subtypeRule];
                if (translatedSubmit) {
                  translatedSubmit = translatedSubmit[language];
                  if (translatedSubmit) {
                    langDef_btn.innerHTML = translatedSubmit;
                  } else {
                    console.log(
                      "Check General_Translations, No translated '" +
                        subtypeRule +
                        "' text found for language: " +
                        language
                    );
                  }
                } else {
                  console.log(
                    "Check General_Translations, No translated submit text found for button subtype: " +
                      subtypeRule
                  );
                }
              } else {
                console.log("No subtypeRule found for subtype: " + subtype);
              }
            } else {
              console.log("No subtypeRules found");
            }
          } else {
            console.log("No subtype found");
          }
        } else {
          console.log("No button found");
        }

        if (!mktoForm.classList.contains("mktoVisible")) {
          mktoForm.classList.add("mktoVisible");
          mktoForm.classList.add("mktoForm--fade-in");
        }
        if (mktoForm.hasAttribute("style") && mktoForm.getAttribute("style").length > 2) {
          mktoForm.removeAttribute("style");
          performance.mark("MarketoFormEnd");
          performance.measure("MarketoFormVisible", "MarketoFormStart", "MarketoFormEnd");
        }
      } else {
        setTimeout(knownMktoVisitorFunction, 200);
      }
    }
    knownMktoVisitorFunction();
  };
  knownVisitor();
}