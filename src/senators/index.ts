import { fileURLToPath } from "node:url";
import { type CrawlerArgs, crawler } from "./crawler.js";

export type RunArgs = {
	crawlerOptions?: CrawlerArgs;
};

export async function run({ crawlerOptions }: RunArgs = {}) {
	await crawler(crawlerOptions);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
