// ##
// ## Updated 20240117T190031
// ##
// ##
// ##
// ## Category Filters
// ##
// ##

if (typeof categoryFilters == "undefined") {
  mkf_c.log("Category Filters - Loaded");
  function categoryFilters() {
    var fld_push_mktoFormsFunctionalAreaCategory;

    var fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval;
    fld_push_mktoFormsFunctionalAreaCategory = async function () {
      let mktoFormsFunctionalAreaCategory = document.querySelector(
        '[name="mktoFormsFunctionalAreaCategory"]'
      );
      if (mktoFormsFunctionalAreaCategory) {
        const dispatchChangeEvent = (element, value) => {
          if (value.trim() !== element.value) {
            element.value = value.trim();
            const event = new Event("change", { bubbles: true });
            element.dispatchEvent(event);
            for (let i = 0; i < 10; i++) {
              setTimeout(function () {
                element.dispatchEvent(event);
              }, 150 * i);
            }
          }
        };

        const updateCategoryFilter = (selector, property) => {
          const element = document.querySelector(selector);
          const value = window?.mcz_marketoForm_pref?.field_filters?.[property];
          if (value && value !== "") {
            dispatchChangeEvent(element, value);
          }
        };

        function refreshCategoryFilters() {
          let marketoConfigExists = document.querySelector(".marketo-config") !== null;
          if (!marketoConfigExists && fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval) {
            clearInterval(fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval);
            mkf_c.log(
              "Marketo Config Interface no longer exists. Stopping field visibility check."
            );
          }
          updateCategoryFilter('[name="mktoFormsFunctionalAreaCategory"]', "functional_area");
          updateCategoryFilter('[name="mktoIndustryCategory"]', "industry");
          updateCategoryFilter('[name="mktoFormsJobTitleCategory"]', "job_role");
          updateCategoryFilter('[name="mktoprimaryProductInterestCategory"]', "products");
        }

        refreshCategoryFilters();
        if (document.querySelector(".marketo-config")) {
          mkf_c.log("Marketo Config Interface Found");
          if (fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval === undefined) {
            fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval = setInterval(
              refreshCategoryFilters,
              1000
            );
          }
        }
      } else {
        if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
          mkf_c.log("Known Visitor - mktoFormsFunctionalAreaCategory");
        } else {
          setTimeout(fld_push_mktoFormsFunctionalAreaCategory, 20);
        }
      }
    };

    fld_push_mktoFormsFunctionalAreaCategory();
  }
}

// ##
// ##