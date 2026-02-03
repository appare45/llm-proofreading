import { proofreadPatch } from "../lib/proofreader.ts";

export interface ReviewCommandOptions {
	output?: string;
}

/**
 * Review command handler
 * Reads a patch file, proofreads it, and outputs results as JSON
 */
export const reviewCommand = async (
	inputFile: string,
	options: ReviewCommandOptions,
): Promise<void> => {
	if (!inputFile) {
		throw new Error("Please provide a patch file as an argument");
	}

	// Read patch file
	const patchContent = await Bun.file(inputFile).text();

	// Proofread all lines
	const results = await proofreadPatch(patchContent);

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
