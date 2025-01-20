export const descriptivenessQuotient = (bins: number[]): number[] => {
	const binCounts = bins.reduce((cs: number[], b) => {
		cs[b] = (cs[b] ?? 0) + 1;
		return cs;
	}, []);

	const binPercentiles = binCounts.map(
		(count, i) => (count / 2 + binCounts.slice(0, i).reduce((a, b) => a + b, 0)) / bins.length
	);
	return bins.map((v) => binPercentiles[v]);
};
