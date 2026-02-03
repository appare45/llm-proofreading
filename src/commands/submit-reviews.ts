import { submitReviews } from "../lib/reviewer.ts";
import type { ProofreadResult } from "../types/index.ts";
import { getEnvOrError } from "../utils/env.ts";

export interface SubmitReviewsCommandOptions {
	pr: string;
}

/**
 * Submit reviews command handler
 * Reads review results from JSON and submits them as PR comments
 */
export const submitReviewsCommand = async (
	inputFile: string,
	options: SubmitReviewsCommandOptions,
): Promise<void> => {
	if (!inputFile) {
		throw new Error("Please provide a reviews file as an argument");
	}
	if (!options.pr) {
		throw new Error("Please provide a PR number with --pr");
	}

	// Read review results
	const reviewResults: ProofreadResult[] = await Bun.file(inputFile).json();

	// Get configuration from environment variables
	const githubToken = getEnvOrError("GITHUB_TOKEN");
	const owner = getEnvOrError("GITHUB_REPOSITORY_OWNER");
	const fullRepo = getEnvOrError("GITHUB_REPOSITORY");
	const repo = fullRepo.slice(owner.length + 1);
	const prNumber = Number.parseInt(options.pr, 10);
	const commitSha = getEnvOrError("GITHUB_SHA");

	// Submit reviews
	await submitReviews(
		githubToken,
		{ owner, repo, prNumber },
		commitSha,
		reviewResults,
	);
};
