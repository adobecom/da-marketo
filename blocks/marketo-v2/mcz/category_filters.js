// <![CDATA[
// ##
// ## Updated 20240117T190031
// ##
// ##
// ##
// ## Category Filters
// ##
// ##
let mkfC;

export function categoryFilters() {
  let fld_push_mktoFormsFunctionalAreaCategory;

  let fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval;
  fld_push_mktoFormsFunctionalAreaCategory = async function () {
    const mktoFormsFunctionalAreaCategory = document.querySelector(
      '[name="mktoFormsFunctionalAreaCategory"]',
    );
    if (mktoFormsFunctionalAreaCategory) {
      const dispatchChangeEvent = (element, value) => {
        if (value.trim() !== element.value) {
          element.value = value.trim();
          const event = new Event('change', { bubbles: true });
          element.dispatchEvent(event);
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              element.dispatchEvent(event);
            }, 150 * i);
          }
        }
      };

      const updateCategoryFilter = (selector, property) => {
        const element = document.querySelector(selector);
        const value = window?.mcz_marketoForm_pref?.field_filters?.[property];
        if (value && value !== '') {
          dispatchChangeEvent(element, value);
        }
      };

      function refreshCategoryFilters() {
        const marketoConfigExists = document.querySelector('.marketo-config') !== null;
        if (!marketoConfigExists && fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval) {
          clearInterval(fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval);
          mkfC.log(
            'Marketo Config Interface no longer exists. Stopping field visibility check.',
          );
        }
        updateCategoryFilter('[name="mktoFormsFunctionalAreaCategory"]', 'functional_area');
        updateCategoryFilter('[name="mktoIndustryCategory"]', 'industry');
        updateCategoryFilter('[name="mktoFormsJobTitleCategory"]', 'job_role');
        updateCategoryFilter('[name="mktoprimaryProductInterestCategory"]', 'products');
      }

      refreshCategoryFilters();
      if (document.querySelector('.marketo-config')) {
        mkfC.log('Marketo Config Interface Found');
        if (fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval === undefined) {
          fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval = setInterval(
            refreshCategoryFilters,
            1000,
          );
        }
      }
    } else if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
      mkfC.log('Known Visitor - mktoFormsFunctionalAreaCategory');
    } else {
      setTimeout(fld_push_mktoFormsFunctionalAreaCategory, 20);
    }
  };

  fld_push_mktoFormsFunctionalAreaCategory();
}

export default async function init(mkfCm) {
  mkfC = mkfCm;
  mkfC.log('Category Filters - Loaded');
}
