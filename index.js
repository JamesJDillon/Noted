const fs = require('fs').promises;
const path = require('path');
const open = require('open');

const ConfigService = require('./config.service');
const GeneratorService = require('./generator.service');

class Generator {
  async init(args) {
    const config = await ConfigService.getConfig();

    const methods = {
      config: (args) => Generator.config(args, config),
      list: (args) => Generator.list(args, config),
      build: (args) => Generator.build(args, config),
      add: (args) => Generator.add(args, config),
      help: (args) => Generator.help(args, config),
    };

    const [first, second, ...tail] = args;
    const action = Generator.parseArguments(tail);
    this.evalArguments(action, config, methods);
  }

  static async config(args, config) {
    const newConfig = await ConfigService.getConfigValues(config);
    await fs.writeFile('./config.json', JSON.stringify(newConfig));
  }

  static async list(args, config) {
    console.log('[Markdown files]');
    const markdownFiles = await fs.readdir(config.markdownDir);
    markdownFiles.forEach((file) => {
      const ext = file.substring(file.length, file.length - 3);
      if (ext === '.md') {
        console.log(file);
      }
    });

    console.log('[HTML files]');
    const htmlFiles = await fs.readdir(config.outputDir);
    htmlFiles.forEach((file) => {
      const ext = file.substring(file.length, file.length - 5);
      if (ext === '.html') {
        console.log(file);
      }
    });
  }

  static async build(args, { outputDir, templateDir, markdownDir }) {
    const [flag] = args;

    // delete the contents of the output directory.
    await GeneratorService.deleteOldFiles(outputDir);

    // create a list of the post objects.
    const posts = await GeneratorService.getPosts(templateDir, markdownDir);

    // create the individual blog html files from the list of objects.
    await GeneratorService.generatePosts(posts, outputDir);

    // create and save the index page.
    await GeneratorService.generateIndex(posts, templateDir, outputDir);

    // copy the asset files from the template directory
    await GeneratorService.copy(`${templateDir}assets`, `${outputDir}assets`);

    if (flag === '--open') await open(`${outputDir}index.html`);
  }

  static async add(args, config) {
    try {
      const [file] = args;
      const fileName = path.basename(file);
      const dest = path.join(config.markdownDir, fileName);

      try {
        await fs.rename(file, dest);
        console.log(`${file} => ${dest}`);
        console.log('Move complete.');
      } catch (e) {
        console.log('Could not move file.');
        console.log('ERROR ', e);
      }
    } catch (e) {
      console.log('ERROR ', e);
    }
  }

  static async help() {
    const help = await fs.readFile('./help.txt', 'utf8');
    console.log(help);
  }

  static parseArguments(args) {
    if (args.length === 0) throw Error('Arguments required.');

    const [first, second] = args;
    return {
      action: first,
      arguments: [second],
    };
  }

  async evalArguments(args, config, methods) {
    if (config === {}) await this.config();

    const action = methods[args.action];
    if (action === undefined) throw Error('Invalid argument.');
    return action(args.arguments);
  }
}

const generator = new Generator();
generator.init(process.argv);
