import { fileURLToPath } from "node:url";
import { type CrawlerArgs, crawler } from "./crawler.js";
import { type ProcessFilesArgs, processFiles } from "./processFiles.js";

export type RunArgs = {
	crawlerOptions?: CrawlerArgs;
	processFilesOptions?: ProcessFilesArgs;
};

export async function run({
	crawlerOptions,
	processFilesOptions,
}: RunArgs = {}) {
	await crawler(crawlerOptions);
	await processFiles(processFilesOptions);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
