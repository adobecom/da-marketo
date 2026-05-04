import { LIBS } from '../scripts/libs.js';

const { debounce } = await import(`${LIBS}/utils/action.js`);

// eslint-disable-next-line import/prefer-default-export
export { debounce };
