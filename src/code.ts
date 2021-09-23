import v from 'voca'
import { str } from './str'
import { getInstanceCounterpart, getOverrides, getNodeDepth, getParentInstance, getNoneGroupParent, isInsideInstance } from '@figlets/helpers'
import plugma from 'plugma'
import { putValuesIntoArray, nodeToObject } from './helpers'
import { defaultPropValues, textProps, styleProps } from './props'

function componentToHex(c) {
	c = Math.floor(c * 255)
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex({ r, g, b }) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255
	} : null;
}

var widgets = [
	"AutoLayout",
	"Frame",
	"Rectangle",
	"Ellipse",
	"SVG",
	"Image"
]

var fonts
var allComponents = []
var discardNodes = []

var styles = {}

var string = ""
var depth = 0;

function* processNodes(nodes, callback?) {
	const len = nodes.length;
	if (len === 0) {
		return;
	}

	for (var i = 0; i < len; i++) {
		var node = nodes[i];
		let { before, during, after } = yield node;

		let children = node.children;

		let tab = `\t`
		let tabDepth = depth

		if (before) {
			// console.log("before", before(node))
			string += tab.repeat(tabDepth) + before(node)
		}

		if (children) {
			if (during) {
				// console.log("during", during(node))
				string += tab.repeat(tabDepth) + during(node)
			}

			yield* processNodes(children);
		}
		
		if (after) {
			// console.log("after", after(node))
			string += tab.repeat(tabDepth) + after(node)
		}
	}
}



function traverseGenerator(nodes, callback) {
	console.log('Generating widget code...')

	
	var tree = processNodes(nodes);
	var res = tree.next();

	while (!res.done) {
		// console.log(res.value);
		var node = res.value

		res = callback({ tree, res, node })
		
		depth++;
	}
}


traverseGenerator(figma.currentPage.selection, ({ tree, res, node }) => {
	if (node.type === "FRAME") {
		res = tree.next({
			before(node) {
				// console.log(node.fills[0])
				return `<Frame name="${node.name}" fill="${rgbToHex(node.fills[0].color)}">\n`
			},
			after() {
				return `</Frame>\n`
			}
		})
	}

	return res
})

console.log(string)


// plugma((plugin) => {

// 	plugin.ui = {
// 		width: 268,
// 		height: 504
// 	}

// 	console.log("test")



// 	// plugin.command('createTable', ({ ui, data }) => {
// 	// 	getClientStorageAsync("recentFiles").then((recentFiles) => {

// 	// 		if (recentFiles) {
// 	// 			// Exclude current file
// 	// 			recentFiles = recentFiles.filter(d => {
// 	// 				return !(d.id === getPluginData(figma.root, "fileId"))
// 	// 			})
// 	// 			recentFiles = (Array.isArray(recentFiles) && recentFiles.length > 0)
// 	// 		}


// 	// 		getClientStorageAsync("pluginAlreadyRun").then((pluginAlreadyRun) => {
// 	// 			figma.clientStorage.getAsync('userPreferences').then((res) => {
// 	// 				ui.show(
// 	// 					{
// 	// 						type: "create-table",
// 	// 						...res,
// 	// 						usingRemoteTemplate: getPluginData(figma.root, "usingRemoteTemplate"),
// 	// 						defaultTemplate: getPluginData(figma.root, 'defaultTemplate'),
// 	// 						remoteFiles: getPluginData(figma.root, 'remoteFiles'),
// 	// 						localTemplates: getPluginData(figma.root, 'localTemplates'),
// 	// 						fileId: getPluginData(figma.root, 'fileId'),
// 	// 						pluginAlreadyRun: pluginAlreadyRun,
// 	// 						recentFiles: recentFiles
// 	// 					})
// 	// 			})
// 	// 		})
// 	// 	})


// 	// })

// 	// Listen for events from UI

// 	// plugin.on('to-create-table', (msg) => {
// 	// 	figma.clientStorage.getAsync('userPreferences').then((res) => {
// 	// 		plugin.ui.show({ type: "create-table", ...res, defaultTemplate: getPluginData(figma.root, 'defaultTemplate'), remoteFiles: getPluginData(figma.root, 'remoteFiles'), localTemplates: getPluginData(figma.root, 'localTemplates'), fileId: getPluginData(figma.root, 'fileId') })
// 	// 	})
// 	// })

// })





// function main(opts?) {

// 	function sendToUI(msg) {
// 		figma.ui.postMessage(msg)
// 	}

// 	// sendToUI({ type: 'string-received', value: result })

// }


// var successful;

// figma.ui.onmessage = (res) => {
// 	if (res.type === "code-rendered") {
// 		successful = true
// 	}

// 	if (res.type === "code-copied") {
// 		figma.notify("Copied to clipboard")
// 	}
// }


// if (figma.currentPage.selection.length > 0) {
// 	main({widgets: true})

// 	setTimeout(function () {

// 		if (!successful) {
// 			figma.notify("Plugin timed out")
// 			figma.closePlugin()
// 		}
// 	}, 8000)
// }
// else {
// 	figma.closePlugin("Select nodes to decode")
// }
