/**
 * Compute effective steps: only steps that have at least one visible field.
 * Used for multi-step navigation and to skip empty steps after PP.
 * @param {{ steps: Array<{ stepIndex: number, fieldIds: string[] }>, fields: Array<{ id: string, visible?: boolean }> }} config - steps and fields with visibility
 * @returns {Array<{ stepIndex: number, fieldIds: string[], visibleCount: number }>}
 */
export function getEffectiveSteps(config) {
  const { steps = [], fields = [] } = config;
  const visibleById = new Map(fields.map((f) => [f.id, f.visible !== false]));

  return steps
    .map((step) => {
      const visibleCount = step.fieldIds.filter((id) => visibleById.get(id)).length;
      return { ...step, visibleCount };
    })
    .filter((step) => step.visibleCount > 0);
}
