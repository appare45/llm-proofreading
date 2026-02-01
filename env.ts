export const getEnvOrError = (name: string): string => {
	const env = Bun.env[name];
	if (env === undefined) {
		throw new Error(`Env ${name} is not set`);
	}
	return env;
};
