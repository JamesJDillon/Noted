const fs = require('fs').promises;
const showdown = require('showdown');
const moment = require('moment');
const rimraf = require('rimraf');
const path = require('path');

class GeneratorService {
  async deleteOldFiles(path) {
    console.log('[DELETING OLD FILES]')
    const htmlFiles = await fs.readdir(path);
    await Promise.all(htmlFiles.map(async file => {
      try {
        await fs.unlink(`${path}${file}`);
        console.log(`${file} deleted.`);
      } catch (e) {
        // exception thrown attempting to delete folder.
        rimraf(`${path}${file}`, () => console.log(`${path}${file} deleted.`));
      }
    }));
  }

  copy(src, dest) {
    console.log('[COPYING ASSET FILES]');
    return this.copyRecursive(src, dest);
  }

  async copyRecursive(src, dest) {
    const stats = await fs.stat(src);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
      await fs.mkdir(dest);
      const list = await fs.readdir(src);

      list.forEach(async childItemName => {
        await this.copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      // base case - copy the file over.
      console.log(`${src} => ${dest}`);
      await fs.copyFile(src, dest);
    }
  };

  async getPosts(templateDir, markdownDir) {
    const converter = new showdown.Converter();
    //TODO: Handle exception.
    const postFiles = await fs.readdir(markdownDir);
    const template = await fs.readFile(`${templateDir}post.html`, 'utf8');

    const posts = await Promise.all(postFiles.map(async post=> {
      //TODO: Handle exception.
      const openPost = await fs.readFile(`${markdownDir}${post}`, 'utf8');
      const postMetadata = this.getPostMetadata(openPost);

      const body = this.getPostBody(openPost);

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

  getPostMetadata(post) {
    const lines = post.split('\n');
    if (lines[0] !== "----" || lines[4] !== "----") {
      throw Error('Incorrect post format.');
    }

    const tempDate = lines[1].split('date: ')[1];

    const title = lines[2].split('title: ')[1];
    const desc = lines[3].split('desc: ')[1];
    const date = moment(tempDate, "DD/MM/YYYY HH:mm");

    return { date, title, desc };
  }

  getPostBody(post) {
    const lines = post.split('\n');
    const body = lines.splice(5, lines.length - 1);
    return body.join('\n');
  }

  async generatePosts(posts, outputDir) {
    console.log('[GENERATING BLOG POSTS]')
    await Promise.all(posts.map(async post => {
      try {
        await fs.writeFile(`${outputDir}${post.details.name}.html`, post.bodyHtml);
        console.log(`${outputDir}${post.details.name}.html created.`);
      } catch (e) {
        console.log(`Failed to create ${outputDir}${post.details.name}.html.`);
      }
    }));
  }

  async generateIndex(posts, templateDir, outputDir)  {
    console.log('[GENERATING INDEX PAGE]')
    const indexPostList = this.buildPostList(posts);
    const template = await fs.readFile(`${templateDir}index.html`, 'utf8');
    const hydratedTemplate = template
      .replace('${postList}', indexPostList);
    await fs.writeFile(`${outputDir}index.html`, hydratedTemplate);
    console.log(`${outputDir}index.html created.`);
  }

  buildPostList(posts) {
    const postHtml = posts.map(post => {
      return `
        <article>
          <header>
            <h3><a href="${post.details.name}.html">${post.details.name}</a></h3>
            <small>${post.details.date.format("dddd, MMMM Do YYYY, h:mm")}</small>
          </header>
          <p>
            ${post.details.desc}
          </p>
        </article>
      `;
    });

    return postHtml.join('\n');
  }
}

module.exports = GeneratorService;