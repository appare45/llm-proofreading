import type { CopilotClient } from "@github/copilot-sdk";
import {
	createProofreadingSession,
	proofreadLine,
} from "../services/copilot.ts";
import type { AddedLine, ProofreadResult } from "../types/index.ts";

/**
 * Proofread extracted targets using Copilot API
 * Accepts a pre-created client to avoid recreating it on every call
 * Creates a single session for all proofreading requests
 * CRITICAL: Always cleans up session in finally block to prevent memory leaks
 * NOTE: Client cleanup is the responsibility of the caller
 */
export const proofreadTargets = async (
	targets: AddedLine[][],
	client: CopilotClient,
): Promise<ProofreadResult[]> => {
	const session = await createProofreadingSession(client);

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
		console.log("Cleaning up Copilot session");
		// Clean up the session to prevent memory leaks
		await session.destroy();
	}
};
