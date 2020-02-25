const fs = require('fs').promises;
const util = require('util');
const showdown = require('showdown');
const pretty = require('pretty');

const postsFolder = './posts/';

class Generator {
  async init() {
    const converter = new showdown.Converter();
    //TODO: Handle exception.
    const postFiles = await fs.readdir(postsFolder);
    const template = await fs.readFile('./templates/post.html', 'utf8');

    const posts = await Promise.all(postFiles.map(async post=> {
      //TODO: Handle exception.
      const openPost = await fs.readFile(`${postsFolder}${post}`, 'utf8');

      //TODO: Handle exception.
      const postMetadata = this.getPostMetadata(openPost);
      const body = this.getPostBody(openPost);

      const preparedTemplate = template
        .replace('${body}', converter.makeHtml(body))
        .replace('${title}', postMetadata.title)
        .replace('${desc}', postMetadata.desc)
        .replace('${date}', postMetadata.date);

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

    posts.forEach(async post => {
      await fs.writeFile(`./output/${post.details.name}.html`, post.bodyHtml);
    });
  }

  getPostMetadata(post) {
    const lines = post.split('\n');
    if (lines[0] !== "----" || lines[4] !== "----") {
      throw Error('Incorrect post format.');
    }

    const date = lines[1].split('date: ')[1];
    const title = lines[2].split('title: ')[1];
    const desc = lines[3].split('desc: ')[1];

    return { date, title, desc };
  }

  getPostBody(post) {
    const lines = post.split('\n');
    const body = lines.splice(5, lines.length - 1);
    return body.join('\n');
  }

  generatePosts() {

  }

  generateIndex()  {

  }
}

const generator = new Generator();
generator.init();