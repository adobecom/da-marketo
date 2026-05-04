import { LIBS } from '../scripts/libs.js';

const {
  parseEncodedConfig,
  loadScript,
  loadLink,
  localizeLink,
  createTag,
  getConfig,
  createIntersectionObserver,
  loadStyle,
  loadBlock,
  utf8ToB64,
  SLD,
  MILO_EVENTS,
} = await import(`${LIBS}/utils/utils.js`);

export {
  parseEncodedConfig,
  loadScript,
  loadLink,
  localizeLink,
  createTag,
  getConfig,
  createIntersectionObserver,
  loadStyle,
  loadBlock,
  utf8ToB64,
  SLD,
  MILO_EVENTS,
};
