// const v = require('voca')
import v from 'voca'
import { str } from './str'
import { getInstanceCounterpart, getOverrides, getNodeDepth, getParentInstance, getNoneGroupParent, isInsideInstance } from '@figlets/helpers'
import plugma from 'plugma'
import { putValuesIntoArray, nodeToObject } from './helpers'
import { defaultPropValues, textProps, styleProps } from './props'
import { entries } from 'lodash'

function Utf8ArrayToStr(array) {
	var out, i, len, c;
	var char2, char3;

	out = "";
	len = array.length;
	i = 0;
	while (i < len) {
		c = array[i++];
		switch (c >> 4) {
			case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
				// 0xxxxxxx
				out += String.fromCharCode(c);
				break;
			case 12: case 13:
				// 110x xxxx   10xx xxxx
				char2 = array[i++];
				out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
				break;
			case 14:
				// 1110 xxxx  10xx xxxx  10xx xxxx
				char2 = array[i++];
				char3 = array[i++];
				out += String.fromCharCode(((c & 0x0F) << 12) |
					((char2 & 0x3F) << 6) |
					((char3 & 0x3F) << 0));
				break;
		}
	}

	return out;
}

function isObj(val) {
	if (val === null) { return false; }
	return ((typeof val === 'function') || (typeof val === 'object'));
}

function isStr(val) {
	if (typeof val === 'string' || val instanceof String) return val
}

function simpleClone(val) {
	return JSON.parse(JSON.stringify(val))
}

function componentToHex(c) {
	c = Math.floor(c * 255)
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
	if (rgb) {
		let { r, g, b } = rgb
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
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
let tab = `\t`

function* processNodes(nodes) {

	const len = nodes.length;
	if (len === 0) {
		return;
	}

	for (var i = 0; i < len; i++) {
		var node = nodes[i];
		let { before, during, after } = yield node;

		let children = node.children;

		
		let tabDepth = depth

		if (before) {
			// console.log("before", before(node))
			string += tab.repeat(tabDepth) + before()
		}

		if (children) {
			if (during && typeof during() !== 'undefined') {
				// console.log(during())
				string += tab.repeat(tabDepth) + during()
			}

			yield* processNodes(children);
		}
		else if (node.characters) {
			if (during) {
				string += tab.repeat(tabDepth + 1) + during()
			}
		}
		
		if (after) {
			// console.log("after", after(node))
			string += tab.repeat(tabDepth) + after()
		}
	}
}



async function traverseGenerator(nodes, callback) {
	console.log('Generating widget code...')

	
	var tree = processNodes(nodes);
	var res = tree.next();

	while (!res.done) {
		// console.log(res.value);
		let node = res.value
		let component;

		function sanitiseValue(value) {
			if (typeof value !== 'undefined') {
				function doThingOnValue(value) {
					// Convert snakeCase and upperCase to kebabCase and lowercase
					if (isStr(value)) {
						value = v.lowerCase(v.kebabCase(value))
					}

					if (value === "min") value = "start"
					if (value === "max") value = "end"

					return value
				}

				var newValue;
				
				if (isObj(value)) {
					var cloneValue = simpleClone(value)
					for (let [key, value] of Object.entries(cloneValue)) {

						cloneValue[key] = doThingOnValue(value)

						// Convert radius to blur for effects
						if (key === "radius") {
							
							// Use this to rename property
							Object.defineProperty(cloneValue, 'blur',
								Object.getOwnPropertyDescriptor(cloneValue, 'radius'));
							delete cloneValue['radius'];

						}
						
						// console.log(key, value)
					}

					newValue = cloneValue
				}

				if (isStr(value)) {
					newValue = doThingOnValue(value)
				}

				return newValue
			}
		}

		var props = {
			name: node.name,
			hidden: !node.visible,
			x: node.x,
			y: node.y,
			blendMode: sanitiseValue(node.blendMode),
			opacity: node.opacity,
			// effect: Effect,
			fill: (() => {
				if (node.fills && node.fills.length > 0) {
					if (node.fills[0].opacity === 1) {
						return rgbToHex(node.fills[0]?.color)
					}
					else {
						console.log("Fill cannot have opacity")
						return undefined
					}
				}
			})(),
			// stroke: rgbToHex(node.strokes[0]?.color), // Will support GradientPaint in future
			stroke: (() => {
				if (node.strokes && node.strokes.length > 0) {
					if (node.strokes[0].opacity === 1) {
						return rgbToHex(node.strokes[0]?.color)
					}
					else {
						console.log("Stroke cannot have opacity")
						return undefined
					}
				}
			})(),
			strokeWidth: node.strokeWeight,
			strokeAlign: sanitiseValue(node.strokeAlign),
			rotation: node.rotation,
			width: (() => {
				if (node.width < 0.01) {
					return 0.01
				}
				else {
					return node.width
				}
			})(),
			height: (() => {
				if (node.height < 0.01) {
					return 0.01
				}
				else {
					return node.height
				}
			})(),
			cornerRadius: {
				topLeft: node.topLeftRadius,
				topRight: node.topRightRadius,
				bottomLeft: node.bottomLeftRadius,
				bottomRight: node.bottomRightRadius
			},
			padding: {
				top: node.paddingBottom,
				right: node.paddingRight,
				bottom: node.paddingBottom,
				left: node.paddingLeft
			},
			spacing: node.itemSpacing,
			effect: sanitiseValue(node.effects[0]),
			direction: sanitiseValue(node.layoutMode),
			fontSize: node.fontSize,
			// fontFamily: node.fontName?.family,
			fontWeight: (() => {
				switch (node.fontName?.style) {
					case "Thin":
						return 100
						break
					case "ExtraLight":
						return 200
						break
					case "Medium":
						return 300
						break
					case "Normal":
						return 400
						break
					case "Medium":
						return 500
						break
					case "SemiBold":
						return 600
						break
					case "Bold":
						return 700
						break
					case "ExtraBold":
						return 800
						break
					case "Black" || "Heavy":
						return 900
						break
					default: 400
				}
			})(),
			textDecoration: sanitiseValue(node.textDecoration),
			horizontalAlignItems: sanitiseValue(node.primaryAxisAlignItems),
			verticalAlignItems: sanitiseValue(node.counterAxisAlignItems)
		}

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
				overflow: "scroll",
				width: 100,
				height: 100
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
			},
			"Text": {
				name: "",
				hidden: false,
				x: 0,
				y: 0,
				blendMode: "normal",
				opacity: 1,
				effect: [],
				width: "hug-contents",
				height: "hug-contents",
				rotation: 0,
				flipVertical: false,
				fontFamily: "Roboto",
				horizontalAlignText: "left",
				verticalAlignText: "top",
				letterSpacing: 0,
				lineHeight: "auto",
  				textDecoration: "none",
				textCase: "original",
				fontSize: 16,
				italic: false,
				fill: {
					type: "solid",
					color: "#000000",
					blendMode: "normal"
				},
				fontWeight: 400,
				paragraphIndent: 0,
				paragraphSpacing: 0,
			},
			"Rectangle": {
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
				width: 100,
				height: 100
			},
			"Ellipse": {
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
				width: 100,
				height: 100
			},
			"SVG": {
				width: 100,
				height: 100,
				x: 0,
				y: 0
			}
		}

		if (node.type === "FRAME" || node.type === "GROUP") {
			if (node.layoutMode && node.layoutMode !== "NONE") {
				component = "AutoLayout"
			}
			else {
				component = "Frame"
			}
			
		}
		if (node.type === "TEXT") {
			component = "Text"
		}

		if (node.type === "ELLIPSE") {
			component = "Ellipse"
		}

		if (node.type === "RECTANGLE" || node.type === "LINE") {
			component = "Rectangle"
		}

		if (node.type === "VECTOR") {
			component = "SVG"
		}

		function genProps() {
			var array = []
			for (let [key, value] of Object.entries(props) as any) {
				// If default props for component
				if (component && defaultPropValues[component]) {
					// Ignore undefined values
					if (typeof value !== 'undefined') {
						
						// Check property exists for component
						if (key in defaultPropValues[component]) {
							
							if ((JSON.stringify(defaultPropValues[component][key]) !== JSON.stringify(value))) {

								
								// Certain values need to be wrapped in curly braces
								if (isNaN(value)) {
									if (typeof value === 'object' && value !== null) {
										
										value = `{${JSON.stringify(value)}}`
									}
									else {
										value = `${JSON.stringify(value)}`
									}
								}
								else {
									value = `{${value}}`
								}

								// Don't add tabs on first prop
								if (array.length === 0) {
									array.push(`${key}=${value}`)
								}
								else {
									array.push(`${tab.repeat(depth)}${key}=${value}`)
								}
							}
						}
					}
				}
			}
			return array.join("\n")
		}

		// res = callback({ tree, res, node })

		// Need to use express `callback() || {}` incase the calback returns a nullish value

		// if (node.type === "VECTOR") {
		// 	node.exportAsync({
		// 		format: "SVG"
		// 	}).then((svg) => {
		// 		res = tree.next(callback(node, component, genProps(), svg) || {})
		// 	})

			
		// }
		// else {
		
		res = tree.next(await callback(node, component, genProps()) || {})
		
		depth++;
	}

	return string
}

function isFrame(node) {
	if (node.type === "FRAME") {
		return true
	}
}


plugma((plugin) => {	

	var successful;

	plugin.on('code-rendered', () => {
		successful = true
	})

	plugin.on('code-copied', () => {
		figma.notify("Copied to clipboard")
	})

	traverseGenerator(figma.currentPage.selection, async (node, component, props) => {
		var svg;

		if (component === "SVG") {
			svg = await node.exportAsync({ format: "SVG" })
		}
		

		if (component) {
			return {
				before() {
					if (component === "SVG") {
						// await new Promise<void>((resolve) => {
						// 	figma.showUI(`
						// <script>
						// 	function utf8_to_b64( str ) {
						// 		return window.btoa(unescape(encodeURIComponent( str )));
						// 	}

						// 	function b64_to_utf8( str ) {
						// 		return decodeURIComponent(escape(window.atob( str )));
						// 	}

						// 	window.onmessage = async (event) => {
						// 		const msg = event.data.pluginMessage

						// 		var encodedImage = utf8_to_b64( msg.value )

						// 		console.log(encodedImage.toString())

						// 		parent.postMessage({ pluginMessage: { type: 'encoded-image', value: encodedImage } }, '*')
						// 	}
						// </script>
          				// `, { visible: false })

						// 	figma.ui.postMessage({ type: 'decode-svg', value: svg })


						// 	figma.ui.onmessage = (msg) => {
						// 		if (msg.type === "encoded-image") {
						// 			console.log(msg.value)
						// 		}

						// 	}
							// resolve()

							
						// })
						
						return `<${component} ${props} overflow="visible" src={\`${Utf8ArrayToStr(svg)}\`} />\n`
						
					}
					else {
						return `<${component} ${props}>\n`
					}
				},
				during() {
					if (component === "Text") {
						return `${node.characters}\n`
					}
				},
				after() {
					if (component !== "SVG") {
						return `</${component}>\n`
					}
					else {
						return ``
					}
					
				}
			}
		}
		else {
			console.log("Node doesn't exist as component")
		}
	}).then((string) => {
		if (figma.currentPage.selection.length > 0) {
			figma.showUI(__uiFiles__.main, { width: 320, height: 480 });
			figma.ui.postMessage({ type: 'string-received', value: string })

			setTimeout(function () {
				if (!successful) {
					figma.notify("Plugin timed out")
					figma.closePlugin()
				}
			}, 8000)
		}
		else {
			figma.closePlugin("Select nodes to decode")
		}
	})

	

})
