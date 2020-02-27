const fs = require('fs').promises;
const util = require('util');
const showdown = require('showdown');
const pretty = require('pretty');
const moment = require('moment');
const colors = require('colors');

const postsFolder = './posts/';

class Generator {
  async init() {
    this.errors = [];
    const posts = await this.getPosts();
    // delete old output files.
    console.log('[Deleting old files]'.cyan);
    await this.deleteOldFiles();

    console.log('\n[Generating new files]'.cyan);
    await this.generatePosts(posts);
    await this.generateIndex(posts);

    console.log('--------------------------------'.rainbow);
    if (this.errors.length > 0) {
      console.log(`[ERROR] ${this.errors.length} errors have occured.`.red);
      this.errors.forEach(error => console.log(`\t- ${error}`.red));
    } else {
      console.log('[SUCCESS] Your blog was successfully generated.'.green);
    }
  }

  async getPosts() {
    const converter = new showdown.Converter();
    //TODO: Handle exception.
    const postFiles = await fs.readdir(postsFolder);
    const template = await fs.readFile('./templates/post.html', 'utf8');

    const posts = await Promise.all(postFiles.map(async post=> {
      //TODO: Handle exception.
      const openPost = await fs.readFile(`${postsFolder}${post}`, 'utf8');
      const postMetadata = this.getPostMetadata(openPost);

      const body = this.getPostBody(openPost);

      const preparedTemplate = template
        .replace('${body}', converter.makeHtml(body))
        .replace('${title}', postMetadata.title)
        .replace('${desc}', postMetadata.desc)
        .replace('${date}', postMetadata.date.isValid() ? postMetadata.date : '[Invalid date]');

      const bodyHtml = pretty(preparedTemplate);

      return {
        details: {
          name: post.substring(0, post.length - 3),
          ...postMetadata,
        },
        bodyText: body,
        bodyHtml,
      };
    }));

    // Sorting by date asc.
    posts.sort((a, b) => b.details.date - a.details.date);
    return posts;
  }

  async deleteOldFiles() {
    const dir = './output/';
    const htmlFiles = await fs.readdir(dir);
    await Promise.all(htmlFiles.map(async file => {
      const htmlExtension = file.substring(file.length, file.length - 5);
      if (htmlExtension === ".html") {
        try {
          await fs.unlink(`${dir}${file}`);
          console.log(`${file} deleted.`.white);
        } catch (e) {
          const error = `failed to delete ${file}`;
          console.log(error.red);
          this.errors.push(error);
        }
      }
    }));
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

  async generatePosts(posts) {
    posts.forEach(async post => {
      try {
        await fs.writeFile(`./output/${post.details.name}.html`, post.bodyHtml);
        console.log(`./output/${post.details.name}.html created.`.white);
      } catch (e) {
        console.log(`Failed to create ./output/${post.details.name}.html.`.red);
        this.errors.push(`Failed to create ./output/${post.details.name}.html.`);
      }
    });
  }

  async generateIndex(posts)  {
    const indexPostList = this.buildPostList(posts);
    const template = await fs.readFile('./templates/index.html', 'utf8');
    const hydratedTemplate = template
      .replace('${postList}', indexPostList);
    await fs.writeFile('./output/index.html', hydratedTemplate);
    console.log('index.html created.'.white);
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

const generator = new Generator();
generator.init();