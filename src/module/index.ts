// While many common classes are in the global scope such as `Actor` or `Item`, it seems Foundry has begun moving away from this.
// Notably the `DataModel`, `DataField`, `ApplicationV2`, and other similar class is only accessible through some path.
//
// `import =` is an obscure syntax from the CommonJS era.
// The pivotal part about it here is that it's effectively equivalent to:
// `var DataModel = foundry.abstract.DataModel`.
// But it also lets you write things like `DataModel.Any` that refers to the `DataModel` namespace.
// import DataModel = foundry.abstract.DataModel;



Hooks.on("init", () => {
  console.log("init");


});