import { expect } from '@esm-bundle/chai';
import { register } from '../../mkto/libs.js';

describe('libs.js', () => {
  describe('register', () => {
    it('preserves initialized Milo configuration without reinitializing it', () => {
      const config = {
        codeRoot: 'https://business.stage.adobe.com',
        autoBlocks: [{ video: '.mp4' }],
        doNotInline: ['accordion'],
        entitlements: () => Promise.resolve([]),
        resolveDeferred: () => {},
      };
      const initialConfig = { ...config };
      register({
        getConfig: () => config,
        setConfig: () => { throw new Error('Milo configuration must not be reinitialized'); },
      });
      Object.entries(initialConfig).forEach(([key, value]) => {
        expect(config[key]).to.equal(value);
      });
      expect(config.externalLibs[0].blocks).to.include('da-marketo');
    });

    it('adds da-marketo to externalLibs when config has none', () => {
      const config = {};
      register({ getConfig: () => config });
      expect(config.externalLibs).to.have.length(1);
      expect(config.externalLibs[0].blocks).to.include('da-marketo');
      expect(config.externalLibs[0].blocks).to.include('da-marketo-config');
      expect(config.externalLibs[0].base).to.be.a('string').and.not.empty;
    });

    it('appends to existing externalLibs without removing prior entries', () => {
      const config = { externalLibs: [{ base: 'https://event-libs.aem.live', blocks: ['event-hero'] }] };
      register({ getConfig: () => config });
      expect(config.externalLibs).to.have.length(2);
      expect(config.externalLibs[0].blocks).to.include('event-hero');
      expect(config.externalLibs[1].blocks).to.include('da-marketo');
    });

    it('renames .marketo elements to .da-marketo when decorateArea is called', () => {
      const config = {};
      register({ getConfig: () => config });
      const area = document.createElement('div');
      const block = document.createElement('div');
      block.className = 'marketo';
      area.appendChild(block);
      config.decorateArea(area);
      expect(block.className).to.equal('da-marketo');
    });

    it('does not rename non-marketo elements', () => {
      const config = {};
      register({ getConfig: () => config });
      const area = document.createElement('div');
      const block = document.createElement('div');
      block.className = 'some-other-block';
      area.appendChild(block);
      config.decorateArea(area);
      expect(block.className).to.equal('some-other-block');
    });

    it('chains a previously registered decorateArea', () => {
      const calls = [];
      const config = { decorateArea: () => calls.push('prev') };
      register({ getConfig: () => config });
      config.decorateArea(document.createElement('div'));
      expect(calls).to.deep.equal(['prev']);
    });

    it('works when config has no prior decorateArea', () => {
      const config = {};
      register({ getConfig: () => config });
      expect(() => config.decorateArea(document.createElement('div'))).to.not.throw();
    });
  });
});
