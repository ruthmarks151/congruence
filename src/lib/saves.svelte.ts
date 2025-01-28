export interface Sort {
	extras?: unknown;
	sortedOn: string;
	subject: string;
	statementPositions: number[];
}
export interface Save {
	statements: string[];
	sorts: Sort[];
}
import * as R from 'ramda';

export const calcCongruence = (zippedRows: [string, number, number][]) => {
	return correl(
		zippedRows.map((r) => r[1]),
		zippedRows.map((r) => r[2])
	);
};

export const correl = (xs: number[], ys: number[]) => {
	const sumLeft = xs.reduce((sum, r) => sum + r, 0);
	const sumRight = ys.reduce((sum, r) => sum + r, 0);
	///SUM(X,Y) = (41 x 94)
	const sumProd = R.zip(xs, ys).reduce((sum, r) => sum + r[0] * r[1], 0);

	const sumLeftSquared = xs.reduce((sum, r) => sum + r * r, 0);
	const sumRightSquared = ys.reduce((sum, r) => sum + r * r, 0);

	return (
		(xs.length * sumProd - sumLeft * sumRight) /
		Math.sqrt(
			(xs.length * sumLeftSquared - sumLeft * sumLeft) *
				(xs.length * sumRightSquared - sumRight * sumRight)
		)
	);
};
import { browser } from '$app/environment';

export let statementSets: unknown[] = $state([]);
let sorts = $state([] as Sort[]);

export const getSorts = () => sorts;

export const setSorts = (newSorts: Sort[]) => {
	sorts = newSorts;
};

export const loadSave = (): Save => {
	const tempText = (browser && window.localStorage.getItem('WorkingSave')) || '';
	let parsedObj;
	try {
		parsedObj = JSON.parse(tempText);
	} catch (error) {
		if (browser) {
			window.location.href = '/';
		}
	}
	if (isSave(parsedObj)) {
		return parsedObj;
	}
	if (browser) {
		window.location.href = '/';
	}
	return { statements: [], sorts: [] };
};

export const doSave = (s: Save) => {
	if (browser) {
		window.localStorage.setItem('WorkingSave', JSON.stringify(s, null, '  '));
	}
};

export const isSave = (o: unknown): o is Save =>
	typeof o === 'object' &&
	o !== null &&
	'statements' in o &&
	Array.isArray(o.statements) &&
	o.statements.every((s) => typeof s === 'string') &&
	'sorts' in o &&
	Array.isArray(o.sorts) &&
	o.sorts.every(
		(s) =>
			typeof s === 'object' &&
			typeof s.sortedOn === 'string' &&
			typeof s.subject === 'string' &&
			Array.isArray(s.statementPositions) &&
			s.statementPositions.every((p: unknown) => typeof p === 'number')
	);

export const templates: Record<string, Save> = {
	'Blank IASR 64': {
		statements: [
			'Self-Assured',
			'Self-Confident',
			'Assertive',
			'Persistent',
			'Firm',
			'Dominant',
			'Forceful',
			'Domineering',
			'Cocky',
			'Crafty',
			'Cunning',
			'Boastful',
			'Wily',
			'Calculating',
			'Tricky',
			'Silly',
			'Ruthless',
			'Ironhearted',
			'Hardhearted',
			'Uncharitable',
			'Coldhearted',
			'Cruel',
			'Unsympathetic',
			'Warmthless',
			'Uncheary',
			'Unneighbourly',
			'Distatnt',
			'Dissocial',
			'Unsociable',
			'Antisocial',
			'Unsparkling',
			'Introverted',
			'Timid',
			'Bashful',
			'Shy',
			'Meek',
			'Forceless',
			'Unauthoritative',
			'Unbold',
			'Unaggressive',
			'Unargumentative',
			'Undemanding',
			'Uncalculating',
			'Uncrafty',
			'Boastless',
			'Unwily',
			'Uncunning',
			'Unsly',
			'Softhearted',
			'Accomodating',
			'Gentlehearted',
			'Tenderhearted',
			'Charitable',
			'Tender',
			'Sympathetic',
			'Kind',
			'Cheerful',
			'Friendly',
			'Neighbourly',
			'Jovial',
			'Perky',
			'Enthusiastic',
			'Outgoing',
			'Extraverted'
		],
		sorts: []
	},
	'Blank California 100': {
		statements: [
			'1. Is critical, skeptical, not easily impressed.',
			'2. Is a genuinely dependable and responsible person.',
			'3. Has a wide range of interests. (NB.: Superficiality or depth of interest is irrelevant here.)',
			'4. Is a talkative individual.',
			'5. Behaves in a giving way toward others. (N.B.: Regardless of the motivation involved.)',
			'6. Is fastidious. (NB.: Attentive to and concerned about accuracy and detail.)',
			'7. Favors conservative values in a variety of areas.',
			'8. Appears to have a high degree of intellectual capacity. (N.B.: Whether actualized or not. Originality is not necessarily assumed.)',
			'9. Is uncomfortable with uncertainty and complexities.',
			'10. Anxiety and tension find outlet in bodily symptoms. (N.B.: If placed high, implies bodily dysfunction; if placed low, implies absence of autonomic arousal.)',
			'11. Is protective of those close to him. (NB.: Placement of this item expresses behavior ranging from over-protection through appropriate nurturance to a laissez-faire, under-protective manner.)',
			'12. Tends to be self-defensive.',
			'13. Is thin-skinned; vulnerable to anything that can be construed as criticism or an interpersonal slight.',
			'14. Basically submissive.',
			'15. The "light touch" as compared to the "heavy touch."',
			'16. Is introspective. (N.B.: Introspectiveness per se does not imply insight.)',
			'17. Behaves in a sympathetic or considerate manner.',
			'18. Initiates humor.',
			'19. Seeks reassurance from others.',
			'20. Has a rapid personal tempo.',
			'21. Arouses nurturant feelings in others of both sexes.',
			'22. Feels a lack of personal meaning in life. (Uncharacteristic end means zest.)',
			'23. Extrapunitive; tends to transfer or project blame.',
			'24. Prides self on being "objective," rational. (Regardless of whether person is really objective or rational.)',
			'25. Tends toward overcontrol of needs and impulses; binds tensions excessively; delays gratification unnecessarily.',
			'26. Is productive; gets things done. (Regardless of speed.)',
			'27. Shows condescending behavior in relations with others.',
			'28. Tends to arouse liking and acceptance in people.',
			'29. Is turned to for advice and reassurance.',
			'30. Gives up and withdraws where possible in the face of frustra-tion and adversity.',
			'31. Is satisfied with physical appearance.',
			'32. Seems to be aware of the impression he/she makes on others.',
			'33. Is calm, relaxed in manner.',
			'34. Over-reactive to minor frustrations; irritable.',
			'35. Has warmth; is compassionate.',
			'36. Is negativistic; tends to undermine and obstruct or sabotage.',
			'37. Is guileful and deceitful, manipulative, opportunistic.',
			'38. Has hostility toward others. (NB.: Basic hostility is intended here; mode of expression is to be indicated by other items.)',
			'39. Thinks and associates to ideas in unusual ways; has unconven-tional thought processes. (Either pathological or creative.)',
			'40. Is vulnerable to real or fancied threat, generally fearful.',
			'41. Is moralistic. (NB.: Regardless of the particular nature of the moral code.)',
			'42. Reluctant to commit self to any definite course of action; tends to delay or avoid action. (Uncharacteristic end indicates quick to act.)',
			'43. Is facially and/or gesturally expressive.',
			'44. Evaluates the motivation of others in interpreting situations. (NB.: Accuracy of evaluation is not assumed. NB.: Again, extreme placement in one direction implies preoccupation with motivational interpretations; at the other extreme, the item implies a psychological obtuseness. S does not consider motivational factors.)',
			'45. Has a brittle ego-defense system; has a small reserve of inte-gration; would be disorganized and maladaptive when under stress or trauma.',
			'46. Engaged in personal fantasy and daydreams, fictional specula-tions.',
			'47. Tends to feel guilty. (NB.: Regardless of whether verbalized or not.)',
			'48. Aloof, keeps people at a distance; avoids close interpersonal relationships.',
			'49. Is basically distrustful of people in general; questions their motivations.',
			'50. Is unpredictable and changeable in behavior and attitudes.',
			'51. Genuinely values intellectual and cognitive matters. (N.B.: Ability or achievement are not implied here.)',
			'52. Behaves in an assertive fashion in interpersonal situations. (NB.: Item 14 reflects underlying submissiveness; this refers to overt behavior.)',
			'53. Tends toward undercontrol of needs and impulses; unable to delay gratification.',
			'54. Emphasizes being with others; gregarious.',
			'55. Is self-defeating.',
			'56. Responds to humor.',
			'57. Is an interesting, arresting person.',
			'58. Enjoys sensuous experiences(including touch, taste, smell, phys-ical contact).',
			'59. Is concerned with own body and the adequacy of its physiologi-cal functioning. (Body cathexis.)',
			'60. Has insight into own motives and behavior.',
			'61. Creates and exploits dependency in people. (N.B.: Regardless of the techniques employed, e.g., punitiveness, overindulgence. NB.: At the other end of the scale, item implies respecting and encouraging the independence and individuality of others.)',
			'62. Tends to be rebellious and nonconforming.',
			'63. Judges self and others in conventional terms like "popularity," "the correct thing to do," social pressures, etc.',
			'64. Is socially perceptive of a wide range of interpersonal cues.',
			'65. Characteristically pushes and tries to stretch limits; sees what he can get away with.',
			'66. Enjoys esthetic impressions; is esthetically reactive.',
			'67. Is self-indulgent.',
			'68. Is basically anxious.',
			'69. Is bothered by anything that can be construed as a demand. (NB.: No implication of the kind of subsequent response is intended here.)',
			'70. Behaves in an ethically consistent manner; is consistent with own personal standards.',
			'71. Has high aspiration level for self.',
			'72. Overconcerned with own adequacy as a person, either at con-scious or unconscious levels. (NB.: A clinical judgment is required here; number 74 reflects subjunctive satisfaction with self.)',
			'73. Tends to perceive many different contexts in sexual terms; eroticizes situations.',
			'74. Is consciously unaware of self-concern; feels satisfied with self.',
			'75. Has a clear-cut, internally consistent personality. (NB.: Amount of information available before sorting is not intended here.)',
			'76. Tends to project his own feelings and motivations onto others.',
			'77. Appears straightforward, forthright, candid in dealings with others.',
			'78. Feels cheated and victimized by life.',
			'79. Tends to ruminate and have persistent, preoccupying thoughts (either pathological or creative).',
			'80. Interested in members of the opposite sex. (NB.: At opposite end, item implies absence of such interest.)',
			'81. Is physically attractive, good-looking. (NB.: The cultural cri-terion is to be applied here.)',
			'82. Has fluctuating moods.',
			'83. Able to see to the heart of important problems.',
			'84. Is cheerful. (NB.: Extreme placement toward uncharacteristic end of continuum implies gloominess.)',
			'85. Is self-pitying (whiny).',
			'86. Handles anxiety and conflicts by repressive or dissociative ten-dencies.',
			'87. Interprets basically simple and clear-cut situations in compli-cated and particularizing ways.',
			'88. Is personally charming.',
			'89. Compares self to others. Is alert to real or fancied differences between self and other people.',
			'90. Is concerned with philosophical problems; e.g., religion, values, the meaning of life, etc.',
			'91. Is power-oriented; values power in self or others.',
			'92. Has social poise and presence; appears socially at ease.',
			'93. Behaves in a style and manner consistent with their gender. (NB.: Again, the cultural or subcultural conception is to be applied as a criterion.)',
			'94. Expresses hostile feelings directly.',
			'95. Tends to proffer advice.',
			'96. Values own independence and autonomy.',
			'97. Is emotionally bland; has flattened affect.',
			'98. Is verbally fluent; can express ideas well.',
			'99. Is self-dramatizing; histrionic.',
			'100. Does not vary roles; relates to everyone in the same way'
		],
		sorts: []
	},
	"Ruth's History (California 100)": {
		statements: [
			'1. Is critical, skeptical, not easily impressed.',
			'2. Is a genuinely dependable and responsible person.',
			'3. Has a wide range of interests. (NB.: Superficiality or depth of interest is irrelevant here.)',
			'4. Is a talkative individual.',
			'5. Behaves in a giving way toward others. (N.B.: Regardless of the motivation involved.)',
			'6. Is fastidious. (NB.: Attentive to and concerned about accuracy and detail.)',
			'7. Favors conservative values in a variety of areas.',
			'8. Appears to have a high degree of intellectual capacity. (N.B.: Whether actualized or not. Originality is not necessarily assumed.)',
			'9. Is uncomfortable with uncertainty and complexities.',
			'10. Anxiety and tension find outlet in bodily symptoms. (N.B.: If placed high, implies bodily dysfunction; if placed low, implies absence of autonomic arousal.)',
			'11. Is protective of those close to him. (NB.: Placement of this item expresses behavior ranging from over-protection through appropriate nurturance to a laissez-faire, under-protective manner.)',
			'12. Tends to be self-defensive.',
			'13. Is thin-skinned; vulnerable to anything that can be construed as criticism or an interpersonal slight.',
			'14. Basically submissive.',
			'15. The "light touch" as compared to the "heavy touch."',
			'16. Is introspective. (N.B.: Introspectiveness per se does not imply insight.)',
			'17. Behaves in a sympathetic or considerate manner.',
			'18. Initiates humor.',
			'19. Seeks reassurance from others.',
			'20. Has a rapid personal tempo.',
			'21. Arouses nurturant feelings in others of both sexes.',
			'22. Feels a lack of personal meaning in life. (Uncharacteristic end means zest.)',
			'23. Extrapunitive; tends to transfer or project blame.',
			'24. Prides self on being "objective," rational. (Regardless of whether person is really objective or rational.)',
			'25. Tends toward overcontrol of needs and impulses; binds tensions excessively; delays gratification unnecessarily.',
			'26. Is productive; gets things done. (Regardless of speed.)',
			'27. Shows condescending behavior in relations with others.',
			'28. Tends to arouse liking and acceptance in people.',
			'29. Is turned to for advice and reassurance.',
			'30. Gives up and withdraws where possible in the face of frustra-tion and adversity.',
			'31. Is satisfied with physical appearance.',
			'32. Seems to be aware of the impression he/she makes on others.',
			'33. Is calm, relaxed in manner.',
			'34. Over-reactive to minor frustrations; irritable.',
			'35. Has warmth; is compassionate.',
			'36. Is negativistic; tends to undermine and obstruct or sabotage.',
			'37. Is guileful and deceitful, manipulative, opportunistic.',
			'38. Has hostility toward others. (NB.: Basic hostility is intended here; mode of expression is to be indicated by other items.)',
			'39. Thinks and associates to ideas in unusual ways; has unconven-tional thought processes. (Either pathological or creative.)',
			'40. Is vulnerable to real or fancied threat, generally fearful.',
			'41. Is moralistic. (NB.: Regardless of the particular nature of the moral code.)',
			'42. Reluctant to commit self to any definite course of action; tends to delay or avoid action. (Uncharacteristic end indicates quick to act.)',
			'43. Is facially and/or gesturally expressive.',
			'44. Evaluates the motivation of others in interpreting situations. (NB.: Accuracy of evaluation is not assumed. NB.: Again, extreme placement in one direction implies preoccupation with motivational interpretations; at the other extreme, the item implies a psychological obtuseness. S does not consider motivational factors.)',
			'45. Has a brittle ego-defense system; has a small reserve of inte-gration; would be disorganized and maladaptive when under stress or trauma.',
			'46. Engaged in personal fantasy and daydreams, fictional specula-tions.',
			'47. Tends to feel guilty. (NB.: Regardless of whether verbalized or not.)',
			'48. Aloof, keeps people at a distance; avoids close interpersonal relationships.',
			'49. Is basically distrustful of people in general; questions their motivations.',
			'50. Is unpredictable and changeable in behavior and attitudes.',
			'51. Genuinely values intellectual and cognitive matters. (N.B.: Ability or achievement are not implied here.)',
			'52. Behaves in an assertive fashion in interpersonal situations. (NB.: Item 14 reflects underlying submissiveness; this refers to overt behavior.)',
			'53. Tends toward undercontrol of needs and impulses; unable to delay gratification.',
			'54. Emphasizes being with others; gregarious.',
			'55. Is self-defeating.',
			'56. Responds to humor.',
			'57. Is an interesting, arresting person.',
			'58. Enjoys sensuous experiences(including touch, taste, smell, phys-ical contact).',
			'59. Is concerned with own body and the adequacy of its physiologi-cal functioning. (Body cathexis.)',
			'60. Has insight into own motives and behavior.',
			'61. Creates and exploits dependency in people. (N.B.: Regardless of the techniques employed, e.g., punitiveness, overindulgence. NB.: At the other end of the scale, item implies respecting and encouraging the independence and individuality of others.)',
			'62. Tends to be rebellious and nonconforming.',
			'63. Judges self and others in conventional terms like "popularity," "the correct thing to do," social pressures, etc.',
			'64. Is socially perceptive of a wide range of interpersonal cues.',
			'65. Characteristically pushes and tries to stretch limits; sees what he can get away with.',
			'66. Enjoys esthetic impressions; is esthetically reactive.',
			'67. Is self-indulgent.',
			'68. Is basically anxious.',
			'69. Is bothered by anything that can be construed as a demand. (NB.: No implication of the kind of subsequent response is intended here.)',
			'70. Behaves in an ethically consistent manner; is consistent with own personal standards.',
			'71. Has high aspiration level for self.',
			'72. Overconcerned with own adequacy as a person, either at con-scious or unconscious levels. (NB.: A clinical judgment is required here; number 74 reflects subjunctive satisfaction with self.)',
			'73. Tends to perceive many different contexts in sexual terms; eroticizes situations.',
			'74. Is consciously unaware of self-concern; feels satisfied with self.',
			'75. Has a clear-cut, internally consistent personality. (NB.: Amount of information available before sorting is not intended here.)',
			'76. Tends to project his own feelings and motivations onto others.',
			'77. Appears straightforward, forthright, candid in dealings with others.',
			'78. Feels cheated and victimized by life.',
			'79. Tends to ruminate and have persistent, preoccupying thoughts (either pathological or creative).',
			'80. Interested in members of the opposite sex. (NB.: At opposite end, item implies absence of such interest.)',
			'81. Is physically attractive, good-looking. (NB.: The cultural cri-terion is to be applied here.)',
			'82. Has fluctuating moods.',
			'83. Able to see to the heart of important problems.',
			'84. Is cheerful. (NB.: Extreme placement toward uncharacteristic end of continuum implies gloominess.)',
			'85. Is self-pitying (whiny).',
			'86. Handles anxiety and conflicts by repressive or dissociative ten-dencies.',
			'87. Interprets basically simple and clear-cut situations in compli-cated and particularizing ways.',
			'88. Is personally charming.',
			'89. Compares self to others. Is alert to real or fancied differences between self and other people.',
			'90. Is concerned with philosophical problems; e.g., religion, values, the meaning of life, etc.',
			'91. Is power-oriented; values power in self or others.',
			'92. Has social poise and presence; appears socially at ease.',
			'93. Behaves in a style and manner consistent with their gender. (NB.: Again, the cultural or subcultural conception is to be applied as a criterion.)',
			'94. Expresses hostile feelings directly.',
			'95. Tends to proffer advice.',
			'96. Values own independence and autonomy.',
			'97. Is emotionally bland; has flattened affect.',
			'98. Is verbally fluent; can express ideas well.',
			'99. Is self-dramatizing; histrionic.',
			'100. Does not vary roles; relates to everyone in the same way'
		],
		sorts: [
			{
				extras: {
					qSortId: '6QPSauOJy6s60cYcwiYJ',
					qSetId: 'california_100',
					note: 'Annealed',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-11-27T00:00:00.000Z',
				subject: 'ideal',
				statementPositions: [
					4, 8, 6, 4, 8, 5, 2, 7, 3, 4, 3, 1, 1, 3, 4, 6, 8, 6, 4, 4, 4, 1, 1, 5, 3, 6, 1, 7, 6, 0,
					5, 6, 6, 1, 8, 0, 0, 1, 5, 2, 4, 2, 5, 4, 2, 4, 2, 2, 0, 3, 7, 4, 3, 5, 2, 6, 7, 5, 3, 7,
					0, 3, 3, 6, 3, 5, 3, 2, 3, 8, 6, 2, 3, 7, 7, 3, 7, 2, 5, 4, 5, 4, 6, 5, 1, 3, 4, 5, 3, 5,
					2, 5, 4, 4, 4, 5, 4, 6, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'F2LGGO313Yr6fTCGR28b',
					qSetId: 'california_100',
					note: 'Ideal',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-06-23T23:53:07.000Z',
				subject: 'ideal',
				statementPositions: [
					3, 7, 7, 4, 6, 4, 3, 4, 3, 3, 3, 2, 2, 3, 4, 6, 8, 6, 5, 4, 5, 0, 1, 3, 3, 5, 1, 5, 5, 1,
					6, 6, 4, 2, 8, 0, 0, 4, 5, 2, 3, 1, 6, 4, 2, 4, 1, 2, 2, 4, 5, 4, 4, 7, 1, 6, 5, 8, 3, 8,
					0, 4, 0, 7, 4, 6, 4, 3, 2, 8, 5, 2, 3, 6, 5, 2, 6, 1, 4, 6, 5, 5, 7, 5, 2, 2, 3, 5, 1, 5,
					3, 7, 4, 6, 4, 5, 3, 7, 3, 7
				]
			},
			{
				extras: {
					qSortId: 'GqLmzoMOuaQ22JLRKhmU',
					qSetId: 'california_100',
					note: '',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-12-12T05:19:23.000Z',
				subject: 'ideal',
				statementPositions: [
					5, 8, 4, 4, 8, 4, 3, 5, 3, 4, 4, 2, 1, 3, 4, 7, 8, 5, 5, 4, 5, 1, 0, 4, 3, 5, 2, 6, 5, 1,
					6, 6, 5, 2, 7, 0, 0, 3, 5, 2, 3, 2, 4, 4, 2, 4, 3, 1, 0, 2, 6, 5, 3, 6, 1, 5, 7, 6, 3, 8,
					0, 4, 3, 6, 4, 5, 3, 3, 3, 8, 7, 1, 2, 7, 7, 2, 7, 1, 5, 4, 4, 4, 6, 6, 1, 3, 3, 6, 2, 5,
					2, 6, 4, 5, 5, 4, 3, 7, 2, 6
				]
			},
			{
				extras: {
					qSortId: 'VBVBkbHgxZQhO7uRpw5N',
					qSetId: 'california_100',
					note: 'Christmas Eve With Family',
					sortedBy: 'Ryan Marks',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-12-25T03:40:06.000Z',
				subject: 'ideal',
				statementPositions: [
					4, 8, 6, 5, 8, 4, 3, 5, 3, 4, 4, 3, 1, 3, 5, 6, 8, 6, 5, 4, 4, 1, 1, 4, 3, 6, 2, 7, 6, 1,
					5, 7, 5, 1, 8, 0, 0, 1, 5, 1, 3, 3, 4, 4, 2, 4, 2, 2, 2, 4, 5, 5, 2, 5, 2, 6, 7, 5, 3, 7,
					0, 4, 1, 7, 3, 5, 3, 3, 2, 8, 6, 2, 3, 6, 7, 3, 7, 0, 5, 4, 5, 4, 6, 7, 3, 2, 3, 6, 0, 4,
					2, 6, 4, 4, 5, 4, 3, 6, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'd0bXcLaQOANJ3rFyqaMN',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-03-02T17:34:07.000Z',
				subject: 'ideal',
				statementPositions: [
					3, 8, 5, 4, 8, 4, 2, 5, 3, 4, 5, 2, 3, 3, 4, 5, 8, 6, 5, 4, 4, 0, 1, 4, 3, 6, 2, 5, 6, 1,
					6, 6, 5, 2, 7, 0, 0, 4, 5, 2, 4, 3, 4, 4, 1, 4, 1, 1, 1, 3, 6, 5, 3, 7, 2, 6, 6, 6, 3, 8,
					0, 4, 1, 6, 3, 5, 3, 3, 2, 8, 5, 0, 3, 7, 7, 3, 7, 2, 5, 4, 5, 4, 6, 6, 2, 2, 3, 7, 1, 5,
					2, 7, 4, 4, 5, 4, 3, 7, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'kSLzyTpDNhRhZJwfOKYQ',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2021-06-03T03:06:58.000Z',
				subject: 'ideal',
				statementPositions: [
					3, 8, 5, 5, 8, 4, 2, 4, 2, 3, 4, 2, 1, 4, 5, 6, 7, 6, 5, 4, 4, 1, 1, 2, 3, 5, 2, 7, 4, 0,
					6, 6, 4, 2, 8, 0, 0, 4, 5, 2, 5, 2, 5, 4, 2, 4, 1, 1, 1, 3, 7, 5, 3, 7, 2, 6, 7, 6, 3, 8,
					0, 4, 2, 6, 3, 5, 4, 3, 3, 8, 5, 1, 2, 7, 4, 3, 7, 0, 5, 5, 5, 4, 6, 7, 1, 3, 3, 6, 3, 6,
					3, 5, 4, 5, 4, 4, 3, 6, 3, 6
				]
			},
			{
				extras: {
					qSortId: 'n5hLfm6aQqaWXtMifm3C',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan Marks',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-02-03T20:29:25.000Z',
				subject: 'ideal',
				statementPositions: [
					4, 8, 5, 4, 8, 4, 3, 5, 3, 3, 4, 3, 1, 3, 5, 6, 8, 6, 5, 4, 4, 0, 2, 4, 2, 6, 2, 6, 5, 1,
					6, 6, 5, 1, 8, 0, 0, 4, 5, 2, 4, 3, 5, 4, 1, 4, 2, 0, 1, 2, 5, 4, 3, 6, 2, 6, 7, 5, 3, 7,
					0, 4, 2, 6, 3, 6, 3, 3, 3, 8, 5, 3, 3, 7, 7, 2, 6, 1, 4, 5, 4, 4, 7, 7, 1, 2, 3, 7, 1, 4,
					2, 7, 5, 5, 5, 4, 3, 6, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'tfGwU9STKrV9frKvehVq',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2022-01-03T04:35:55.000Z',
				subject: 'ideal',
				statementPositions: [
					2, 7, 5, 4, 8, 4, 1, 5, 2, 3, 6, 2, 3, 3, 5, 6, 8, 7, 4, 4, 4, 0, 1, 2, 3, 5, 2, 7, 5, 2,
					6, 6, 4, 3, 8, 0, 0, 3, 5, 3, 5, 4, 5, 4, 2, 4, 1, 1, 1, 4, 5, 5, 3, 6, 1, 6, 7, 7, 3, 7,
					0, 5, 1, 6, 3, 5, 4, 3, 2, 8, 4, 1, 3, 8, 5, 3, 6, 0, 4, 5, 6, 4, 7, 5, 2, 2, 3, 6, 2, 5,
					2, 6, 3, 4, 4, 4, 3, 7, 4, 6
				]
			},
			{
				extras: {
					qSortId: 'uFLc8A9yIsSstCknd9vI',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-05-21T21:47:44.000Z',
				subject: 'ideal',
				statementPositions: [
					3, 8, 5, 5, 7, 4, 1, 5, 3, 4, 4, 2, 1, 4, 5, 5, 8, 6, 5, 4, 4, 1, 1, 3, 3, 6, 2, 6, 5, 1,
					6, 6, 4, 1, 8, 0, 0, 4, 5, 2, 3, 3, 5, 4, 2, 4, 2, 0, 2, 4, 6, 4, 3, 7, 1, 5, 7, 5, 3, 7,
					0, 4, 2, 6, 3, 5, 3, 2, 2, 8, 5, 0, 3, 8, 7, 3, 7, 2, 4, 4, 5, 3, 6, 7, 1, 3, 3, 7, 2, 5,
					4, 6, 4, 6, 5, 4, 3, 6, 2, 6
				]
			},
			{
				extras: {
					qSortId: 'xZYnUqI4iVVD4PWQjQJr',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-11-24T00:22:57.000Z',
				subject: 'ideal',
				statementPositions: [
					3, 7, 5, 4, 7, 5, 2, 5, 3, 4, 5, 2, 2, 3, 5, 7, 8, 6, 4, 4, 4, 1, 2, 3, 3, 5, 2, 5, 5, 1,
					6, 6, 4, 1, 8, 0, 0, 4, 7, 2, 4, 3, 6, 5, 0, 3, 2, 0, 1, 4, 6, 4, 3, 7, 1, 6, 7, 6, 3, 8,
					0, 4, 1, 6, 2, 5, 4, 3, 2, 8, 5, 1, 3, 8, 6, 3, 7, 1, 4, 5, 5, 4, 7, 5, 2, 3, 3, 6, 2, 6,
					3, 5, 4, 4, 4, 4, 3, 6, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'BkwIGpIaVFGf1ft98rmg',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2022-01-03T04:15:39.000Z',
				subject: 'self',
				statementPositions: [
					2, 7, 6, 5, 7, 3, 1, 5, 3, 5, 6, 2, 3, 4, 2, 6, 6, 8, 4, 4, 4, 2, 1, 1, 3, 5, 2, 7, 7, 1,
					3, 5, 4, 3, 8, 0, 1, 0, 5, 5, 4, 5, 6, 5, 2, 3, 0, 2, 1, 2, 8, 3, 3, 5, 1, 8, 5, 8, 4, 6,
					0, 4, 2, 4, 2, 6, 4, 5, 3, 7, 4, 3, 3, 5, 5, 4, 7, 0, 6, 6, 4, 6, 6, 5, 1, 3, 4, 5, 3, 7,
					2, 3, 3, 4, 4, 4, 2, 7, 4, 6
				]
			},
			{
				extras: {
					qSortId: 'GmifXpAUBREWRHxiL5lw',
					qSetId: 'california_100',
					note: '',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-12-12T04:07:05.000Z',
				subject: 'self',
				statementPositions: [
					5, 6, 6, 5, 8, 6, 1, 8, 5, 4, 4, 4, 3, 3, 4, 5, 7, 8, 4, 5, 4, 2, 3, 6, 2, 5, 3, 5, 5, 3,
					5, 4, 5, 2, 7, 0, 0, 1, 7, 1, 3, 4, 6, 3, 2, 3, 1, 4, 0, 3, 8, 2, 3, 4, 1, 7, 7, 7, 2, 4,
					0, 3, 1, 3, 3, 4, 4, 2, 1, 5, 6, 4, 2, 6, 5, 3, 6, 0, 5, 6, 4, 5, 6, 7, 1, 5, 4, 3, 2, 6,
					2, 3, 5, 2, 4, 7, 4, 8, 2, 6
				]
			},
			{
				extras: {
					qSortId: 'JlXv8xo9kinBp8sVe3wW',
					qSetId: 'california_100',
					note: 'self',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-06-23T23:33:52.000Z',
				subject: 'self',
				statementPositions: [
					3, 7, 6, 6, 7, 4, 1, 6, 3, 5, 3, 3, 5, 4, 2, 6, 8, 8, 5, 4, 3, 1, 1, 3, 2, 5, 0, 6, 7, 3,
					6, 5, 4, 2, 7, 0, 0, 4, 5, 2, 4, 3, 6, 3, 3, 3, 4, 2, 1, 2, 7, 3, 4, 8, 1, 7, 5, 8, 2, 5,
					0, 3, 2, 4, 2, 5, 5, 3, 4, 8, 7, 4, 4, 5, 5, 2, 6, 0, 5, 5, 4, 6, 6, 6, 1, 5, 4, 4, 1, 6,
					2, 4, 5, 3, 4, 4, 2, 7, 1, 3
				]
			},
			{
				extras: {
					qSortId: 'Kim4nNgDZmTcTHuNj5lA',
					qSetId: 'california_100',
					note: 'No annealing.',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-11-27T00:00:00.000Z',
				subject: 'self',
				statementPositions: [
					6, 5, 5, 4, 7, 6, 2, 8, 6, 6, 3, 4, 4, 2, 3, 3, 6, 8, 3, 5, 3, 2, 3, 8, 6, 5, 3, 6, 3, 4,
					6, 2, 7, 4, 4, 0, 0, 0, 8, 2, 4, 6, 6, 2, 4, 2, 2, 3, 1, 2, 8, 1, 4, 4, 3, 7, 5, 7, 2, 4,
					0, 4, 1, 1, 3, 5, 5, 4, 1, 7, 4, 3, 1, 6, 4, 3, 5, 0, 5, 6, 5, 5, 5, 7, 3, 5, 3, 4, 2, 5,
					1, 2, 5, 4, 5, 7, 4, 7, 1, 3
				]
			},
			{
				extras: {
					qSortId: 'MahBqjfFFiR1a6G9rVdI',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2021-06-03T02:55:03.000Z',
				subject: 'self',
				statementPositions: [
					4, 6, 6, 5, 7, 5, 1, 5, 4, 5, 4, 3, 3, 5, 4, 7, 6, 8, 4, 4, 4, 3, 1, 0, 2, 6, 2, 6, 5, 2,
					6, 5, 4, 2, 8, 0, 0, 2, 5, 3, 4, 2, 7, 3, 2, 5, 3, 1, 1, 2, 8, 3, 4, 7, 1, 8, 6, 8, 1, 5,
					0, 4, 3, 5, 3, 5, 4, 3, 3, 7, 5, 3, 3, 5, 7, 3, 7, 1, 5, 6, 4, 6, 6, 6, 1, 3, 2, 4, 2, 6,
					0, 4, 4, 3, 4, 4, 2, 7, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'NsaEmZZq8sX6hu4o8mas',
					qSetId: 'california_100',
					note: 'Working',
					sortedBy: 'Ryan Marks',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-02-03T20:13:53.000Z',
				subject: 'self',
				statementPositions: [
					5, 7, 6, 3, 8, 6, 1, 7, 3, 6, 4, 3, 2, 3, 3, 5, 8, 8, 5, 4, 2, 1, 3, 5, 4, 7, 4, 4, 6, 2,
					4, 4, 5, 4, 7, 0, 0, 2, 8, 2, 6, 3, 6, 4, 2, 3, 1, 3, 1, 3, 7, 3, 4, 5, 1, 7, 5, 7, 2, 4,
					0, 3, 2, 4, 2, 6, 4, 3, 1, 5, 6, 4, 5, 7, 5, 3, 5, 0, 5, 6, 4, 6, 5, 6, 1, 5, 2, 4, 0, 5,
					2, 3, 5, 2, 6, 4, 3, 8, 1, 4
				]
			},
			{
				extras: {
					qSortId: 'UBuvtww961dFYaK8Ps1G',
					qSetId: 'california_100',
					note: 'rushed',
					sortedBy: 'Ryan Marks',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-03-12T19:11:28.000Z',
				subject: 'self',
				statementPositions: [
					4, 6, 6, 4, 8, 5, 3, 7, 3, 5, 4, 4, 1, 3, 3, 5, 8, 8, 6, 4, 3, 2, 1, 4, 3, 6, 1, 5, 5, 2,
					4, 4, 5, 3, 7, 0, 0, 2, 8, 2, 4, 3, 6, 3, 1, 4, 2, 1, 1, 4, 7, 2, 4, 6, 2, 6, 5, 7, 2, 5,
					0, 3, 2, 4, 2, 5, 5, 3, 0, 7, 5, 4, 3, 7, 7, 3, 6, 0, 6, 6, 4, 5, 5, 6, 1, 2, 4, 4, 1, 7,
					3, 3, 5, 3, 6, 4, 5, 8, 2, 5
				]
			},
			{
				extras: {
					qSortId: 'cu9ixGtWbUn6HUgX31iD',
					qSetId: 'california_100',
					note: 'Feeling slow in the library',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-03-02T16:59:45.000Z',
				subject: 'self',
				statementPositions: [
					3, 7, 7, 5, 8, 5, 1, 7, 3, 6, 3, 3, 2, 3, 3, 6, 6, 8, 5, 4, 3, 1, 3, 4, 4, 7, 2, 5, 6, 2,
					5, 4, 5, 2, 8, 0, 0, 3, 6, 1, 5, 3, 6, 3, 1, 4, 2, 1, 1, 3, 8, 3, 5, 5, 2, 7, 5, 7, 2, 5,
					0, 4, 1, 4, 2, 6, 4, 4, 2, 7, 5, 4, 4, 6, 7, 4, 4, 0, 6, 6, 4, 5, 5, 6, 1, 3, 3, 4, 0, 6,
					2, 4, 5, 2, 5, 4, 3, 8, 2, 4
				]
			},
			{
				extras: {
					qSortId: 'ju8gLHy7FZa2tIo5YItE',
					qSetId: 'california_100',
					note: 'Self Ryan',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-05-21T21:32:54.000Z',
				subject: 'self',
				statementPositions: [
					4, 7, 6, 5, 7, 5, 1, 6, 4, 6, 3, 4, 4, 3, 4, 7, 7, 8, 4, 3, 3, 2, 1, 3, 2, 5, 1, 5, 5, 2,
					6, 6, 6, 2, 8, 0, 0, 1, 4, 2, 4, 2, 6, 3, 2, 4, 2, 0, 1, 3, 8, 3, 4, 7, 3, 7, 7, 8, 2, 6,
					0, 3, 2, 4, 2, 5, 4, 4, 3, 7, 6, 5, 4, 5, 5, 3, 5, 0, 5, 6, 4, 5, 5, 5, 1, 4, 3, 5, 1, 6,
					2, 3, 6, 3, 5, 4, 3, 8, 1, 4
				]
			},
			{
				extras: {
					qSortId: 'nPZnnSmGmMCre3dhywtR',
					qSetId: 'california_100',
					note: '',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2022-11-28T01:54:27.000Z',
				subject: 'self',
				statementPositions: [
					1, 6, 7, 5, 6, 4, 0, 7, 1, 5, 6, 3, 2, 2, 3, 7, 8, 8, 4, 5, 5, 0, 1, 1, 2, 6, 2, 7, 6, 2,
					5, 4, 4, 3, 7, 0, 0, 3, 5, 4, 4, 4, 6, 3, 1, 4, 3, 1, 1, 3, 5, 2, 4, 6, 2, 8, 7, 8, 4, 5,
					0, 4, 1, 3, 3, 5, 4, 4, 6, 7, 5, 3, 5, 7, 4, 3, 6, 2, 5, 3, 5, 6, 6, 8, 2, 3, 3, 5, 2, 5,
					2, 3, 4, 3, 5, 4, 2, 6, 4, 4
				]
			},
			{
				extras: {
					qSortId: 'ndcjOsFjt6gru2km5xsW',
					qSetId: 'california_100',
					note: 'Christmas Eve With Family',
					sortedBy: 'Ryan Marks',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2019-12-25T03:25:36.000Z',
				subject: 'self',
				statementPositions: [
					5, 5, 7, 4, 8, 6, 2, 8, 4, 4, 4, 4, 1, 2, 3, 5, 6, 8, 4, 5, 3, 2, 3, 6, 2, 6, 3, 6, 6, 3,
					5, 4, 5, 0, 7, 0, 0, 2, 8, 2, 2, 3, 7, 3, 2, 4, 1, 3, 1, 4, 7, 2, 4, 5, 1, 7, 5, 7, 2, 5,
					0, 4, 3, 3, 2, 5, 5, 3, 1, 6, 6, 4, 3, 6, 5, 3, 7, 0, 5, 5, 4, 4, 4, 7, 2, 5, 3, 4, 1, 6,
					1, 3, 6, 3, 5, 6, 4, 8, 1, 4
				]
			},
			{
				extras: {
					qSortId: 'qeVCsGr2vaCbeVkElUDE',
					qSetId: 'california_100',
					note: 'self',
					sortedBy: 'Ryan',
					userId: 'q692OgdJRtViWMGwD4J27irVIcw2'
				},
				sortedOn: '2020-11-24T00:02:33.000Z',
				subject: 'self',
				statementPositions: [
					3, 6, 6, 6, 8, 4, 1, 6, 5, 5, 4, 3, 3, 3, 4, 5, 8, 8, 4, 4, 3, 0, 2, 1, 3, 5, 4, 5, 6, 1,
					6, 5, 4, 2, 7, 0, 0, 2, 8, 3, 4, 4, 7, 5, 2, 3, 3, 0, 2, 3, 7, 3, 4, 7, 1, 7, 6, 7, 1, 6,
					0, 4, 1, 4, 2, 4, 4, 3, 2, 7, 5, 3, 2, 5, 5, 2, 7, 1, 5, 6, 5, 5, 6, 5, 2, 2, 4, 5, 3, 6,
					2, 4, 6, 3, 4, 4, 3, 8, 1, 5
				]
			},
			{
				extras: {},
				sortedOn: '2023-06-16T17:18:39.016Z',
				subject: 'self',
				statementPositions: [
					2, 10, 10, 9, 10, 3, 0, 10, 3, 8, 8, 2, 6, 4, 5, 8, 11, 12, 3, 7, 7, 2, 1, 0, 6, 9, 1, 9,
					10, 5, 5, 7, 3, 6, 11, 0, 0, 3, 8, 6, 4, 5, 10, 4, 5, 6, 2, 1, 2, 5, 11, 1, 4, 11, 1, 12,
					10, 11, 3, 9, 0, 7, 2, 7, 3, 7, 8, 6, 8, 11, 4, 6, 7, 7, 5, 3, 9, 1, 9, 10, 7, 9, 9, 9, 2,
					5, 4, 7, 1, 8, 1, 4, 6, 3, 5, 5, 2, 11, 2, 4
				]
			},
			{
				extras: {},
				sortedOn: '2023-06-16T17:42:24.365Z',
				subject: 'ideal',
				statementPositions: [
					2, 13, 11, 7, 12, 6, 0, 8, 4, 6, 10, 5, 3, 5, 8, 10, 12, 13, 7, 7, 8, 0, 2, 0, 7, 9, 4,
					12, 9, 3, 11, 11, 8, 3, 13, 0, 0, 6, 9, 5, 6, 4, 10, 4, 3, 6, 3, 2, 5, 4, 10, 9, 5, 12, 3,
					13, 11, 10, 4, 11, 0, 8, 2, 11, 4, 9, 6, 4, 5, 13, 6, 3, 7, 12, 7, 2, 11, 2, 7, 10, 8, 7,
					12, 12, 3, 3, 4, 11, 2, 10, 2, 11, 7, 8, 8, 6, 3, 11, 3, 7
				]
			}
		]
	}
};
