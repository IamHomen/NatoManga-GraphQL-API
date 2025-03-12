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

    type LatestMangaUpdate {
        title: String
        cover: String
        url: String
        latest_chapter: String
        latest_chapter_url: String
        upload_time: String
    }
    type HotManga {
        title: String
        cover: String
        url: String
        latestChapter: String
        latestChapterUrl: String
        views: String
        description: String
    }
    type Query {
        getManga(id: String!): Manga
        getLatestUpdates: [LatestMangaUpdate]
        getHotManga: [HotManga]
    }
`);

const BASE_URL = "https://www.natomanga.com/manga/";
const HOME_URL = "https://www.natomanga.com/";
const HOT_MANGA_URL = "https://www.natomanga.com/manga-list/hot-manga";
const mangaCache = new Map();
const latestUpdatesCache = { data: [], timestamp: 0 };
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

async function fetchLatestUpdates() {
    if (Date.now() - latestUpdatesCache.timestamp < CACHE_DURATION) {
        console.log("Serving latest updates from cache");
        return latestUpdatesCache.data;
    }

    try {
        const response = await axios.get(HOME_URL);
        const $ = cheerio.load(response.data);
        const latestUpdates = [];

        $("#contentstory .itemupdate").each((_, el) => {
            const title = $(el).find("h3 a").text().trim();
            const cover = $(el).find("a.cover img").attr("data-src") || $(el).find("a.cover img").attr("src");
            const url = $(el).find("h3 a").attr("href");
            const latestChapterElement = $(el).find("li").eq(1);
            const latest_chapter = latestChapterElement.find("a").text().trim();
            const latest_chapter_url = latestChapterElement.find("a").attr("href");
            const upload_time = latestChapterElement.find("i").text().trim();

            latestUpdates.push({ title, cover, url, latest_chapter, latest_chapter_url, upload_time });
        });

        latestUpdatesCache.data = latestUpdates;
        latestUpdatesCache.timestamp = Date.now();

        return latestUpdates;
    } catch (error) {
        console.error("Error fetching latest updates:", error);
        return [];
    }
}
async function fetchHotManga() {
    try {
        const response = await axios.get(HOT_MANGA_URL);
        const $ = cheerio.load(response.data);
        const hotManga = [];

        $(".truyen-list .list-truyen-item-wrap").each((_, el) => {
            hotManga.push({
                title: $(el).find("h3 a").text().trim(),
                cover: $(el).find(".cover img").attr("src"),
                url: $(el).find("h3 a").attr("href"),
                latestChapter: $(el).find(".list-story-item-wrap-chapter").text().trim(),
                latestChapterUrl: $(el).find(".list-story-item-wrap-chapter").attr("href"),
                views: $(el).find(".aye_icon").text().trim(),
                description: $(el).find("p").text().trim(),
            });
        });
        return hotManga;
    } catch (error) {
        console.error("Error fetching hot manga:", error);
        return [];
    }
}

const app = express();
app.use(cors());

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: { 
            getManga: async ({ id }) => await fetchManga(id),
            getLatestUpdates: async () => await fetchLatestUpdates()
        },
        graphiql: true,
    })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
