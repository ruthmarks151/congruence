declare global {
	interface ArrayConstructor {
		isArray(arg: unknown): arg is unknown[] | readonly unknown[];
	}
}
import { Either } from 'effect';

export const asTaggedUnion = <R, L>(eith: Either.Either<R, L>) =>
	Either.match(eith, {
		onRight(right) {
			return ['Right', right] as const;
		},
		onLeft(left) {
			return ['Left', left] as const;
		}
	});
