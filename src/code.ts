import plugma from 'plugma'
import { genWidgetStr } from './widgetGeneration'
import { genPluginStr } from './pluginGeneration'
import { getClientStorageAsync, setClientStorageAsync, updateClientStorageAsync, getInstanceCounterpartUsingLocation, getParentInstance } from '@figlets/helpers'

console.clear()

plugma((plugin) => {

	var origSel = figma.currentPage.selection

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



	plugin.on('resize', (msg) => {
		figma.ui.resize(msg.size.width, msg.size.height);
		figma.clientStorage.setAsync('uiSize', msg.size).catch(err => { });// save size
	})

})




