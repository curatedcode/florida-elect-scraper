import { run as contributionsCrawler } from "./elections/index.js";
import { run as electionCrawler } from "./elections/index.js";
import { run as senatorCrawler } from "./senators/index.js";

(async () => {
	await senatorCrawler();
	await contributionsCrawler();
	await electionCrawler();
})();
