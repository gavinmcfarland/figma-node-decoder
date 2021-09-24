import plugma from 'plugma'
import { genWidgetStr } from './widgetGeneration'
import { genPluginStr } from './pluginGeneration'
import { getClientStorageAsync, setClientStorageAsync, updateClientStorageAsync } from '@figlets/helpers'


plugma((plugin) => {
	
	var origSel = figma.currentPage.selection

	var cachedPlugin;
	var cachedWidget;

	var successful;

	var uiDimensions = { width: 320, height: 528 }

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
					console.log(error)
					figma.notify("Cannot generate code for selection")
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
					console.log(error)
					figma.notify("Cannot generate code for selection")
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

			

			getClientStorageAsync("platform").then((platform) => {

				if (platform === "plugin") {
					genPluginStr(origSel).then((string) => {
						cachedPlugin = string
						handle.cancel()

						figma.showUI(__uiFiles__.main, uiDimensions);

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)
					
					}).catch((error) => {
						handle.cancel()
						console.log(error)
						figma.closePlugin("Cannot generate code for selection")
					})
				}
				
				if (platform === "widget") {
					genWidgetStr(origSel).then((string) => {
						cachedWidget = string
						handle.cancel()

						figma.showUI(__uiFiles__.main, uiDimensions);

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)
					}).catch((error) => {
						handle.cancel()
						console.log(error)
						figma.closePlugin("Cannot generate code for selection")
					})
				}
			})



		}
		else {
			handle.cancel()
			figma.closePlugin("Select nodes to decode")
		}
	})
})
