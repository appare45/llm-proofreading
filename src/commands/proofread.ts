import { proofreadTargets } from "../lib/proofreader.ts";
import type { AddedLine } from "../types/index.ts";

export interface ProofreadCommandOptions {
	output?: string;
}

/**
 * Validate targets input structure
 * Ensures the input matches AddedLine[][] format
 */
const validateTargets = (data: unknown): AddedLine[][] => {
	if (!Array.isArray(data)) {
		throw new TypeError("Targets must be an array");
	}

	for (let i = 0; i < data.length; i++) {
		const fileLines = data[i];

		if (!Array.isArray(fileLines)) {
			throw new TypeError(`Targets[${i}] must be an array`);
		}

		for (let j = 0; j < fileLines.length; j++) {
			const line = fileLines[j];

			if (typeof line !== "object" || line === null) {
				throw new TypeError(
					`Targets[${i}][${j}] must be an object`,
				);
			}

			if (typeof line.filename !== "string") {
				throw new TypeError(
					`Targets[${i}][${j}].filename must be a string`,
				);
			}

			if (typeof line.line !== "string") {
				throw new TypeError(
					`Targets[${i}][${j}].line must be a string`,
				);
			}

			if (typeof line.linenumber !== "number") {
				throw new TypeError(
					`Targets[${i}][${j}].linenumber must be a number`,
				);
			}
		}
	}

	return data as AddedLine[][];
};

/**
 * Proofread command handler
 * Reads a targets JSON file, proofreads it, and outputs results as JSON
 */
export const proofreadCommand = async (
	inputFile: string,
	options: ProofreadCommandOptions,
): Promise<void> => {
	if (!inputFile) {
		throw new Error("Please provide a targets file as an argument");
	}

	// Read and parse JSON file
	let data: unknown;
	try {
		data = await Bun.file(inputFile).json();
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(`Invalid JSON in targets file: ${error.message}`);
		}
		throw error;
	}

	// Validate input structure
	const targets = validateTargets(data);

	// Proofread all targets
	const results = await proofreadTargets(targets);

	// Report summary
	const corrections = results.filter((r) => r.corrected !== r.line);
	console.error(
		`Found ${corrections.length} corrections out of ${results.length} lines`,
	);

	// Output results
	const json = JSON.stringify(results, null, 2);

	if (options.output) {
		await Bun.write(options.output, json);
		console.error(`Output written to ${options.output}`);
	} else {
		console.log(json);
	}
};
