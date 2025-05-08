import { fileURLToPath } from "node:url";
import { type CrawlerArgs, crawler } from "./crawler.js";
import { type ProcessFilesArgs, processFiles } from "./processFiles.js";

export type RunArgs = {
	crawlerOptions?: CrawlerArgs;
	processOptions?: ProcessFilesArgs;
};

export async function run({ crawlerOptions, processOptions }: RunArgs = {}) {
	await crawler(crawlerOptions);
	await processFiles(processOptions);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
