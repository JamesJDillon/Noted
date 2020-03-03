const fs = require('fs').promises;
const readline = require('readline');
const { console } = require('./logger.service');

class ConfigService {
  /**
    * Opens specified config file and returns the parsed object.
    * @param   {string} path path to the config file we're opening.
    *
    * @returns {object { markdownDir, templateDir, outputDir }}
    *
  */
  static async getConfig(path) {
    try {
      const config = JSON.parse(await fs.readFile(path, 'utf8'));
      const isValid = ('templateDir' in config) && ('outputDir' in config)
        && ('markdownDir' in config);

      return isValid ? config : {};
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  /**
    * Lets the user update their config values.
    * @param   {string} markdownDir The current markdownDir config value.
    * @param   {string} templateDir The current templateDir config value.
    * @param   {string} outputDir The current outputDir config value.

    *
    * @returns {object { markdownDir, templateDir, outputDir }} config
    *
  */
  static async getConfigValues({ templateDir, outputDir, markdownDir }) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const temp = {
      templateDir: await ConfigService.ask(rl, 'Template directory', templateDir),
      outputDir: await ConfigService.ask(rl, 'Output directory', outputDir),
      markdownDir: await ConfigService.ask(rl, 'Markdown directory', markdownDir),
    };

    rl.close();
    return temp;
  }


  /**
    * Prints a question, and waits for input.
    * @param   {Object} readline Readline instance to get user input.
    * @param   {string} question The question to be asked.
    * @param   {string} existing The existing value for the question.

    *
    * @returns {string} answer Answer to the question.
    *
  */
  static ask(readline, question, existing) {
    console.log(`${question} (${existing || ''}): `);
    return new Promise(res => {
      readline.on('line', (line) => {
        res(line === '' ? existing : line);
      });
    });
  }
}

module.exports = ConfigService;
