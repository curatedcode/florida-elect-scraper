import path from "node:path";
import { fileURLToPath } from "node:url";
import { crawler } from "./crawler.js";
import { processFiles } from "./processFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage/elections");

/**
 * Only pulls the election data for State Senate races.
 *
 * @param electionDates - Need to be formatted "M/D/YYYY" no leading 0's in Month or Day
 */
export async function run(electionDates?: string[]) {
	const _electionDates = electionDates ?? ["11/5/2024"];

	for (const date of _electionDates) {
		const month = date.split("/")[0];
		const day = date.split("/")[1];

		if (month[0] === "0" || day[0] === "0") {
			throw new Error(
				"Invalid date format. Month/Day should not have leading 0",
			);
		}
	}

	await crawler(
		_electionDates.map((date) => ({
			url: `https://results.elections.myflorida.com/downloadresults.asp?ElectionDate=${date}&DATAMODE=`,
			userData: {
				electionDate: date,
			},
		})),
		_electionDates.length + 1,
	).then(() => {
		processFiles(path.join(storagePath, "datasets/downloads"));
	});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
