export interface AddedLine {
	filename: string;
	line: string;
	linenumber: number;
}

export interface ProofreadResult extends AddedLine {
	corrected: string;
	reason: string;
}

export interface PullRequestContext {
	owner: string;
	repo: string;
	prNumber: number;
}

export interface ReviewComment {
	path: string;
	line: number;
	body: string;
}
