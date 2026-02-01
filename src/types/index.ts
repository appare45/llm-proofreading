export interface AddedLine {
	filename: string;
	line: string;
	linenumber: number;
}

export interface ProofreadResult extends AddedLine {
	corrected: string;
}

export interface GitHubConfig {
	owner: string;
	repository: string;
	baseRef: string;
	headRef: string;
}
