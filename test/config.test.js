const { assert, expect } = require('chai');
const readline = require('readline');
const { getConfig, getConfigValues, ask} = require('../config.service');

describe('Config Service', () => {
  describe('#getConfig', () => {
    it('should return an empty object when path is invalid', async () => {
      const result = await getConfig('./nothinghere');
      assert.deepEqual(result, {});
    });

    it('should return an empty object when config file does not exist.', async () => {
      const result = await getConfig('doesnotexist');
      assert.deepEqual(result, {});
    });

    it('should return an empty object when config file is invalid.', async () => {
      const result = await getConfig('./test/files/invalid-config.test.json');
      assert.deepEqual(result, {});
    });

    it('should return a config object when the config is valid', async () => {
      const result = await getConfig('./test/files/valid-config.test.json');
      expect(result).to.have.all.keys(['templateDir', 'outputDir', 'markdownDir']);
    });
  });

  describe('#ask, #getConfigValue', () => {
    let stdin;
    let rl;
    beforeEach(() => {
      stdin = require('mock-stdin').stdin();
      rl = readline.createInterface({
        input: stdin,
        output: process.stdout,
        terminal: false,
      });
    });

    it('should ask the user a question and return their string', async () => {
      const input = 'This is example input.';
      process.nextTick(() => stdin.send(`${input}\r`));

      const resp = await ask(rl, '', 'default');
      assert.strictEqual(resp, input);
    });

    it('should ask the user a question and return the default string', async () => {
      const input = '';
      process.nextTick(() => stdin.send(`${input}\r`));

      const resp = await ask(rl, '', 'default');
      assert.strictEqual(resp, 'default');
    });

    it('should ask the user for their config details and return an object of the input', async () => {
      const sleep = (ms) => new Promise(res => setTimeout(res, ms));
      const config = {
        templateDir: 'example',
        outputDir: 'placeholder',
        markdownDir: 'data',
      };
      
      process.nextTick(async () => { 
        const input = 'test';
        stdin.send(`${input}\r`);
        // need to sleep so multiple lines can be entered.
        await sleep(1);
        stdin.send(`${input}\r`);
        await sleep(1);
        stdin.send(`${input}\r`);
      });

      const resp = await getConfigValues(config);

      expect(resp).to.deep.equal({
        templateDir: 'test',
        outputDir: 'test',
        markdownDir: 'test',
      });
    });

    it('should ask the user for their config details and return the default input', async () => {
      const sleep = (ms) => new Promise(res => setTimeout(res, ms));
      const config = {
        templateDir: 'test',
        outputDir: 'test',
        markdownDir: 'test',
      };

      process.nextTick(async () => { 
        const input = '\r';
        stdin.send(input);
        await sleep(1);
        stdin.send(input);
        await sleep(1);
        stdin.send(input);
      });

      const resp = await getConfigValues(config);

      expect(resp).to.deep.equal(config);
    });
  })
});
