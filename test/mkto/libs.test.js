import { expect } from '@esm-bundle/chai';
import { register } from '../../mkto/libs.js';

describe('libs.js', () => {
  describe('register', () => {
    it('adds da-marketo to externalLibs when config has none', () => {
      let config = {};
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      expect(config.externalLibs).to.have.length(1);
      expect(config.externalLibs[0].blocks).to.include('da-marketo');
      expect(config.externalLibs[0].base).to.be.a('string').and.not.empty;
    });

    it('appends to existing externalLibs without removing prior entries', () => {
      let config = { externalLibs: [{ base: 'https://event-libs.aem.live', blocks: ['event-hero'] }] };
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      expect(config.externalLibs).to.have.length(2);
      expect(config.externalLibs[0].blocks).to.include('event-hero');
      expect(config.externalLibs[1].blocks).to.include('da-marketo');
    });

    it('renames .marketo elements to .da-marketo when decorateArea is called', () => {
      let config = {};
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      const area = document.createElement('div');
      const block = document.createElement('div');
      block.className = 'marketo';
      area.appendChild(block);
      config.decorateArea(area);
      expect(block.className).to.equal('da-marketo');
    });

    it('does not rename non-marketo elements', () => {
      let config = {};
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      const area = document.createElement('div');
      const block = document.createElement('div');
      block.className = 'some-other-block';
      area.appendChild(block);
      config.decorateArea(area);
      expect(block.className).to.equal('some-other-block');
    });

    it('chains a previously registered decorateArea', () => {
      const calls = [];
      let config = { decorateArea: () => calls.push('prev') };
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      config.decorateArea(document.createElement('div'));
      expect(calls).to.include('prev');
    });

    it('works when config has no prior decorateArea', () => {
      let config = {};
      register({
        getConfig: () => config,
        setConfig: (c) => { config = c; },
      });
      expect(() => config.decorateArea(document.createElement('div'))).to.not.throw();
    });
  });
});
