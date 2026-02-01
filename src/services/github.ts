import { Octokit } from "octokit";
import type { GitHubConfig } from "../types/index.ts";

export const createGitHubClient = (token: string): Octokit => {
	return new Octokit({ auth: token });
};

export const getPullRequest = async (
	client: Octokit,
	config: GitHubConfig,
): Promise<{ number: number }> => {
	const { data: prs } = await client.rest.pulls.list({
		owner: config.owner,
		repo: config.repository,
		base: config.baseRef,
		head: config.headRef,
		per_page: 1,
	});

	if (prs.length < 1) throw new Error("PR not found");

	const pr = prs[0];
	if (!pr?.number) throw new Error("PR number is not found");

	return { number: pr.number };
};

export const getPullRequestDiff = async (
	client: Octokit,
	owner: string,
	repo: string,
	prNumber: number,
): Promise<string> => {
	const { data: raw_diff } = await client.rest.pulls.get({
		owner,
		repo,
		pull_number: prNumber,
		mediaType: {
			format: "diff",
		},
	});

	return raw_diff.toString();
};
