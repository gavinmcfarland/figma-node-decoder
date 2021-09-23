'use strict';

function componentToHex(c) {
    c = Math.floor(c * 255);
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex({ r, g, b }) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
var string = "";
var depth = 0;
function* processNodes(nodes, callback) {
    const len = nodes.length;
    if (len === 0) {
        return;
    }
    for (var i = 0; i < len; i++) {
        var node = nodes[i];
        let { before, during, after } = yield node;
        let children = node.children;
        let tab = `\t`;
        let tabDepth = depth;
        if (before) {
            // console.log("before", before(node))
            string += tab.repeat(tabDepth) + before();
        }
        if (children) {
            // if (during) {
            // 	// console.log("during", during(node))
            // 	string += tab.repeat(tabDepth) + during(node)
            // }
            yield* processNodes(children);
        }
        if (after) {
            // console.log("after", after(node))
            string += tab.repeat(tabDepth) + after();
        }
    }
}
function traverseGenerator(nodes, callback) {
    console.log('Generating widget code...');
    var tree = processNodes(nodes);
    var res = tree.next();
    while (!res.done) {
        // console.log(res.value);
        var node = res.value;
        var component;
        var props;
        console.log(node.padding);
        props = {
            name: node.name,
            hidden: !node.visible,
            x: node.x,
            y: node.y,
            blendMode: node.blendMode,
            opacity: node.opacity,
            // effect: Effect,
            fill: rgbToHex(node.fills[0].color),
            // stroke: SolidPaint, // Will support GradientPaint in future
            // strokeWidth: number,
            // strokeAlign: StrokeAlign
            rotation: node.rotation,
            width: node.height,
            height: node.width,
            cornerRadius: node.cornerRadius,
            padding: {
                top: node.paddingBottom,
                right: node.paddingRight,
                bottom: node.paddingBottom,
                left: node.paddingLeft
            },
            spacing: node.itemSpacing
        };
        var defaultPropValues = {
            "Frame": {
                name: "",
                hidden: false,
                x: 0,
                y: 0,
                blendMode: "normal",
                opacity: 1,
                effect: [],
                fill: [],
                stroke: [],
                strokeWidth: 1,
                strokeAlign: "inside",
                rotation: 0,
                cornerRadius: 0,
                overflow: "scroll"
            },
            "AutoLayout": {
                name: "",
                hidden: false,
                x: 0,
                y: 0,
                blendMode: "normal",
                opacity: 1,
                effect: [],
                fill: [],
                stroke: [],
                strokeWidth: 1,
                strokeAlign: "inside",
                rotation: 0,
                flipVertical: false,
                cornerRadius: 0,
                overflow: "scroll",
                width: "hug-contents",
                height: "hug-contents",
                direction: "horizontal",
                spacing: 0,
                padding: 0,
                horizontalAlignItems: "start",
                verticalAlignItems: "start"
            }
        };
        if (node.type === "FRAME") {
            if (node.layoutMode !== "NONE") {
                component = "AutoLayout";
            }
            else {
                component = "Frame";
            }
        }
        function genProps() {
            var array = [];
            for (let [key, value] of Object.entries(props)) {
                // Have to stringify key because don't want to ignore zero values
                if (defaultPropValues[component] && JSON.stringify(defaultPropValues[component][key])) {
                    if ((JSON.stringify(defaultPropValues[component][key]) !== JSON.stringify(value))) {
                        if (isNaN(value)) {
                            value = JSON.stringify(value);
                        }
                        else {
                            value = `{${value}}`;
                        }
                        array.push(`${key}=${value}`);
                    }
                }
            }
            return array.join(" ");
        }
        // res = callback({ tree, res, node })
        res = tree.next(callback(node, component, genProps()));
        depth++;
    }
}
traverseGenerator(figma.currentPage.selection, (node, component, props) => {
    return {
        before() {
            // console.log(node.fills[0])
            return `<${component} ${props}>\n`;
        },
        after() {
            return `</${component} close="${node.name}">\n`;
        }
    };
});
console.log(string);
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
