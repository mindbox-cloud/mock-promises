declare module "mock-promises"
{
	function getOriginalPromise(): any;
	function getMockPromise(promise: any): any;
	function tickAllTheWay(): void;

	function install(promise: any): void;
	function uninstall(): void;
	function reset(): void;

	export {
		getOriginalPromise,
		getMockPromise,
		tickAllTheWay,

		install,
		uninstall,

		reset,
	} 
}
