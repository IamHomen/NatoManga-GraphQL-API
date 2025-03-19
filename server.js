const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");

const schema = buildSchema(`
    type Manga {
        title: String
        cover: String
        author: String
        status: String
        updated: String
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
        const updated = $(".manga-info-text li:contains('Last updated')").text().replace("Last updated :", "").trim();
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

        const mangaData = { title, cover, author, status, updated, genres, description, chapters };
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
const CACHE_DIR = path.join(__dirname, "cache");
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour Anime Pahe

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

app.use(cors());
app.use(express.json());

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: { 
            getManga: async ({ id }) => await fetchManga(id),
            getLatestUpdates: async () => await fetchLatestUpdates(),
            getHotManga: async () => await fetchHotManga()
        },
        graphiql: true,
    })
);

// 🚀 Proxy Image with Caching
app.get("/proxy-image", async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).send("Missing image URL.");
    }

    const imageFileName = encodeURIComponent(imageUrl);
    const imagePath = path.join(CACHE_DIR, imageFileName);

    // ✅ Serve from disk cache if exists
    if (fs.existsSync(imagePath)) {
        console.log("✅ Serving from disk cache:", imagePath);
        return res.sendFile(imagePath);
    }

    try {
        const response = await axios.get(decodeURIComponent(imageUrl), {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://www.natomanga.com/",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        fs.writeFileSync(imagePath, response.data); // ✅ Save image to disk

        console.log("🚀 Fetching from source:", imageUrl);
        res.set("Content-Type", response.headers["content-type"]);
        res.send(response.data);
    } catch (error) {
        console.error("❌ Error fetching image:", error.message);
        res.status(500).send("Error fetching image.");
    }
});

// 🚀 Rate limiting (100 requests per 15 min)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
});
app.set("trust proxy", 1);
app.use(limiter);

// ✅ Cleanup old files (auto-delete images older than 7 days)
setInterval(() => {
    fs.readdir(CACHE_DIR, (err, files) => {
        if (err) return console.error("Error reading cache directory:", err);
        const now = Date.now();
        files.forEach((file) => {
            const filePath = path.join(CACHE_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error("Error reading file stats:", err);
                if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) { // 7 days
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Error deleting file:", err);
                        else console.log("🗑️ Deleted old cache file:", filePath);
                    });
                }
            });
        });
    });
}, 24 * 60 * 60 * 1000); // Run cleanup every 24 hours

const ANIMEPAHE_BASE_URL = "https://animepahe.ru";

app.get("/anime/:id", async (req, res) => {
    try {
        const animeId = req.params.id;
        const cacheKey = `anime-${animeId}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const url = `${ANIMEPAHE_BASE_URL}/anime/${animeId}`;
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Referer": "https://animepahe.ru",
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "__ddgid_=uvwe8pkY9vVMTdG0; __ddg2_=Het8LdaILfm0B2E8; __ddg1_=MOiywMi3RBLrrGLZtxcS; res=1080; aud=jpn; av1=0; latest=5667; ann-fakesite=0; __ddg9_=110.54.144.240; __ddg10_=1742379866; __ddg8_=RkelUegxikezVZUS; XSRF-TOKEN=eyJpdiI6Ing2SkFTMWlzNy8yd1BkWlloNEY3bWc9PSIsInZhbHVlIjoiMG9KaFFQYjFTSDRTWUpSWlZpaVRkLzU1KzJzNFdGQlNZNGpOQjdISjAxYjBDWnJDalROZWI4MUZzcUs2Q3hnTDR5a1lpMi9pR05xbHBqc3FxbXFuRS9sNWpTd3UwZkdsMTRCNzN0WFFGL1E0M2tuYlF6VHkvY1NTK0tzQ29SZEMiLCJtYWMiOiJlMzhhMmJhNDQyOWRmYmMyMDYwNWE3ODAwYzExZGE3ZTI4OWIzMzE4Nzk3NWU1YTY0ZWEyYmUwN2FkM2I4NGZiIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IlBSU0NyR0hMVnR0OEtSdGptdUZ4OWc9PSIsInZhbHVlIjoiY1I4NzRLVUIrL2x6b1U5b29FLzU1bUdCemlzK0RGMENBT0hzbXNCNHF6eGV1cmZTRmMwZ3V2bHluOEVNOVFJVkNxU3FGS0sxNjZyUG9xcStNNzROSUMvUTc3K1pYdlcyTHNCZjBaQ1Z2RjFWQzZ6c0N2M2Rza0FLaUpIckVVS3YiLCJtYWMiOiI5ZWI1OGZiY2E3ZjZhMmNlYWQ2Mzk5MDJmMGM4YTkxNDUyZmUwOTQ0YmJjMGRhNjVmNGQwZTBkYTFhZjY4OWMxIiwidGFnIjoiIn0%3D",
        };

        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        const animeCover = `https:${$('div.anime-cover').attr('data-src')}`;
        const animePoster = $(".anime-poster a").attr("href");
        const title = $("div.title-wrapper > h1 > span").text().trim();
        const alternativeTitle = $("h2.japanese").text().trim();
        const description = $('div.anime-summary').text().trim();
        const genres = $('div.anime-genre ul li a').map((i, el) => $(el).attr('title')).get();
        const status = $('div.anime-info p:contains("Status:") a').text().trim();
        const type = $('div.anime-info > p:contains("Type:") > a').text().trim().toUpperCase();
        const releaseDate = $('div.anime-info > p:contains("Aired:")').text().split('to')[0].replace('Aired:', '').trim();
        const studios = $('div.anime-info > p:contains("Studio:")').text().replace('Studio:', '').trim().split('\n');
        const totalEpisodes = parseInt($('div.anime-info > p:contains("Episodes:")').text().replace('Episodes:', ''), 10);

        const recommendations = [];
        $('div.anime-recommendation .col-sm-6').each((i, el) => {
            recommendations.push({
                id: $(el).find('.col-2 > a').attr('href')?.split('/')[2],
                title: $(el).find('.col-2 > a').attr('title'),
                image: $(el).find('.col-2 > a > img').attr('src') || $(el).find('.col-2 > a > img').attr('data-src'),
                url: `${ANIMEPAHE_BASE_URL}/anime/${$(el).find('.col-2 > a').attr('href')?.split('/')[2]}`,
                releaseDate: $(el).find('div.col-9 > a').text().trim(),
                type: $(el).find('div.col-9 > strong').text().trim(),
            });
        });

        const relations = [];
        $('div.anime-relation .col-sm-6').each((i, el) => {
            relations.push({
                id: $(el).find('.col-2 > a').attr('href')?.split('/')[2],
                title: $(el).find('.col-2 > a').attr('title'),
                image: $(el).find('.col-2 > a > img').attr('src') || $(el).find('.col-2 > a > img').attr('data-src'),
                url: `${ANIMEPAHE_BASE_URL}/anime/${$(el).find('.col-2 > a').attr('href')?.split('/')[2]}`,
                releaseDate: $(el).find('div.col-9 > a').text().trim(),
                type: $(el).find('div.col-9 > strong').text().trim(),
                relationType: $(el).find('h4 > span').text().trim(),
            });
        });

        const episodes = [];

        try {
            const episodeApiUrl = `${ANIMEPAHE_BASE_URL}/api?m=release&id=${animeId}&sort=episode_asc&page=1`;
            const { data } = await axios.get(episodeApiUrl, { headers });

            if (data && data.data) {
                data.data.forEach((ep) => {
                    episodes.push({
                        episodeNum: ep.episode,
                        episodeUrl: `${ANIMEPAHE_BASE_URL}/play/${animeId}/${ep.session}`,
                    });
                });
            }
        } catch (episodeError) {
            console.error("Error fetching episode data:", episodeError.message);
        }

        const animeData = {
            animeCover,
            animePoster,
            title,
            alternativeTitle,
            description,
            genres,
            status,
            type,
            releaseDate,
            studios,
            totalEpisodes,
            recommendations,
            relations,
            episodes,
        };

        cache.set(cacheKey, animeData); // Save data in cache
        res.json(animeData);
    } catch (error) {
        console.error("Error fetching anime info:", error.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
