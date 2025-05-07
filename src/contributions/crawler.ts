import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchOptions } from "camoufox-js";
import {
	Configuration,
	PlaywrightCrawler,
	type Request,
	type RequestOptions,
} from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage/contributions");

export const crawler = async (
	requests: (string | Request | RequestOptions)[],
	maxRequestsPerCrawl: number,
) =>
	new PlaywrightCrawler(
		{
			maxRequestsPerCrawl,
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

				await page
					.locator("input[name='CanFName']")
					.fill(request.userData.first);
				await page
					.locator("input[name='CanLName']")
					.fill(request.userData.last);

				await page
					.locator("input[name='search_on'][type='radio'][value='2']")
					.click();

				await page.locator("input[name='rowlimit']").clear();

				await page.locator("input[name='queryformat'][value='2']").click();

				const downloadPromise = page.waitForEvent("download");

				await page.getByRole("button", { name: "Submit" }).click();

				const fileSafeFirstName = sanitize(request.userData.first);
				const fileSafeLastName = sanitize(request.userData.last);

				const fileName = path.join(
					storagePath,
					"datasets/downloads",
					`${fileSafeFirstName}-${fileSafeLastName}.txt`,
				);

				const download = await downloadPromise;
				await download.saveAs(fileName);

				await pushData({
					name: request.userData,
				});
			},
		},
		new Configuration({
			storageClientOptions: {
				localDataDirectory: storagePath,
			},
		}),
	).run(requests);
