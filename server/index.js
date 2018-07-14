// Imports the Google Cloud client library
const Translate = require("@google-cloud/translate");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const compression = require("compression");
const learningData = require("./learningData");
const devConfig = require("./Config/development.json");

// Your Google Cloud Platform project ID
const projectId = devConfig.GOOGLE_PROJECT_ID;

// Instantiates a client
const translate = new Translate({
  projectId: projectId,
  keyFilename: devConfig.CRED_PATH
});

const app = express();

const dataSet = learningData.dataSet;

// compression to increase performance
app.use(compression());

// create application/json parser
app.use(bodyParser.json());

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

// Google translate helper function
const gTranslate = async (toBeTranslated, from, to) => {
  return await translate.translate(toBeTranslated, {
    from,
    to
  });
};

// Translate functionality
app.post("/translate", async (req, res) => {
  const { toBeTranslated, language } = req.body;
  const lngResult = await translate.detect(toBeTranslated);
  const languageFrom = lngResult[0].language;
  const translateData = await gTranslate(
    toBeTranslated,
    languageFrom,
    language
  );
  res.send(JSON.stringify({ translation: translateData[0] }));
});

// Get dataset of user input category
app.get("/categories/:category/:language", (req, res) => {
  const { category, language } = req.params;
  const english = dataSet[`${category.toLowerCase().replace(" ", "")}`];
  const result = [];
  let count = 0;
  english.forEach(async (data, index) => {
    const translateData = await gTranslate(data, "en", language);
    count++;
    result.push([english[index], translateData[0]]);
    if (count === english.length) {
      res.send(JSON.stringify(result));
    }
  });
});

// Conversation endpoint
app.post("/conversation", async (req, res) => {
  const { language, message } = req.body;
  const englishInput = await gTranslate(message, language, "en");
  const cakechatData = await axios.post(
    "http://localhost:8080/cakechat_api/v1/actions/get_response",
    {
      context: [englishInput[0]],
      emotion: "neutral"
    }
  );
  const englishReply = cakechatData.data.response;
  translatedReply = await gTranslate(englishReply, "en", language);
  res.send(JSON.stringify({ translatedReply: translatedReply[0] }));
});

// Learning endpoint to judge user's answer
app.post("/learning/answer", async (req, res) => {
  const { language, category, answeredIndex, answer } = req.body;
  const categoryLength = dataSet[`${category}`].length;
  const newIndex = Math.floor(Math.random() * categoryLength);
  const newPhrase = dataSet[`${category}`][newIndex];
  if (answeredIndex === null) {
    const result = {
      newIndex,
      messages: ["Let's start learning!", `What is '${newPhrase}'?`]
    };
    res.send(JSON.stringify(result));
  } else {
    const englishAnswer = dataSet[`${category}`][answeredIndex];
    const results = await gTranslate(answer, language, "en");
    const checkedResults = await gTranslate(englishAnswer, "en", language);
    const finalResults = await gTranslate(checkedResults[0], language, "en");
    if (
      results[0]
        .toLowerCase()
        .replace(/[\W_]+/g, "")
        .replace(" ", "") ===
      finalResults[0]
        .toLowerCase()
        .replace(/[\W_]+/g, "")
        .replace(" ", "")
    ) {
      const result = {
        newIndex,
        messages: [
          "Well done!! You got it correct!",
          `How about '${newPhrase}' next!`
        ]
      };
      res.send(JSON.stringify(result));
    } else {
      const result = {
        newIndex: answeredIndex,
        messages: ["Oh no! Please try again!"]
      };
      res.send(JSON.stringify(result));
    }
  }
});

app.listen(3000, () => {
  console.log("server has started at port 3000");
});
