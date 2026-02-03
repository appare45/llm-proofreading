import { parseArgs } from "node:util";

import { extractTargetsCommand } from "./commands/extract-targets.ts";
import { proofreadCommand } from "./commands/proofread.ts";
import { submitReviewsCommand } from "./commands/submit-reviews.ts";

const { positionals, values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		output: {
			type: "string",
			short: "o",
		},
		pr: {
			type: "string",
		},
	},
	allowPositionals: true,
});
const subcommand = positionals[0];
const inputFile = positionals[1];
const outputFile = values.output;

if (!subcommand) {
	throw new Error("Please provide a subcommand. Available subcommands: extract-targets, proofread, submit-reviews");
}

switch (subcommand) {
	case "extract-targets": {
		if (!inputFile) {
			throw new Error("Please provide an input file for the extract-targets subcommand");
		}
		await extractTargetsCommand(inputFile, { output: outputFile });
		break;
	}
	case "proofread": {
		if (!inputFile) {
			throw new Error("Please provide an input file for the proofread subcommand");
		}
		await proofreadCommand(inputFile, { output: outputFile });
		break;
	}
	case "submit-reviews": {
		if (!inputFile) {
			throw new Error("Please provide an input file for the submit-reviews subcommand");
		}
		await submitReviewsCommand(inputFile, { pr: values.pr || "" });
		break;
	}
	default: {
		throw new Error(
			`Unknown subcommand: ${subcommand}. Available subcommands: extract-targets, proofread, submit-reviews`,
		);
	}
}

process.exit(0);
