import { run as contributionsCrawler } from "./contributions/index.js";
import { run as senatorCrawler } from "./senators/index.js";

// biome-ignore lint/correctness/noUnusedImports: Leave in for fast switching
import { formatForContributionsScrape } from "./senators/formatForContributionsScrape.js";

(async () => {
	await senatorCrawler().then(async () => {
		/**
		 * DEFAULT: Crawler will use the NAMES_TO_SCRAPE.json file
		 */
		await contributionsCrawler();

		/**
		 * Crawler will use the data from senatorCrawler()
		 */
		// await contributionsCrawler(await formatForContributionsScrape());
	});
})();
