require("dotenv").config();
const axios = require("axios");
const { WakaTimeClient, RANGE } = require("wakatime-client");
const fs = require("fs");

const { WAKATIME_API_KEY: wakatimeApiKey, QUOTES_REST_API_KEY: quotesRestApiKey } = process.env;

const wakatime = new WakaTimeClient(wakatimeApiKey);

function calLines(stats) {
  const lines = [];
  // for (let i = 0; i < Math.min(stats.data.languages.length, 5); i++) {
  for (let i = 0; i < stats.data.languages.length; i++) {
    const data = stats.data.languages[i];
    const { name, percent, text: time } = data;

    const line = [
      name.padEnd(11),
      time.padEnd(14),
      generateBarChart(percent, 21),
      String(percent.toFixed(1)).padStart(5) + "%",
    ];

    lines.push(line.join(" "));
  }

  return lines;
}

function generateBarChart(percent, size) {
  const syms = "░▏▎▍▌▋▊▉█";

  const frac = Math.floor((size * 8 * percent) / 100);
  const barsFull = Math.floor(frac / 8);
  if (barsFull >= size) {
    return syms.substring(8, 9).repeat(size);
  }
  const semi = frac % 8;

  return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
    .join("")
    .padEnd(size, syms.substring(0, 1));
}

const getQuote = async () => {
  try {
    const configs = {
      headers: {'X-Api-Key': quotesRestApiKey},
    }
    const { data } = await axios.get("https://api.api-ninjas.com/v1/quotes", configs);
    console.log("data", data);
    const quote = data[0].quote;
    const author = data[0].author;

    console.log(
      "new quote",
      `${JSON.stringify({ quote, author })}`
    );

    return {
      quote,
      author,
    };
  } catch (err) {
    console.error(err.message);
    return  {
      quote: 'Unknown',
      author: 'Unknown',
    }
  }
};

const generate = async () => {
  try {
    const stats = await wakatime.getMyStats({ range: RANGE.LAST_7_DAYS });
    console.log("waka time stats languages:", stats.data.languages);
    let lines = calLines(stats);

    lines =
      lines.length > 0
        ? `\n\n## 📊 Weekly development breakdown 📊\n\n<pre>${lines.join("\n")}</pre>`
        : "";

    console.log("lines:", lines);

    const {quote, author} = await getQuote();

    const _quote =
      quote && author
        ? `## 😄 Daily Quotes 😄\n\n_**${quote}**_\n\n${author}\n\n`
        : "";

    const content =
      lines === "" && _quote === "" ? `### Hi there 👋` : _quote + lines + `\n\n${new Date().toLocaleDateString()}`;

    console.log("content", content);

    fs.writeFileSync("README.md", content);
  } catch (error) {
    console.error(error);
  }
};

generate();

