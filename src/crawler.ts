import path from "node:path";
import { launchOptions } from "camoufox-js";
import { PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";
import namesToScrape from "./NAMES_TO_SCRAPE.json" with { type: "json" };

export const crawler = new PlaywrightCrawler({
	maxRequestsPerCrawl: namesToScrape.length + 1,
	browserPoolOptions: {
		useFingerprints: false,
	},
	launchContext: {
		launcher: firefox,
		launchOptions: await launchOptions({
			headless: true,
		}),
	},

	async requestHandler({ request, page, log, pushData }) {
		const title = await page.title();
		log.info(`${title}`, { url: request.loadedUrl });

		await page.locator("select[name='election']").selectOption("All");

		await page.locator("input[name='CanFName']").fill(request.userData.first);
		await page.locator("input[name='CanLName']").fill(request.userData.last);

		await page
			.locator("input[name='search_on'][type='radio'][value='2']")
			.click();

		await page.locator("input[name='rowlimit']").clear();

		await page.locator("input[name='queryformat'][value='2']").click();

		const downloadPromise = page.waitForEvent("download");

		await page.getByRole("button", { name: "Submit" }).click();

		const fileSafeFirstName = sanitize(request.userData.first);
		const fileSafeLastName = sanitize(request.userData.last);

		const absolutePath = path.resolve(
			"storage/datasets/downloads",
			`${fileSafeFirstName}-${fileSafeLastName}.txt`,
		);

		const download = await downloadPromise;
		await download.saveAs(absolutePath);

		await pushData({
			name: request.userData,
		});
	},
});
