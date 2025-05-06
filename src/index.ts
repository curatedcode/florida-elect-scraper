import namesToScrape from "./NAMES_TO_SCRAPE.json" with { type: "json" };
import { crawler } from "./crawler.js";
import { processFiles } from "./processFiles.js";

(async function main() {
	await crawler
		.run(
			namesToScrape.map((name) => ({
				url: "https://dos.elections.myflorida.com/campaign-finance/contributions/#both",
				userData: name,
				uniqueKey: `${name.first}-${name.last}`,
			})),
		)
		.then(() => {
			processFiles({
				inputFolder: "storage/datasets/downloads",
				outputType: ["json", "csv"],
			});
		});
})();
