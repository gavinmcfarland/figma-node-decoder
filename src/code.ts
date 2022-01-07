import plugma from 'plugma'
import { genWidgetStr } from './widgetGeneration'
import { genPluginStr } from './pluginGeneration'
import { encodeAsync, decodeAsync } from '../package'
import { getClientStorageAsync, setClientStorageAsync, updateClientStorageAsync, setPluginData, getPluginData, nodeToObject, ungroup } from '@fignite/helpers'
import { groupBy } from 'lodash'


// TODO: Different string output for running code and showing in UI

console.clear()

// console.log("topInstance", getTopInstance(figma.currentPage.selection[0]))
// console.log("parentIstance", getParentInstance(figma.currentPage.selection[0]))
// console.log("location", getNodeLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("counterPart1", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))
// console.log("backingNode", getInstanceCounterpartUsingLocation(figma.currentPage.selection[0], getTopInstance(figma.currentPage.selection[0])))


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

		async function runPlugin() {
			const handle = figma.notify("Generating code...", { timeout: 99999999999 })

			let platform = await updateClientStorageAsync("platform", (platform) => {
				platform = platform || "plugin"
				outputPlatform = platform
				return platform
			})

			let encodedString = ""

			if (origSel.length > 0) {
				// If something is selected save new string to storage
				encodedString = await encodeAsync(origSel, { platform })
				setClientStorageAsync("encodedString", encodedString)
			}
			else {
				encodedString = await getClientStorageAsync("encodedString")
			}

			// restore previous size
			let uiSize = await getClientStorageAsync('uiSize')

			if (!uiSize) {
				setClientStorageAsync("uiSize", uiDimensions)
				uiSize = uiDimensions
			}


			// cachedPlugin = encodedString
			handle.cancel()

			figma.showUI(__uiFiles__.main, uiSize);

			figma.ui.postMessage({ type: 'string-received', value: encodedString, platform })

			setTimeout(function () {
				if (!successful) {
					figma.notify("Plugin timed out")
					figma.closePlugin()
				}
			}, 8000)


		}

		runPlugin()


		plugin.on('run-code', () => {

			if (outputPlatform === "plugin") {
				getClientStorageAsync("encodedString").then((string) => {
					decodeAsync(string).then(({ nodes }) => {
						function positionInCenter(node) {
							// Position newly created table in center of viewport
							node.x = figma.viewport.center.x - (node.width / 2)
							node.y = figma.viewport.center.y - (node.height / 2)
						}

						let group = figma.group(nodes, figma.currentPage)

						positionInCenter(group)

						nodes = ungroup(group, figma.currentPage)
						figma.currentPage.selection = nodes
						// figma.viewport.scrollAndZoomIntoView(nodes)
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






