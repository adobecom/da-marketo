/**
 * Mock company enrichment: on Company blur, setTimeout + fixed mock data.
 * @param {string} companyValue - current Company field value
 * @param {function} onEnrich - (prefill: Record<string, string>) => void to apply enrichment
 */
export function runMockEnrichment(companyValue, onEnrich) {
  const trimmed = (companyValue || '').toString().trim().toLowerCase();
  if (!trimmed) return;

  const mockData = {
    Acme: { CompanyName: 'Acme Corp', Country: 'US', PostCode: '94105' },
    acme: { CompanyName: 'Acme Corp', Country: 'US', PostCode: '94105' },
    demo: { CompanyName: 'Demo Inc', Country: 'DE', PostCode: '10115' },
  };

  const prefill = mockData[trimmed] || mockData[trimmed.replace(/\s+/g, '')];
  if (!prefill) return;

  setTimeout(() => {
    onEnrich(prefill);
  }, 300);
}
