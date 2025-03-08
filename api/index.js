const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const schema = buildSchema(`
    type Manga {
        title: String
        cover: String
        author: String
        status: String
        genres: [String]
        description: String
        chapters: [Chapter]
    }

    type Chapter {
        title: String
        url: String
        views: String
        upload_time: String
    }

    type Query {
        getManga(id: String!): Manga
    }
`);

const BASE_URL = "https://www.natomanga.com/manga/";
const mangaCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchManga(id) {
    if (mangaCache.has(id)) {
        const cachedData = mangaCache.get(id);
        if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log(`Serving from cache: ${id}`);
            return cachedData.data;
        } else {
            mangaCache.delete(id);
        }
    }

    try {
        const response = await axios.get(`${BASE_URL}${id}`);
        const $ = cheerio.load(response.data);

        const title = $(".manga-info-text h1").text().trim();
        const cover = $(".manga-info-pic img").attr("src");
        const author = $(".manga-info-text li:contains('Author') a").text().trim() || "Unknown";
        const status = $(".manga-info-text li:contains('Status')").text().replace("Status :", "").trim();
        const genres = [];
        $(".manga-info-text li.genres a").each((_, el) => genres.push($(el).text().trim()));

        const description = $("#contentBox").text().trim();
        const chapters = [];
        $(".chapter-list .row").each((_, el) => {
            chapters.push({
                title: $(el).find("a").text().trim(),
                url: $(el).find("a").attr("href"),
                views: $(el).find("span:nth-child(2)").text().trim(),
                upload_time: $(el).find("span:nth-child(3)").attr("title") || $(el).find("span:nth-child(3)").text().trim(),
            });
        });

        const mangaData = { title, cover, author, status, genres, description, chapters };
        mangaCache.set(id, { data: mangaData, timestamp: Date.now() });

        return mangaData;
    } catch (error) {
        console.error("Error fetching manga:", error);
        return null;
    }
}

const app = express();
app.use(cors());

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: { getManga: async ({ id }) => await fetchManga(id) },
        graphiql: true,
    })
);

// Vercel requires us to export a function instead of using app.listen()
module.exports = app;
