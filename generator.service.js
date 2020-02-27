const fs = require('fs').promises;
const showdown = require('showdown');
const moment = require('moment');
const rimraf = require('rimraf');
const path = require('path');

/**
  * An object containing details relevant to posts.
  * @typedef Details
  * @type {object}
  * @property {string} title - title of the post.
  * @property {number} desc  - description of the post.
  * @property {number} date  - date of post.
  *
*/

/**
  * A post object.
  * @typedef Post
  * @type {object}
  * @property {Details} details  - details about the post.
  * @property {string} bodyText  - markdown file as string.
  * @property {string} bodyHtml  - markdown file converted to HTML.
  *
*/

class GeneratorService {
  /**
   * Takes a path - deletes every file within said path.
   * Deletes the "assets" folder within the path if it contains it.
   * @param   {path} path to the folder we're clearing.
   *
   * @returns {void} side effects of deleting files are carried out.
  */
  async deleteOldFiles(path) {
    console.log('[DELETING OLD FILES]');
    const htmlFiles = await fs.readdir(path);
    await Promise.all(htmlFiles.map(async (file) => {
      try {
        await fs.unlink(`${path}${file}`);
        console.log(`${file} deleted.`);
      } catch (e) {
        // exception thrown attempting to delete folder.
        // if it's the assets folder, delete it.
        if (file === 'assets') {
          rimraf(`${path}${file}`, () => console.log(`${path}${file} deleted.`));
        }
      }
    }));
  }

  /**
   * Wraps the 'copyRecursive' method so we can print out to the user
   * just once that we're moving the assets folder over.
   * @param   {string} src to folder we're moving
   * @param   {string} dest to the destination the folder should be moved to.
   *
   * @returns {Promise} side effects of deleting files are carried out.
  */
  copy(src, dest) {
    console.log('[COPYING ASSET FILES]');
    return this.copyRecursive(src, dest);
  }

  /**
   * Recursive function that copies the contents of one directory
   * to another directory.
   * @todo    Need to handle all the error cases that could possibly happen.
   * @param   {string} src to folder we're moving
   * @param   {string} dest to the destination the folder should be moved to.
   *
   * @returns {Promise} with side effects of moving a directory and it's contents.
  */
  async copyRecursive(src, dest) {
    const stats = await fs.stat(src);
    const isDirectory = stats.isDirectory();
    if (!isDirectory) {
      console.log(`${src} => ${dest}`);
      await fs.copyFile(src, dest);
    } else {
      await fs.mkdir(dest);
      const fileList = await fs.readdir(src);

      await Promise.all(fileList.map(async (childItemName) => this.copyRecursive(path.join(src, childItemName), path.join(dest, childItemName))));
    }
  }

  /**
   * Creates a list of blog post objects.
   * @todo    Need to handle all the error cases that could possibly happen.
   *
   * @param   {string} templateDir that contains the html templates.
   * @param   {string} markdownDir that contains the markdown files.
   *
   * @returns {Post[]} a list of objects representing posts to the blog.
  */
  static async getPosts(templateDir, markdownDir) {
    const converter = new showdown.Converter();
    // TODO: Handle exception.
    const postFiles = await fs.readdir(markdownDir);
    const template = await fs.readFile(`${templateDir}post.html`, 'utf8');

    const posts = await Promise.all(postFiles.map(async (post) => {
      // TODO: Handle exception.
      const openPost = await fs.readFile(`${markdownDir}${post}`, 'utf8');
      const postMetadata = GeneratorService.getPostMetadata(openPost);

      const body = GeneratorService.getPostBody(openPost);

      const preparedTemplate = template
        .replace('${body}', converter.makeHtml(body))
        .replace('${title}', postMetadata.title)
        .replace('${desc}', postMetadata.desc)
        .replace('${date}', postMetadata.date.isValid() ? postMetadata.date : '[Invalid date]');

      return {
        details: {
          name: post.substring(0, post.length - 3),
          ...postMetadata,
        },
        bodyText: body,
        bodyHtml: preparedTemplate,
      };
    }));

    // Sorting by date asc.
    posts.sort((a, b) => b.details.date - a.details.date);
    return posts;
  }

  /**
   * Takes a markdown file and parses the first 5 lines for metadata.
   * @param   {string} post - a markdown file as a string
   *
   * @returns {Description} description - an object containing data describing a post.
  */
  static getPostMetadata(post) {
    const lines = post.split('\n');
    if (lines[0] !== '----' || lines[4] !== '----') {
      throw Error('Incorrect post format.');
    }

    const tempDate = lines[1].split('date: ')[1];

    const title = lines[2].split('title: ')[1];
    const desc = lines[3].split('desc: ')[1];
    const date = moment(tempDate, 'DD/MM/YYYY HH:mm');

    return { date, title, desc };
  }

  /**
   * Takes a markdown file and removes the metadata lines at the beginning.
   * @param   {string} post - a markdown file as a string
   *
   * @returns {string} postBody - a string containing the body of a blog post.
  */
  static getPostBody(post) {
    const lines = post.split('\n');
    const body = lines.splice(5, lines.length - 1);
    return body.join('\n');
  }

  static async generatePosts(posts, outputDir) {
    console.log('[GENERATING BLOG POSTS]');
    await Promise.all(posts.map(async (post) => {
      try {
        await fs.writeFile(`${outputDir}${post.details.name}.html`, post.bodyHtml);
        console.log(`${outputDir}${post.details.name}.html created.`);
      } catch (e) {
        console.log(`Failed to create ${outputDir}${post.details.name}.html.`);
      }
    }));
  }

  static async generateIndex(posts, templateDir, outputDir) {
    console.log('[GENERATING INDEX PAGE]');
    const indexPostList = GeneratorService.buildPostList(posts);
    const template = await fs.readFile(`${templateDir}index.html`, 'utf8');
    const hydratedTemplate = template
      .replace('${postList}', indexPostList);
    await fs.writeFile(`${outputDir}index.html`, hydratedTemplate);
    console.log(`${outputDir}index.html created.`);
  }

  static buildPostList(posts) {
    const postHtml = posts.map((post) => `
        <article>
          <header>
            <h3><a href="${post.details.name}.html">${post.details.name}</a></h3>
            <small>${post.details.date.format('dddd, MMMM Do YYYY, h:mm')}</small>
          </header>
          <p>
            ${post.details.desc}
          </p>
        </article>
      `);

    return postHtml.join('\n');
  }
}

module.exports = GeneratorService;
