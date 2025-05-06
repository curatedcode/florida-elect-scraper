import { createPlaywrightRouter } from "crawlee";

export const router = createPlaywrightRouter();

router.addHandler("detail", async ({ request, page, log, pushData }) => {
	const title = await page.title();
	log.info(`${title}`, { url: request.loadedUrl });

	await pushData({
		url: request.loadedUrl,
		title,
	});
});
