const fs = require('fs').promises;
const readline = require('readline');

class ConfigService {
  async getConfigObj() {
    try {
      return JSON.parse(await fs.readFile('./config.json', 'utf8'));
    } catch (e) {
      return {};
    }
  }

  async configExists() {
    try {
      await fs.readFile('./config.json', 'utf8');
      return true;
    } catch(e) {
      if (e.code === 'ENOENT') return false;
      return true;
    }
  }

  async getConfigValues({ templateDir, outputDir, markdownDir }) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    const temp = {
      templateDir:  await this.ask(rl, "Template directory", templateDir),
      outputDir:    await this.ask(rl, "Output directory", outputDir),
      markdownDir:  await this.ask(rl, "Markdown directory", markdownDir),
    };

    rl.close();
    return temp;
  }

  ask(readline, question, existing){
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