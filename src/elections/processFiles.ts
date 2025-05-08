import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import _ from "lodash";
import Papa from "papaparse";
import { ensureDirExists } from "../ensureDirExists.js";

interface ElectionData {
	/**
	 * Date of the election.
	 * @example "11/5/2024"
	 */
	ElectionDate: string;
	/**
	 * Party code.
	 * @example "DEM"
	 */
	PartyCode: string;
	/**
	 * Name of the party.
	 * @example "Democrat"
	 */
	PartyName: string;
	/**
	 * Race code.
	 * @example "PRE"
	 */
	RaceCode: string;
	/**
	 * Race name.
	 * @example "President of the United States"
	 */
	OfficeDesc: string;
	/**
	 * County code.
	 * @example "ALA"
	 */
	CountyCode: string;
	/**
	 * County name.
	 * @example "Alachua"
	 */
	CountyName: string;
	/**
	 * Jurisdiction code 1.
	 * @example 6
	 */
	Juris1num: number;
	/**
	 * Jurisdiction code 2.
	 * @example 14
	 *
	 * Reserved for Circuit Judges.
	 */
	Juris2num: number | undefined;
	/**
	 * Precincts in district.
	 * @example 10
	 */
	Precincts: number;
	/**
	 * Total reporting precincts in district.
	 * @example 10
	 */
	PrecinctsReporting: number;
	/**
	 * Candidate last name.
	 * @example "Hartman"
	 */
	CanNameLast: string;
	/**
	 * Candidate first name.
	 * @example "Ralph"
	 */
	CanNameFirst: string;
	/**
	 * Candidate middle name.
	 * @example "E."
	 */
	CanNameMiddle: string | undefined;
	/**
	 * Total votes candidate received.
	 * @example 87711
	 */
	CanVotes: number;
}

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
};

export type Candidate = {
	name: string;
	votes: number;
	party: string;
	district: number;
};

export type Election = {
	candidates: Candidate[];
	district: number;
	totalVotes: number;
	winner: Candidate;
};

export async function processFiles({
	inputDir = "storage/elections/datasets/downloads",
	outputDir = "storage/elections/datasets/processed",
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

			const result = Papa.parse<ElectionData>(textData, {
				header: true,
				delimiter: "\t",
				skipEmptyLines: true,
				dynamicTyping: false,
				transformHeader: (header) => header.trim(),
			});

			if (result.errors && result.errors.length > 0) {
				console.warn(`Parsing warnings for ${file}:`, result.errors);
			}

			const grouped = _.chain(result.data)
				.filter((item) => item.RaceCode === "STS")
				.groupBy((item) => item.Juris1num)
				.map((items) => {
					const candidatesMerged = items.reduce<Record<string, ElectionData>>(
						(acc, item) => {
							const key = `${item.CanNameFirst} ${item.CanNameMiddle} ${item.CanNameLast}`;

							if (acc[key]) {
								acc[key].CanVotes += Number(item.CanVotes);
							} else {
								item.CanVotes = Number(item.CanVotes);
								acc[key] = item;
							}

							return acc;
						},
						{},
					);

					const _candidates = Object.entries(candidatesMerged).map(
						([_, item]) => item,
					);

					const candidates = _candidates.map((item) => {
						const withMiddleName = `${item.CanNameFirst} ${item.CanNameMiddle} ${item.CanNameLast}`;
						const withoutMiddleName = `${item.CanNameFirst} ${item.CanNameLast}`;

						return {
							name: item.CanNameMiddle ? withMiddleName : withoutMiddleName,
							votes: item.CanVotes,
							party: item.PartyCode,
							district: Number(item.Juris1num),
						};
					});

					return {
						candidates,
						district: candidates[0].district,
						totalVotes: candidates.reduce((acc, item) => acc + item.votes, 0),
						winner: candidates.sort((a, b) => b.votes - a.votes)[0],
					};
				})
				.value();

			const outputFolder = path.join(__dirname, "../../", outputDir);
			await ensureDirExists(outputFolder);

			const outputPathJson = path.join(
				outputFolder,
				file.replace(".txt", ".json"),
			);
			await fs.writeFile(outputPathJson, JSON.stringify(grouped, null, 2));

			console.log(
				`Processed ${file}: Found ${grouped.length} separate elections`,
			);
		}
	}
}
