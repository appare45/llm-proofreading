import { Octokit } from "octokit";
import type { PullRequestContext } from "../types/index.ts";

export const createGitHubClient = (token: string): Octokit => {
	return new Octokit({ auth: token });
};

export const createReview = async (
	client: Octokit,
	context: PullRequestContext,
	commit_id: string,
	comments: Array<{
		path: string;
		line: number;
		body: string;
	}>,
): Promise<void> => {
	await client.rest.pulls.createReview({
		owner: context.owner,
		repo: context.repo,
		pull_number: context.prNumber,
		commit_id,
		event: "COMMENT",
		comments:
			comments.map((comment) => ({ side: "RIGHT", ...comment })),
	});
};
