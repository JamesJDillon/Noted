#!/usr/bin/env node

const fs = require('fs').promises;
const oldFs = require('fs');
const path = require('path');
const open = require('open');
const moment = require('moment');

const { getConfig, getConfigValues } = require('./config.service');
const {
  deleteOldFiles,
  getPosts,
  generatePosts,
  generateIndex,
  copy,
} = require('./generator.service');
const { log, Colors } = require('./logger.service');


const init = async (args) => {
  const config = await getConfig(`${process.cwd()}\\config.json`);

  const methods = {
    config: (args) => updateConfig(args, config),
    list:   (args) => list(args, config),
    build:  (args) => build(args, config),
    help:   (args) => help(args, config),
    create: (args) => create(args, config),
    open:   (args) => openBrowser(args, config),
    new:    (args) => newSite(args, config),
  };

  const [first, second, ...tail] = args;
  try {
    const action = parseArguments(tail);

    // TODO: Find a cleaner way of expressing this.
    if (Object.keys(config).length === 0 && (action.action !== 'new' && action.action !== 'help')) {
      log("Error: config.json missing - are you sure you're in the right directory?");
    } else {
      await evalArguments(action, config, methods);
    }
  } catch (e) {
    log(e);
    log("Invalid usage. Try 'noted help' for more information.");
  }
}

const openBrowser = async (args, { outputDir }) => {
  await open(`${outputDir}index.html`);
}

const updateConfig = async (args, config) => {
  const newConfig = await getConfigValues(config);
  console.log(newConfig);
  await fs.writeFile(`${path.resolve(__dirname)}/config.json`, JSON.stringify(newConfig));
}

const list = async (args, config) => {
  const markdownFiles = await fs.readdir(config.markdownDir);
  const htmlFiles = await fs.readdir(config.outputDir);

  log('(Markdown files)', Colors.FgMagenta);
  markdownFiles.forEach((file) => {
    const ext = file.substring(file.length, file.length - 3);
    const name = file.substring(0, file.length - 3);
    if (ext === '.md') {
      if (htmlFiles.includes(`${name}.html`)) {
        log(`${file} => ${name}.html`, Colors.FgGreen);
      } else {
        log(`${file} => ???`, Colors.FgYellow);
      }
    }
  });

  log('\n(HTML Files)', Colors.FgMagenta);
  htmlFiles.forEach((file) => {
    const ext = file.substring(file.length, file.length - 5);
    if (ext === '.html') {
      log(file);
    }
  });
}

const build = async (args, { outputDir, templateDir, markdownDir }) => {
  const [flag] = args;

  // delete the contents of the output directory.
  await deleteOldFiles(outputDir);

  // create a list of the post objects.
  const posts = await getPosts(templateDir, markdownDir);

  // create the individual blog html files from the list of objects.
  await generatePosts(posts, outputDir);

  // create and save the index page.
  await generateIndex(posts, templateDir, outputDir);

  // copy the asset files from the template directory
  await copy(`${templateDir}assets`, `${outputDir}assets`);

  log('\nSuccessfully generated static site 🎉', Colors.Bright);
}

const help = async () => {
  const help = await fs.readFile(`${path.resolve(__dirname)}/help.txt`, 'utf8');
  log(help);
}

const parseArguments = (args) => {
  if (args.length === 0) throw Error('Arguments required.');

  const [first, second] = args;
  return {
    action: first,
    arguments: [second],
  };
}

const evalArguments = async (args, config, methods) => {
  if (config === {}) await this.config();

  const action = methods[args.action];
  if (action === undefined) throw Error('Invalid argument.');
  return action(args.arguments);
}

const create = async (args, config) => {
  const [file] = args;
  const postTemplate = await fs.readFile(`${path.resolve(__dirname)}/markdown.template`, 'utf8');

  await fs.writeFile(
    file,
    postTemplate.replace('{date}', moment().format('DD/MM/YYYY HH:mm')),
  );
}

const newSite = async (args, config) => {
  const [folderName] = args;
  if (folderName === undefined) throw Error('Project name required.');
  
  const scaffoldFolder = `${path.resolve(__dirname)}\\scaffold`;
  const folderDir = `${process.cwd()}\\${folderName}`;

  if (oldFs.existsSync(folderDir)) {
    throw Error(`Folder ${folderName} already exists.`);
  }

  await fs.mkdir(folderDir);
  await fs.mkdir(`${folderDir}\\output`);

  await copy(`${scaffoldFolder}\\markdown`, `${folderDir}\\markdown`);
  await copy(`${scaffoldFolder}\\templates`, `${folderDir}\\templates`);

  await fs.writeFile(`${folderDir}\\config.json`, JSON.stringify({
    templateDir: `${folderDir}\\templates\\`,
    outputDir: `${folderDir}\\output\\`,
    markdownDir: `${folderDir}\\markdown\\`
  }));

  log('\nNew project created 🎉', Colors.Bright);
  log('\nTo get started, try:', Colors.Bright);
  log(`\n\tcd ${folderName} && noted build && noted open`, Colors.Bright);
}

module.exports = init;

