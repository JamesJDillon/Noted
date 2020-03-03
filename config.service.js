const fs = require('fs').promises;
const readline = require('readline');
const { console } = require('./logger.service');

class ConfigService {
  static async getConfig(path) {
    try {
      const config = JSON.parse(await fs.readFile(path, 'utf8'));
      const isValid = ('templateDir' in config) && ('outputDir' in config)
        && ('markdownDir' in config);

      return isValid ? config : {};
    } catch (e) {
      return {};
    }
  }

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
