import {
	createProofreadingClient,
	proofreadLine,
} from "../services/copilot.ts";
import type { AddedLine, ProofreadResult } from "../types/index.ts";

/**
 * Proofread extracted targets using Copilot API
 * Creates a single Copilot client/session for all proofreading requests
 * CRITICAL: Always cleans up resources in finally block to prevent memory leaks
 */
export const proofreadTargets = async (
	targets: AddedLine[][],
): Promise<ProofreadResult[]> => {
	const { client, session } = await createProofreadingClient();

	try {
		const results: ProofreadResult[] = [];

		// Process files and lines sequentially to avoid overwhelming the Copilot session
		for (const fileLines of targets) {
			for (const line of fileLines) {
				const result = await proofreadLine(session, line.line);
				results.push({
					filename: line.filename,
					line: line.line,
					linenumber: line.linenumber,
					corrected: result.corrected,
					reason: result.reason,
				});
			}
		}

		return results;
	} finally {
		console.log("Cleaning up Copilot session and client");
		// Clean up the session and client to prevent memory leaks
		await session.destroy();
		await client.stop();
	}
};
