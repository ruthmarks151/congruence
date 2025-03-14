import * as R from 'ramda';

export function linearRegression(x_values: number[], y_values: number[]) {
	//Set variables we'll need to get the slope and intercept; we need to find the equation in the format y = m*x+b where m is the slope and b is the intercept
	const x_mean = R.sum(x_values) / x_values.length;
	const y_mean = R.sum(y_values) / y_values.length;

	//Equations to solve for slope:
	const slope_numerator = R.sum(
		R.zipWith((x: number, y: number) => (x - x_mean) * (y - y_mean), x_values, y_values)
	);
	const slope_denominator = R.sum(x_values.map((x) => Math.pow(x - x_mean, 2)));

	const slope = slope_numerator / slope_denominator;

	//Equation to solve for intercept
	const intercept = y_mean - x_mean * slope;

	//Get y_hat, or predicted values of y based on x_values
	//Loop through x_values, and run the elements through the lr equation to get predictions
	const y_hats = x_values.map((x) => x * slope + intercept);

	const residuals = R.zipWith(
		(y_hat: number, y: number) => Math.pow(y_hat - y, 2),
		y_hats,
		y_values
	);
	const residual_sum_of_squares = R.sum(residuals);

	const tss_values = y_values.map((y) => Math.pow(y - y_mean, 2));
	const total_sum_of_squares = R.sum(tss_values);
	const r2 = 1 - residual_sum_of_squares / total_sum_of_squares;

	return { slope, intercept, r2 };
}

export const correlationExplainerString = (r: number) => {
	const dir = r > 0 ? 'positive' : 'negative';
	if (Math.abs(r) >= 0.9) {
		return `Very strong ${dir} correlation`;
	} else if (Math.abs(r) >= 0.75) {
		return `Strong ${dir} correlation`;
	} else if (Math.abs(r) >= 0.45) {
		return `Moderate ${dir} correlation`;
	} else if (Math.abs(r) >= 0.15) {
		return `Weak ${dir} correlation`;
	} else {
		return `Near zero correlation`;
	}
};
