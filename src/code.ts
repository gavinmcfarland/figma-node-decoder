import plugma from 'plugma'
import { genWidgetStr } from './widgetGeneration'
import { genPluginStr } from './pluginGeneration'
import { encodeAsync, decodeAsync } from '../package'
import { getClientStorageAsync, setClientStorageAsync, updateClientStorageAsync, setPluginData, getPluginData, nodeToObject } from '@fignite/helpers'

console.clear()

// console.log("topInstance", getTopInstance(figma.currentPage.selection[0]))
// console.log("parentIstance", getParentInstance(figma.currentPage.selection[0]))
// console.log("location", getNodeLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("counterPart1", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("backingNode", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))

if (figma.command === "generateCode") {
	plugma((plugin) => {

		var origSel = figma.currentPage.selection
		var outputPlatform = ""

		var cachedPlugin;
		var cachedWidget;

		var successful;

		var uiDimensions = { width: 280, height: 420 }

		plugin.on('code-rendered', () => {
			successful = true
		})

		plugin.on('code-copied', () => {
			figma.notify("Copied to clipboard")
		})

		plugin.on('set-platform', (msg) => {
			var platform = msg.platform
			outputPlatform = platform
			const handle = figma.notify("Generating code...", { timeout: 99999999999 })

			if (platform === "plugin") {
				if (cachedPlugin) {
					handle.cancel()
					figma.ui.postMessage({ type: 'string-received', value: cachedPlugin, platform })
				}
				else {
					genPluginStr(origSel).then((string) => {

						handle.cancel()

						// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)

						setClientStorageAsync("platform", platform)

					}).catch((error) => {
						handle.cancel()
						if (error.message === "cannot convert to object") {
							figma.closePlugin(`Could not generate ${platform} code for selection`)
						}
						else {
							figma.closePlugin(`${error}`)
						}
					})
				}

			}

			if (platform === "widget") {
				if (cachedWidget) {
					handle.cancel()
					figma.ui.postMessage({ type: 'string-received', value: cachedWidget, platform })
				}
				else {
					genWidgetStr(origSel).then((string) => {
						handle.cancel()

						// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)

						setClientStorageAsync("platform", platform)
					}).catch((error) => {
						handle.cancel()
						if (error.message === "cannot convert to object") {
							figma.closePlugin(`Could not generate ${platform} code for selection`)
						}
						else {
							figma.closePlugin(`${error}`)
						}
					})
				}

			}


		})

		const handle = figma.notify("Generating code...", { timeout: 99999999999 })

		updateClientStorageAsync("platform", (platform) => {
			platform = platform || "plugin"
			return platform
		}).then(() => {
			if (origSel.length > 0) {

				// restore previous size
				figma.clientStorage.getAsync('uiSize').then(size => {
					// if (size) figma.ui.resize(size.w, size.h);

					if (!size) {
						setClientStorageAsync("uiSize", uiDimensions)
						size = uiDimensions
					}

				getClientStorageAsync("platform").then((platform) => {

					outputPlatform = platform

					if (platform === "plugin") {
						genPluginStr(origSel).then((string) => {
							// console.log("returned", string)
							cachedPlugin = string
							handle.cancel()

							figma.showUI(__uiFiles__.main, size);

							figma.ui.postMessage({ type: 'string-received', value: string, platform })

							setTimeout(function () {
								if (!successful) {
									figma.notify("Plugin timed out")
									figma.closePlugin()
								}
							}, 8000)

						}).catch((error) => {
							handle.cancel()
							if (error.message === "cannot convert to object") {
								figma.closePlugin(`Could not generate ${platform} code for selection`)
							}
							else {
								figma.closePlugin(`${error}`)
							}
						})
					}

					if (platform === "widget") {
						genWidgetStr(origSel).then((string) => {
							cachedWidget = string
							handle.cancel()

							figma.showUI(__uiFiles__.main, size);

							figma.ui.postMessage({ type: 'string-received', value: string, platform })

							setTimeout(function () {
								if (!successful) {
									figma.notify("Plugin timed out")
									figma.closePlugin()
								}
							}, 8000)
						}).catch((error) => {
							handle.cancel()

							if (error.message === "cannot convert to object") {
								figma.closePlugin(`Could not generate ${platform} code for selection`)
							}
							else {
								figma.closePlugin(`${error}`)
							}

						})
					}
				})

				}).catch(err => { });


			}
			else {
				handle.cancel()
				figma.closePlugin("Select nodes to decode")
			}
		})


		plugin.on('run-code', () => {

			if (outputPlatform === "plugin") {
				// Can use either nodes directly, or JSON representation of nodes. If using JSON, it must include id's and type's of all parent relations.
				encodeAsync(origSel).then((string) => {
					decodeAsync(string).then(() => {
						figma.notify("Code run")
					})
				})
			}

		})

		plugin.on('resize', (msg) => {
			figma.ui.resize(msg.size.width, msg.size.height);
			figma.clientStorage.setAsync('uiSize', msg.size).catch(err => { });// save size
		})

	})
}

// async function encodeAsync(array) {

// 	// return nodeToObject(node)

// 	return await genPluginStr(array)

// }

// async function decodeAsync(string) {
// 	return eval(string)
// }

if (figma.command === "encode") {
	var objects = []

	for (var i = 0; i < figma.currentPage.selection.length; i++) {
		var node = figma.currentPage.selection[i]
		var object = nodeToObject(node, false)
		console.log(object)
		objects.push(object)
	}


	// Can use either nodes directly, or JSON representation of nodes. If using JSON, it must include id's and type's of all parent relations.
	encodeAsync(objects).then((string) => {
		console.log(string)
		setPluginData(figma.root, "selectionAsString", string)
		figma.closePlugin("Selection stored as string")
	})
}


if (figma.command === "decode") {
	var selectionAsString = getPluginData(figma.root, "selectionAsString")
	// console.log(selectionAsString)
	decodeAsync(selectionAsString).then(() => {
		figma.closePlugin("String converted to node")
	})
}






