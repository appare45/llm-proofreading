import {
	createProofreadingClient,
	proofreadLine,
} from "../services/copilot.ts";
import { extractAddedLines } from "../services/patch.ts";
import type { ProofreadResult } from "../types/index.ts";

/**
 * Proofread lines from a patch content
 * Pure business logic function for easy testing
 */
export const proofreadPatch = async (
	patchContent: string,
): Promise<ProofreadResult[]> => {
	const addedLines = extractAddedLines(patchContent);
	const copilotClient = createProofreadingClient();

	const results = await Promise.all(
		addedLines.map(async (fileLines) => {
			return await Promise.all(
				fileLines.map(async (line) => {
					const corrected = await proofreadLine(copilotClient, line.line);
					return {
						filename: line.filename,
						line: line.line,
						linenumber: line.linenumber,
						corrected,
					};
				}),
			);
		}),
	);

	return results.flat();
};
