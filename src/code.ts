import plugma from 'plugma'
import { genWidgetStr } from './widgetGeneration'
import { genPluginStr } from './pluginGeneration'
import { getClientStorageAsync, setClientStorageAsync, updateClientStorageAsync } from '@figlets/helpers'
import { update } from 'lodash'


plugma((plugin) => {	

	var successful;

	plugin.on('code-rendered', () => {
		successful = true
	})

	plugin.on('code-copied', () => {
		figma.notify("Copied to clipboard")
	})

	plugin.on('set-platform', (msg) => {
		var platform = msg.platform
		const handle = figma.notify("Generating code...", { timeout: 99999999999 })

		setClientStorageAsync("platform", platform).then(() => {
			if (platform === "plugin") {
				genPluginStr().then((string) => {
					handle.cancel()

					// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

					figma.ui.postMessage({ type: 'string-received', value: string, platform })

					setTimeout(function () {
						if (!successful) {
							figma.notify("Plugin timed out")
							figma.closePlugin()
						}
					}, 8000)

				})
			}

			if (platform === "widget") {
				genWidgetStr().then((string) => {
					handle.cancel()

					// figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

					figma.ui.postMessage({ type: 'string-received', value: string, platform })

					setTimeout(function () {
						if (!successful) {
							figma.notify("Plugin timed out")
							figma.closePlugin()
						}
					}, 8000)
				})
			}
		})
		
	})

	const handle = figma.notify("Generating code...", { timeout: 99999999999 })

	updateClientStorageAsync("platform", (platform) => {
		platform = platform || "plugin"
		return platform
	}).then(() => {
		if (figma.currentPage.selection.length > 0) {

			

			getClientStorageAsync("platform").then((platform) => {

				if (platform === "plugin") {
					genPluginStr().then((string) => {
						handle.cancel()

						figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)
					
					})
				}
				
				if (platform === "widget") {
					genWidgetStr().then((string) => {
						handle.cancel()

						figma.showUI(__uiFiles__.main, { width: 320, height: 480 });

						figma.ui.postMessage({ type: 'string-received', value: string, platform })

						setTimeout(function () {
							if (!successful) {
								figma.notify("Plugin timed out")
								figma.closePlugin()
							}
						}, 8000)
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
