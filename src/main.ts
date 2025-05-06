import { launchOptions } from "camoufox-js";
import { PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import { router } from "./routes.js";

const crawler = new PlaywrightCrawler({
	requestHandler: router,
	maxRequestsPerCrawl: 20,
	browserPoolOptions: {
		useFingerprints: false,
	},
	launchContext: {
		launcher: firefox,
		launchOptions: await launchOptions({
			headless: true,
			block_images: true,
		}),
	},
});

await crawler.run([]);
