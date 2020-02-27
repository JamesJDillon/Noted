/* 
  Algorithm:
  1. Check if config file exists.
    1.1 If it doesn't exist, walk user through building it.
      1.1.2 (template directory, output directory, markdown files directory)
    1.2 If it does exist, proceed.
  2. Parse command line arguments.
  3. Execute command line arguments.
    3.1 [config]              => view/update the config.
    3.2 [list]                => list markdown files, lists generated equivalents.
    3.3 [build]               => generate the site.
    3.4 [add [filename.md]]   => moves file to the template directory
    3.5 [help | usage]        => prints help or usage information.
*/

const fs = require('fs').promises;
const path = require('path');
const open = require('open');

const ConfigService = require('./config.service');
const GeneratorService = require('./generator.service');

class Generator {
  async init(args) {
    this.methods = {
      'config': (args) => this.config(args),
      'list':   (args) => this.list(args),
      'build':  (args) => this.build(args),
      'add':    (args) => this.add(args),
      'help':   (args) => this.help(args),
    };

    this.configService    = new ConfigService();
    this.generatorService = new GeneratorService();

    this.configObj = await this.configService.getConfigObj();

    const [first, second, ...tail] = args;
    const action = this.parseArguments(tail);
    this.evalArguments(action);
  }

  async config() {
    const newConfig = await this.configService.getConfigValues(this.configObj);
    await fs.writeFile('./config.json', JSON.stringify(newConfig));
  }

  async list() {
    console.log("[Markdown files]");
    const markdownFiles = await fs.readdir(this.configObj.markdownDir);
    markdownFiles.forEach(file => {
      const ext = file.substring(file.length, file.length - 3);
      if (ext === '.md') {
        console.log(file);
      }
    });

    console.log("[HTML files]");
    const htmlFiles = await fs.readdir(this.configObj.outputDir);
    htmlFiles.forEach(file => {
      const ext = file.substring(file.length, file.length - 5);
      if (ext === '.html') {
        console.log(file);
      }
    });
  }

  async build(args) {
    const [flag] = args;
    const {
      outputDir,
      templateDir,
      markdownDir,
    } = this.configObj;

    // delete the contents of the output directory.
    await this.generatorService.deleteOldFiles(outputDir);

    // create a list of the post objects.
    const posts = await this.generatorService.getPosts(templateDir, markdownDir);
    
    // create the individual blog html files from the list of objects.
    await this.generatorService.generatePosts(posts, outputDir);

    // create and save the index page.
    await this.generatorService.generateIndex(posts, templateDir, outputDir);

    // copy the asset files from the template directory
    await this.generatorService.copy(`${templateDir}assets`, `${outputDir}assets`);

    if (flag === '--open') await open(`${outputDir}index.html`);
  }

  async add(args) {
    try {
      const [file] = args;
      const fileName = path.basename(file);
      const dest = path.join(this.configObj.markdownDir, fileName);

      try {
        await fs.rename(file, dest);
        console.log(`${file} => ${dest}`);
        console.log("Move complete.");
      } catch (e) {
        console.log('Could not move file.');
        console.log("ERROR ", e);
      }
    } catch (e) {
      console.log("ERROR ", e);
    }
  }

  async help() {
    const help = await fs.readFile('./help.txt', 'utf8');
    console.log(help);
  }

  parseArguments(args) {
    if (args.length === 0) throw Error('Arguments required.');

    const [first, second] = args;
    return {
      action: first,
      arguments: [second]
    };
  }

  async evalArguments(args) {
    if (this.configObj === {}) await this.config();

    const action = this.methods[args.action];
    if (action === undefined) throw Error('Invalid argument.');
    return await action(args.arguments);
  }
}

const generator = new Generator();
generator.init(process.argv);
