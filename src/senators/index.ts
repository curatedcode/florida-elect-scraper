import { fileURLToPath } from "node:url";
import { crawler } from "./crawler.js";

export async function run() {
	await crawler.run(["https://www.flsenate.gov/Senators/"]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await run();
}
