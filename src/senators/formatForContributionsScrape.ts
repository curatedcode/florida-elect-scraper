import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Senator } from "./crawler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage");

export async function formatForContributionsScrape() {
	const datasetDir = path.join(storagePath, "senators/datasets/default");
	const files = await fs.readdir(datasetDir);

	const formattedData: string[] = [];

	for (const filename of files) {
		const filePath = path.join(datasetDir, filename);
		const fileContents = await fs.readFile(filePath, "utf-8");
		const jsonData = JSON.parse(fileContents) as { senators: Senator[] };

		for (const senator of jsonData.senators) {
			const nameSplit = senator.name.split(" ");

			const firstName = nameSplit[1];
			const lastName = nameSplit[0];

			formattedData.push(`${firstName} ${lastName}`);
		}
	}

	return formattedData;
}
