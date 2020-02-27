const fs = require('fs').promises;
const readline = require('readline');

class ConfigService {
  static async getConfig() {
    try {
      return JSON.parse(await fs.readFile('./config.json', 'utf8'));
    } catch (e) {
      return {};
    }
  }

  static async configExists() {
    try {
      await fs.readFile('./config.json', 'utf8');
      return true;
    } catch (e) {
      if (e.code === 'ENOENT') return false;
      return true;
    }
  }

  static async getConfigValues({ templateDir, outputDir, markdownDir }) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const temp = {
      templateDir: await ConfigService.ask(rl, "Template directory", templateDir),
      outputDir: await ConfigService.ask(rl, "Output directory", outputDir),
      markdownDir: await ConfigService.ask(rl, "Markdown directory", markdownDir),
    };

    rl.close();
    return temp;
  }

  static ask(readline, question, existing) {
    console.log(`${question} (${existing || ''}): `);
    return new Promise(res => {
      readline.on('line', (line) => {
        // If nothing is entered, default to the existing value.
        res(line === '' ? existing : line);
      });
    });
  }
}

module.exports = ConfigService;