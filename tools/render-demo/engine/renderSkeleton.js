/**
 * Render skeleton DOM from config. Derives field count from form metadata:
 * - Multi-step: first step's field count (reflects first step only).
 * - Single-step: total config fields (all visible on one screen).
 * Wrapper and grid match form-demo-form-wrapper dimensions (max-width, padding)
 * and form fieldset layout (2-col grid, same gaps). Includes heading placeholder
 * when config has formHeadingKey and button-area placeholder so height matches final render.
 * @param {object} config - RenderConfig
 * @param {HTMLElement} container
 */
export function renderSkeleton(config, container) {
  const steps = config.steps || [];
  const step0 = steps.find((s) => s.stepIndex === 0);
  const multiStep = config.features?.multiStep && steps.length > 1;
  const hasHeading = Boolean(config.formHeadingKey);

  const fieldCount = multiStep
    ? (step0?.fieldIds?.length ?? 0)
    : (config.fields?.length ?? 0);

  const rowCount = Math.ceil(fieldCount / 2) || 1;

  const outer = document.createElement('div');
  outer.className = 'form-demo-skeleton-wrapper';
  outer.setAttribute('aria-hidden', 'true');

  if (hasHeading) {
    const headingPlaceholder = document.createElement('div');
    headingPlaceholder.className = 'form-demo-skeleton-heading';
    outer.appendChild(headingPlaceholder);
  }

  const grid = document.createElement('div');
  grid.className = 'form-demo-skeleton';

  let cellIndex = 0;
  for (let r = 0; r < rowCount; r += 1) {
    const cellsInRow = Math.min(2, fieldCount - cellIndex);
    for (let c = 0; c < cellsInRow; c += 1) {
      const cell = document.createElement('div');
      cell.className = 'form-demo-skeleton-field';
      cell.innerHTML = '<span></span><span></span>';
      grid.appendChild(cell);
      cellIndex += 1;
    }
  }

  const buttonPlaceholder = document.createElement('div');
  buttonPlaceholder.className = 'form-demo-skeleton-button';
  grid.appendChild(buttonPlaceholder);

  outer.appendChild(grid);
  container.appendChild(outer);
  return { fieldCount, rowCount, hasHeading };
}
