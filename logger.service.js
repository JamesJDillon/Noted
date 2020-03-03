// Prevents mocha test output from being clogged with console logs.
if (process.env.ENV === 'TEST') console.log = () => {};
module.exports = { console };
