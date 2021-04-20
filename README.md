## Getting Started

First, install dependencies.

```bash
npm i
# or
yarn
```

Both websites use javascript on the client-side for pagination during search results.
Hence, a virtual browser is necessary. I'm using **Puppeteer** with default options.

It's not uncommon to find people complaining about problems when launching the browser with the code below:

```javascript
const browser = await puppeteer.launch({
  userDataDir: "./cacheData",
});
```

It seems that the problem it's with WSL and Windows. I didn't have any trouble. If you find some problem, I recommend installing another browser manually. Chromium is the default option. 

I tested with Chrome, to double-check. Installing with:

```bash
sudo apt update
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt -y install ./google-chrome-stable_current_amd64.deb
```

My Chrome path became:

```bash
/opt/google/chrome/google-chrome
```

The final step, it's to edit this code like this:

```javascript
const browser = await puppeteer.launch({
    userDataDir: "./cacheData",
    executablePath: '/opt/google/chrome/google-chrome'
  });
```

I didn't find any other common problem with this package and I'm using WSL 2 with Ubuntu 20.04 LTS.

## How to use

Go to seekSearch.js or tradeSearch.js file and change the url that you want to extract the data.

Then, using terminal, you only need to execute the one of the files with node:

```bash
node seekSearch.js
```

## Output

The directory ExtractedData has one folder for each function. After running one function, </br> you may expect:

1. JSON file with all urls for each page;
2. JSON file for all the urls found;
3. JSON file for each job;
4. JSON file with all jobs.

If you have any questions, hit me up at <span style="color:blue">brunobarros@ideias.dev</span> or <span style="color:blue">bobarros@gmail.com</span>.
