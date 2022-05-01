# Noted

My minimal markdown static blog generator.

## Installation

**1. Cloning the project.**

You can download the project using:

`git clone https://github.com/JamesJDillon/Noted.git`

**2. Installing the project.**

First, navigate into the project directory using:

`cd Noted`

Next install the project dependencies using:

`npm i`

After this, you can install the project as a command line application using:

`npm link`

To test that it works, try running:

`noted help`

## Using the project

**Creating a blog**

You can create a blog folder using:

`noted new example`

This will scaffold a blog folder that contains three subdirectories:

| File/Folder | Purpose |
| ----------- | ------- |
| **config.json** | Config file that specifies the location of the required folders. You can move these folders so long as you update the config.json |
| **markdown** | Contains an example markdown blog post. This is where you would add your blog entries. |
| **output** | This is where the generated blog lives. To deploy the blog, you would copy this directory to your static file host. **DO NOT EDIT: It will get overwritten every time the site is generated.**|
| **templates** | Contains the HTML files that act as the template for your blog. To modify the style of your blog, edit the styles within this directoy. |


**Building a blog**

The command below will build a blog and open it in your default browser.

`cd example && noted build && noted open`

**View help**

You can view the available commands by running:

`noted help`


## License

    Copyright (c) 2022 James Dillon

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
    OR OTHER DEALINGS IN THE SOFTWARE.