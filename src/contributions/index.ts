import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crawler } from "./crawler.js";
import { processFiles } from "./processFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootStoragePath = path.join(__dirname, "../../", "storage");

export async function run(data?: { first: string; last: string }[]) {
	let namesToScrape: { first: string; last: string }[] = [];

	if (data) {
		namesToScrape = data;
	} else {
		const namesFile = await fs.readFile(
			path.join(__dirname, "NAMES_TO_SCRAPE.json"),
			"utf-8",
		);
		namesToScrape = JSON.parse(namesFile);
	}

	await crawler(
		namesToScrape.map((name) => ({
			url: "https://dos.elections.myflorida.com/campaign-finance/contributions/#both",
			userData: name,
			uniqueKey: `${name.first}-${name.last}`,
		})),
		namesToScrape.length + 1,
	).then(() => {
		processFiles({
			inputFolder: path.join(
				rootStoragePath,
				"contributions/datasets/downloads",
			),
			outputType: ["json", "csv"],
		});
	});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
