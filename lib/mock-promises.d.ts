declare module "@mindbox/mock-promises"
{
	function getOriginalPromise(): any;
	function getMockPromise(promise: any): any;
	function tick(count: number): void;
	function tickAllTheWay(): void;

	function install(promise: any): void;
	function uninstall(): void;
	function reset(): void;

	export {
		getOriginalPromise,
		getMockPromise,
		tick,
		tickAllTheWay,

		install,
		uninstall,

		reset
	} 
}
