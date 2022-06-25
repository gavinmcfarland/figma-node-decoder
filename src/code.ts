import plugma from "plugma";
import { genWidgetStr } from "./widgetGeneration";
import { genPluginStr } from "./pluginGeneration";
import { encodeAsync, decodeAsync } from "../package";
import {
	getClientStorageAsync,
	setClientStorageAsync,
	updateClientStorageAsync,
	setPluginData,
	getPluginData,
	nodeToObject,
	ungroup,
} from "@fignite/helpers";
import { groupBy } from "lodash";

// TODO: Different string output for running code and showing in UI

console.clear();

// console.log("topInstance", getTopInstance(figma.currentPage.selection[0]))
// console.log("parentIstance", getParentInstance(figma.currentPage.selection[0]))
// console.log("location", getNodeLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("counterPart1", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("backingNode", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))

plugma((plugin) => {
	var origSel = figma.currentPage.selection;
	var outputPlatform = "";

	var cachedPlugin;
	var cachedWidget;

	var successful;

	var uiDimensions = { width: 280, height: 420 };

	plugin.on("code-rendered", () => {
		successful = true;
	});

	plugin.on("code-copied", () => {
		figma.notify("Copied to clipboard");
	});

	plugin.on("set-platform", (msg) => {
		var platform = msg.platform;
		outputPlatform = platform;
		const handle = figma.notify("Generating code...", {
			timeout: 99999999999,
		});

		setClientStorageAsync("platform", platform);

		if (platform === "plugin") {
			if (cachedPlugin) {
				handle.cancel();
				figma.ui.postMessage({
					type: "string-received",
					value:
						"async function main() {\n\n" +
						cachedPlugin +
						"\n}\n\nmain()",
					platform,
				});
			} else {
				genPluginStr(origSel, {
					wrapInFunction: true,
					includeObject: true,
				})
					.then(async (string) => {
						handle.cancel();

						// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({
							type: "string-received",
							value: string.join(""),
							platform,
						});

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out");
								figma.closePlugin();
							}
						}, 8000);
					})
					.catch((error) => {
						handle.cancel();
						if (error.message === "cannot convert to object") {
							figma.closePlugin(
								`Could not generate ${platform} code for selection`
							);
						} else {
							figma.closePlugin(`${error}`);
						}
					});
			}
		}

		if (platform === "widget") {
			if (cachedWidget) {
				handle.cancel();
				figma.ui.postMessage({
					type: "string-received",
					value: cachedWidget,
					platform,
				});
			} else {
				genWidgetStr(origSel)
					.then((string) => {
						handle.cancel();

						// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({
							type: "string-received",
							value: string,
							platform,
						});

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out");
								figma.closePlugin();
							}
						}, 8000);
					})
					.catch((error) => {
						handle.cancel();
						if (error.message === "cannot convert to object") {
							figma.closePlugin(
								`Could not generate ${platform} code for selection`
							);
						} else {
							figma.closePlugin(`${error}`);
						}
					});
			}
		}
	});

	async function runPlugin() {
		const handle = figma.notify("Generating code...", {
			timeout: 99999999999,
		});

		let platform = await updateClientStorageAsync(
			"platform",
			(platform) => {
				platform = platform || "plugin";
				outputPlatform = platform;
				return platform;
			}
		);

		if (origSel.length > 0) {
			// If something is selected create new string and save to client storage
			cachedPlugin = await (
				await genPluginStr(origSel, { platform: "plugin" })
			).join("");
			cachedWidget = await genWidgetStr(origSel);

			setClientStorageAsync(`cachedPlugin`, cachedPlugin);
			setClientStorageAsync(`cachedWidget`, cachedWidget);
		} else {
			// If no selection then get the cached version
			cachedPlugin = await getClientStorageAsync(`cachedPlugin`);
			cachedWidget = await getClientStorageAsync(`cachedWidget`);
		}

		// restore previous size
		let uiSize = await getClientStorageAsync("uiSize");

		if (!uiSize) {
			setClientStorageAsync("uiSize", uiDimensions);
			uiSize = uiDimensions;
		}

		// if (platform === "plugin") {
		// 	cachedPlugin = encodedString;
		// }

		// if (platform === "widget") {
		// 	cachedWidget = encodedString;
		// }

		handle.cancel();

		figma.showUI(__uiFiles__.main, uiSize);

		console.log(platform);
		if (platform === "plugin") {
			figma.ui.postMessage({
				type: "string-received",
				value:
					"async function main() {\n\n" +
					cachedPlugin +
					"\n}\n\nmain()",
				platform,
			});
		}

		if (platform === "widget") {
			figma.ui.postMessage({
				type: "string-received",
				value: cachedWidget,
				platform,
			});
		}

		setTimeout(function () {
			if (!successful) {
				figma.notify("Plugin timed out");
				figma.closePlugin();
			}
		}, 8000);
	}

	runPlugin();

	plugin.on("run-code", () => {
		if (outputPlatform === "plugin") {
			// getClientStorageAsync("encodedString").then((string) => {

			let string = cachedPlugin;

			string =
				`// Wrap in function
				async function createNodes() {

					// Create temporary page to pass nodes to function
					let oldPage = figma.currentPage
					let newPage = figma.createPage()
					figma.currentPage = newPage
					` +
				string +
				`// Pass children to function
					let nodes = figma.currentPage.children
					figma.currentPage = oldPage

					for (let i = 0; i < nodes.length; i++) {
						let node = nodes[i]
						figma.currentPage.appendChild(node)
					}

					newPage.remove()
					figma.currentPage = oldPage

					return nodes

				}

				createNodes()`;

			decodeAsync(string).then(({ nodes }) => {
				function positionInCenter(node) {
					// Position newly created table in center of viewport
					node.x = figma.viewport.center.x - node.width / 2;
					node.y = figma.viewport.center.y - node.height / 2;
				}

				let group = figma.group(nodes, figma.currentPage);

				positionInCenter(group);

				nodes = ungroup(group, figma.currentPage);
				figma.currentPage.selection = nodes;
				// figma.viewport.scrollAndZoomIntoView(nodes)
				figma.notify("Code run");
			});

			// });
		}
	});

	plugin.on("resize", (msg) => {
		figma.ui.resize(msg.size.width, msg.size.height);
		figma.clientStorage.setAsync("uiSize", msg.size).catch((err) => {}); // save size
	});
});

// async function encodeAsync(array) {

// 	// return nodeToObject(node)

// 	return await genPluginStr(array)

// }

// async function decodeAsync(string) {
// 	return eval(string)
// }

// if (figma.command === "encode") {
// 	var objects = []

// 	for (var i = 0; i < figma.currentPage.selection.length; i++) {
// 		var node = figma.currentPage.selection[i]
// 		var object = nodeToObject(node, false)
// 		console.log(object)
// 		objects.push(object)
// 	}

// 	// Can use either nodes directly, or JSON representation of nodes. If using JSON, it must include id's and type's of all parent relations.
// 	encodeAsync(objects).then((string) => {
// 		console.log(string)
// 		setPluginData(figma.root, "selectionAsString", string)
// 		figma.closePlugin("Selection stored as string")
// 	})
// }

// if (figma.command === "decode") {
// 	var selectionAsString = getPluginData(figma.root, "selectionAsString")
// 	// console.log(selectionAsString)
// 	decodeAsync(selectionAsString).then(() => {
// 		figma.closePlugin("String converted to node")
// 	})
// }
