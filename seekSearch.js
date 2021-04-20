//////// This is the targeted url

const targetUrl =
  "https://www.seek.co.nz/jobs-in-mining-resources-energy/";

////////////////////////////////////////////////

const puppeteer = require("puppeteer");
const fs = require("fs");
const { curly } = require("node-libcurl");

////////////////////////////////////////////////

//////// functions to check for duplicates
function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

////////////////////////////////////////////////

const scrape = async () => {
  //////// Cache config to make pupppeter faster
  const browser = await puppeteer.launch({
    userDataDir: "./cacheData",
  });

  //////// Alocating the new page
  const page = await browser.newPage();

  //////// Blocking images request to make it faster
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.resourceType() === "image") {
      request.abort();
    } else if (request.resourceType() === "font") {
      request.abort();
    } else {
      request.continue();
    }
  });

  //////// Opens targeted url
  await page.goto(targetUrl);

  ////////
  let currentPage = 1;
  let finalResult = [];
  let batchSize;

  //////// Getting the max number for pagination
  batchSize = await page.evaluate(() => {
    try {
      const regex = /(?<=("lastPage":))([^}]*)/g;
      const getHtml = document.querySelector("html").textContent,
        resultString = getHtml.match(regex).toString();
      console.log("Number of pages found: " + parseInt(resultString));
      return (numberOfPages = parseInt(resultString));
    } catch (error) {
      return (numberOfPages = 1);
    }
  });

  //////// Extraction loop starts
  while (currentPage <= batchSize) {
    try {
      await page.waitForSelector("._1UfdD4q > div > article");
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => {
        const urls = [];
        document
          .querySelectorAll("._1UfdD4q > div > article")
          .forEach((article) => {
            urls.push(
              article
                .querySelector('[data-automation="jobTitle"]')
                .href.match(/.*[^\?]\?/g)
                .toString()
                .replace("?", "")
            );
          });
        return urls;
      });
      //////// Saves the current page batch of url to file and in final array
      await finalResult.push(result);

      let fileName = `extractedData/seekData/pageUrls-${currentPage}-${
        Math.floor(Math.random() * 90000) + 10000
      }.json`;
      await fs.writeFile(fileName, JSON.stringify(result), function (err) {
        if (err) return console.log(err);
      });

      await console.log(`Saved file ${currentPage} - ${batchSize}: `, fileName);

      if (currentPage === batchSize) {
        console.log("Wait. Saving file with all urls!");
        break;
      }

      //////// Handling javascript on page for the next batch
      await currentPage++;
      await page.waitForSelector(`[data-automation="page-next"]`);
      await page.click(`[data-automation="page-next"]`);
      await page.waitForSelector("._1UfdD4q > div > article");
      await setTimeout(() => {}, 500);
    } catch (error) {
      null;
    }
  }

  //////// The loop ends and the virtual browser it's closed
  browser.close();
  return finalResult;
};

//////// Function that extracts data from each url

const getDataSeek = async (path, index, batchSize) => {
  let result = {};
  let regexNow, textString;

  //////////////////////////// fetching the url

  try {
    const { data } = await curly.get(path);
    textString = data;
  } catch (error) {
    console.log(
      `No response for url in file number: ${index}, and url: ${path}`
    );
  }

  /////////////////////////// regex for getting data

  if (textString) {
    textString = textString.replace(/(\r\n|\r|\n){2,}/g, "$1\n");
    textString = textString.replace(/\n*/g, "");

    regexNow = /(?<=("jobTitle":"))([^"]*)/g;
    result = saveType("title", regexNow, textString, result);

    regexNow = /(?<=("salary":"))([^"]*)/g;
    result = saveType("salary", regexNow, textString, result);

    regexNow = /(?<=("listingDate":"))([^T]*)/g;
    result = saveType("dataCreated", regexNow, textString, result);

    regexNow = /(?<=("city":"))([^"]*)/g;
    result = saveType("city", regexNow, textString, result);

    regexNow = /(?<=("area":"))([^"]*)/g;
    result = saveType("area", regexNow, textString, result);

    regexNow = /(?<=("advertiserName":"))([^"]*)/g;
    result = saveType("employer", regexNow, textString, result);

    regexNow = /(?<=("expiryDate":"))([^T]*)/g;
    result = saveType("validThrough", regexNow, textString, result);

    regexNow = /(?<=("workType":"))([^"]*)/g;
    result = saveType("type", regexNow, textString, result);

    regexNow = /(?<=("jobAdDetails":"))([^"]*)/g;
    result = saveType("description", regexNow, textString, result);

    ///////////////////////////// saving file for one job

    let fileName = `extractedData/seekData/pageJob-${index}-${
      Math.floor(Math.random() * 90000) + 10000
    }.json`;
    await fs.writeFile(fileName, JSON.stringify(result), function (err) {
      if (err) return console.log(err);
    });
    await console.log(`Saved file ${index} - ${batchSize}: `, fileName);

    ////////////////////////////

    return result;
  } else {
    console.log("No data to read");
  }
};

//////////////////////////// function hangling each regex result

const saveType = (type, regex, string, targetObject) => {
  function unicodeToChar(text) {
    return text.replace(/\\u[\dA-F]{4}/gi, function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16));
    });
  }

  try {
    let stringData = unicodeToChar(string.match(regex).toString())
      .replace(/\<(.*?)\>/g, "\n")
      .trim()
      .replace(/\n+/g, "\n")
      .replace(/\n \n|\n \n \n|\n \n \n \n/g, "\n");
    return {
      ...targetObject,
      [type]: stringData,
    };
  } catch {
    return {
      ...targetObject,
      [type]: "Not Found",
    };
  }
};

//////////////////////////// executing scrape structure

scrape()
  .then(async (value) => {
    //////// Saves file with all results

    await fs.writeFile(
      `extractedData/seekData/allUrl-${
        Math.floor(Math.random() * 90000) + 10000
      }.json`,
      JSON.stringify(value.flat()),
      function (err) {
        if (err) return console.log(err);
      }
    );

    //////// Due server speed, sometimes pagination repets one batch. This functions checks if everything went well

    if (hasDuplicates(value)) {
      console.log(
        "Scraping url done, with some duplications probably due server speed"
      );
    } else {
      console.log("Done and no file duplicated found!");
    }

    //////// Scraping each url

    let allUrls = [...new Set(value)].flat();
    const qtyOfUrls = allUrls.length;
    let allJobs = [];

    for (const [index, url] of allUrls.entries()) {
      allJobs.push(await getDataSeek(url, index + 1, qtyOfUrls));
      await setTimeout(() => {
        return null;
      }, 500);
    }

    //////// Saving all results

    await fs.writeFile(
      `extractedData/seekData/allJobs-${
        Math.floor(Math.random() * 90000) + 10000
      }.json`,
      JSON.stringify(allJobs),
      function (err) {
        if (err) return console.log(err);
      }
    );

    //////// Finish

    console.log("All done!");
  })
  .catch((err) => {
    console.log(err);
  });
