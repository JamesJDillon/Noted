const fs = require('fs').promises;
const path = require('path');

const { log, Colors } = require('./logger.service');

/**
  * Recursive function that copies the contents of one directory
  * to another directory.
  * @todo    Need to handle all the error cases that could possibly happen.
  * @param   {string} src to folder we're moving
  * @param   {string} dest to the destination the folder should be moved to.
  *
  * @returns {Promise} with side effects of moving a directory and it's contents.
  * TODO: Remove the calls to log? Doesn't seem appropriate here, but most straightfoward.
*/
const copyRecursive = async (src, dest) => {
  const stats = await fs.stat(src);
  const isDirectory = stats.isDirectory();
  if (!isDirectory) {
    log(`${src} copied.`, Colors.FgGreen);
    await fs.copyFile(src, dest);
  } else {
    await fs.mkdir(dest);
    const files = await fs.readdir(src);

    await Promise.all(
      files.map(async (childItemName) => copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      )),
    );
  }
}

module.exports = { copyRecursive };