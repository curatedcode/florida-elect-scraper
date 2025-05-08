import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import _ from "lodash";
import Papa from "papaparse";
import { ensureDirExists } from "../ensureDirExists.js";

interface ContributionData {
	"Candidate/Committee": string;
	Date: string;
	Amount: string;
	Typ: string;
	"Contributor Name": string;
	Address: string;
	"City State Zip": string;
	Occupation: string | undefined;
	"Inkind Desc": string | undefined;
}

export type Contribution = {
	date: {
		earliest: string;
		latest: string;
	};
	totalAmount: number;
	contributionCount: number;
	name: string;
	addresses: {
		street: string;
		city: string;
		state: string;
		zipCode?: number;
	}[];
	occupations: string[];
};

export type ProcessFilesArgs = {
	/**
	 * The path to the folder containing the elections .txt data files.
	 *
	 * Defaults to "storage/elections/datasets/downloads".
	 *
	 * Base starts at the level of `src` folder.
	 */
	inputDir?: string;
	/**
	 * The path to the folder where processed files will be saved.
	 *
	 * Defaults to "storage/elections/datasets/processed".
	 *
	 * Base starts at the level of `src` folder.
	 */
	outputDir?: string;
	/**
	 * The output type for the processed data.
	 *
	 * Defaults to `["json"]`.
	 */
	outputType?: ("csv" | "json")[];
};

export async function processFiles({
	inputDir = "storage/contributions/datasets/downloads",
	outputDir = "storage/contributions/datasets/processed",
	outputType = ["json"],
}: ProcessFilesArgs = {}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	console.log(`Processing files in: ${inputDir}`);
	const files = await fs.readdir(inputDir);

	for (const file of files) {
		const fullPath = path.join(inputDir, file);

		const fileStat = await fs.stat(fullPath);
		if (fileStat.isFile() && path.extname(file) === ".txt") {
			console.log(`Processing file: ${file}`);
			const textData = await fs.readFile(fullPath, "utf8");

			const result = Papa.parse<ContributionData>(textData, {
				header: true,
				delimiter: "\t",
				dynamicTyping: false,
				transformHeader: (header) => header.trim(),
			});

			if (result.errors && result.errors.length > 0) {
				console.warn(`Parsing warnings for ${file}:`, result.errors);
			}

			const grouped = _.chain(result.data)
				.filter((item) => !!item["Contributor Name"])
				.groupBy((item) => item["Contributor Name"])
				.map((items, contributor): Contribution => {
					const totalContribution = _.sumBy(items, (item) =>
						Number(item.Amount),
					);

					const addresses: (Contribution["addresses"][0] | undefined)[] =
						items.map((item) => {
							if (
								item.Address.includes("*") ||
								item["City State Zip"].includes("*")
							)
								return;
							console.log(item);
							const splitAddress = item["City State Zip"].split(",");
							const stateZip = splitAddress[1].trim().split(" ");

							return {
								street: item.Address,
								city: splitAddress[0].trim(),
								state: stateZip[0].trim(),
								zipCode:
									stateZip.length > 1 ? Number(stateZip[1].trim()) : undefined,
							};
						});

					const sortedByDate = items.sort(
						(a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime(),
					);
					const occupations = items
						.map((item) => item.Occupation)
						.filter((i): i is string => !!i);

					return {
						name: contributor,
						addresses: addresses.filter(
							(i): i is Contribution["addresses"][0] => !!i,
						),
						date: {
							earliest: sortedByDate[0].Date,
							latest: sortedByDate[sortedByDate.length - 1].Date,
						},
						totalAmount: totalContribution,
						contributionCount: items.length,
						occupations,
					};
				})
				.value();

			const jsonOutputFileName = file.replace(".txt", ".json");
			const csvOutputFileName = file.replace(".txt", ".csv");

			const outputFolder = path.join(__dirname, "../../", outputDir);
			await ensureDirExists(outputFolder);

			const outputPathJson = path.join(outputFolder, jsonOutputFileName);
			const outputPathCsv = path.join(outputFolder, csvOutputFileName);

			for (const type of new Set(outputType)) {
				if (type === "json") {
					await fs.writeFile(outputPathJson, JSON.stringify(grouped, null, 2));
				} else {
					await fs.writeFile(outputPathCsv, Papa.unparse(grouped));
				}
			}

			console.log(
				`Processed ${file}: Found ${grouped.length} separate contributions`,
			);
		}
	}
}
