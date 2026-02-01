import { proofreadPullRequest } from "./lib/proofreader.ts";
import { getEnvOrError } from "./utils/env.ts";

const github_token = getEnvOrError("GITHUB_TOKEN");
const owner = getEnvOrError("GITHUB_REPOSITORY_OWNER");
const repository = getEnvOrError("GITHUB_REPOSITORY").slice(owner.length + 1);
const base_ref = getEnvOrError("GITHUB_BASE_REF");
const head_ref = getEnvOrError("GITHUB_HEAD_REF");

const results = await proofreadPullRequest(
	{
		owner,
		repository,
		baseRef: base_ref,
		headRef: head_ref,
	},
	github_token,
);

for (const fileResults of results) {
	console.log(fileResults);
}

console.log("Done");
process.exit(0);
