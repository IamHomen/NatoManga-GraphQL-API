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

// Cache object
const mangaCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchManga(id) {
    // Check cache first
    if (mangaCache.has(id)) {
        const cachedData = mangaCache.get(id);
        if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log(`Serving from cache: ${id}`);
            return cachedData.data;
        } else {
            mangaCache.delete(id); // Remove expired cache
        }
    }

    try {
        const response = await axios.get(`${BASE_URL}${id}`);
        const $ = cheerio.load(response.data);

        // Title
        const title = $(".manga-info-text h1").text().trim();

        // Cover image
        const cover = $(".manga-info-pic img").attr("src");

        // Author
        const author = $(".manga-info-text li:contains('Author') a").text().trim() || "Unknown";

        // Status
        const status = $(".manga-info-text li:contains('Status')").text().replace("Status :", "").trim();

        // Genres
        const genres = [];
        $(".manga-info-text li.genres a").each((_, el) => {
            genres.push($(el).text().trim());
        });

        // Description
        const description = $("#contentBox").text().trim();

        // Chapters
        const chapters = [];
        $(".chapter-list .row").each((_, el) => {
            const chapterTitle = $(el).find("a").text().trim();
            const chapterUrl = $(el).find("a").attr("href");
            const chapterViews = $(el).find("span:nth-child(2)").text().trim();
            const uploadTime = $(el).find("span:nth-child(3)").attr("title") || $(el).find("span:nth-child(3)").text().trim();

            chapters.push({
                title: chapterTitle,
                url: chapterUrl,
                views: chapterViews,
                upload_time: uploadTime,
            });
        });

        const mangaData = { title, cover, author, status, genres, description, chapters };

        // Store in cache
        mangaCache.set(id, { data: mangaData, timestamp: Date.now() });

        return mangaData;
    } catch (error) {
        console.error("Error fetching manga:", error);
        return null;
    }
}

const root = {
    getManga: async ({ id }) => {
        return await fetchManga(id);
    },
};

const app = express();
app.use(cors());

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: root,
        graphiql: true,
    })
);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
});
