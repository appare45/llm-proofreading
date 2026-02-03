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
		const results = await Promise.all(
			targets.map(async (fileLines) => {
				return await Promise.all(
					fileLines.map(async (line) => {
						const result = await proofreadLine(session, line.line);
						return {
							filename: line.filename,
							line: line.line,
							linenumber: line.linenumber,
							corrected: result.corrected,
							reason: result.reason,
						};
					}),
				);
			}),
		);

		return results.flat();
	} finally {
		// Clean up the session and client to prevent memory leaks
		await session.destroy();
		await client.stop();
	}
};
