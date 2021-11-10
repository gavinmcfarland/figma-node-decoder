import { isArray } from 'lodash';
import v from 'voca'

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



async function walkNodes(nodes, callback) {
	var string = ""
	var depth = 0;
	var count = 0;
	let tab = `\t`

	function* processNodes(nodes) {

		const len = nodes.length;
		if (len === 0) {
			return;
		}

		for (var i = 0; i < len; i++) {
			var node = nodes[i];
			let { before, during, after, stop = false, skip = false } = yield node;

			if (skip) {

			}
			else {
				let children = node.children;

				if (before) {
					// console.log("before", before(node))
					string += tab.repeat(depth) + before()
				}

				if (!stop) {
					if (children) {
						if (during && typeof during() !== 'undefined') {
							// console.log(during())
							string += tab.repeat(depth) + during()
						}

						yield* processNodes(children);
					}
					else if (node.characters) {
						if (during) {
							string += tab.repeat(depth + 1) + during()
						}
					}
				}


				if (after) {
					// console.log("after", after(node))
					string += tab.repeat(depth) + after()
					depth--
				}
			}
		}
	}


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
					// Set to undefined to remove, as this is space = "auto" in widget land
					if (value === "space-between") value = undefined

					return value
				}

				var newValue;

				if (isObj(value)) {

					var cloneValue = simpleClone(value)
					for (let [key, value] of Object.entries(cloneValue)) {

						cloneValue[key] = doThingOnValue(value)

						// if (key === "opacity") {

						// 	// cloneValue['color']['a'] = "test"
						// 	// console.log(cloneValue)
						// 	Object.defineProperty(cloneValue['color'], 'a', Object.getOwnPropertyDescriptor(cloneValue, 'opacity'));
						// 	// console.log(cloneValue)
						// }

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

				if (Array.isArray(value)) {
					var cloneValue = simpleClone(value)
					for (var i = 0; i < cloneValue.length; i++) {
						var item = cloneValue[i]
						for (let [key, value] of Object.entries(item)) {

							item[key] = doThingOnValue(value)

							// if (key === "opacity") {
							//     console.log(item[key])
							// }


							// Convert radius to blur for effects
							if (key === "radius") {

								// Use this to rename property
								Object.defineProperty(item, 'blur',
									Object.getOwnPropertyDescriptor(item, 'radius'));
								delete item['radius'];

							}

							// console.log(key, value)
						}
						cloneValue[i] = item
					}
					newValue = cloneValue

				}

				if (isStr(value)) {

					newValue = doThingOnValue(value)
				}

				if (!isNaN(value)) {
					newValue = value
				}

				return newValue
			}
		}

		function genWidthHeightProps(node) {
			var width = node.width
			var height = node.height

			width = (() => {
				if (node.width < 0.01) {
					return 0.01
				}
				else {
					return node.width
				}
			})()

			height = (() => {
				if (node.height < 0.01) {
					return 0.01
				}
				else {
					return node.height
				}
			})()

			// console.log({
			//     parentLayoutMode: node.parent.layoutMode,
			//     layoutMode: node.layoutMode,
			//     counterAxisSizingMode: node.counterAxisSizingMode,
			//     primaryAxisSizingMode: node.primaryAxisSizingMode,
			//     layoutAlign: node.layoutAlign,
			//     layoutGrow: node.layoutGrow
			// })



			// if (node.layoutMode && node.layoutMode !== "NONE") {
			if ((node.layoutMode === "HORIZONTAL" && node.primaryAxisSizingMode === "AUTO") ||
				(node.layoutMode === "VERTICAL" && node.counterAxisSizingMode === "AUTO") ||
				((node.parent.layoutMode === "NONE" || !node.parent.layoutMode) && node.layoutMode === "HORIZONTAL" && (node.primaryAxisSizingMode === "AUTO" && node.layoutGrow === 0) ||
					((node.parent.layoutMode === "NONE" || !node.parent.layoutMode) && node.layoutMode === "VERTICAL" && (node.counterAxisSizingMode === "AUTO" && node.layoutGrow === 0)))) {
				width = "hug-contents"
			}
			if ((node.layoutMode === "HORIZONTAL" && node.counterAxisSizingMode === "AUTO") ||
				(node.layoutMode === "VERTICAL" && node.primaryAxisSizingMode === "AUTO") ||
				((node.parent.layoutMode === "NONE" || !node.parent.layoutMode) && node.layoutMode === "VERTICAL" && (node.primaryAxisSizingMode === "AUTO" && node.layoutGrow === 0)) ||
				((node.parent.layoutMode === "NONE" || !node.parent.layoutMode) && node.layoutMode === "HORIZONTAL" && (node.counterAxisSizingMode === "AUTO" && node.layoutGrow === 0))) {
				height = "hug-contents"
			}

			if ((node.parent.layoutMode === "HORIZONTAL" && node.layoutGrow === 1) ||
				(node.parent.layoutMode === "VERTICAL" && node.layoutAlign === "STRETCH")) {
				width = "fill-parent"
			}

			if ((node.parent.layoutMode === "HORIZONTAL" && node.layoutAlign === "STRETCH") ||
				(node.parent.layoutMode === "VERTICAL" && node.layoutGrow === 1)) {
				height = "fill-parent"
			}

			// FIXME: Add rules to prevent width and height being added to text unless fixed

			if (node.textAutoResize === "HEIGHT") {
				height = "hug-contents"
			}

			if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
				height = "hug-contents"
				width = "hug-contents"
			}
			// }

			var obj = {
				width,
				height
			}

			// console.log(obj)

			return obj
		}

		var props = {
			...genWidthHeightProps(node),
			name: node.name,
			hidden: !node.visible,
			x: (() => {
				// if (node.constraints?.horizontal) {
				//     return sanitiseValue(node.constraints?.horizontal)
				// }
				// else {
				return node.x
				// }

			})(),
			y: (() => {
				// if (node.constraints?.vertical) {
				//     return sanitiseValue(node.constraints?.vertical)
				// }
				// else {
				return node.y
				// }

			})(),
			blendMode: sanitiseValue(node.blendMode),
			opacity: node.opacity,
			// effect: Effect,
			fill: (() => {
				if (node.fills && node.fills.length > 0) {
					if (node.fills[0].visible) {
						return sanitiseValue(node.fills[0])
					}

					// if (node.fills[0].opacity === 1) {
					//     return rgbToHex(node.fills[0]?.color)
					// }
					// else {
					//     console.log("Fill cannot have opacity")
					//     return undefined
					// }
				}
			})(),
			// stroke: rgbToHex(node.strokes[0]?.color), // Will support GradientPaint in future
			stroke: (() => {
				if (node.strokes && node.strokes.length > 0) {
					if (node.strokes[0].visible) {
						return sanitiseValue(node.strokes[0])
					}

					// if (node.strokes[0].opacity === 1) {
					//     return rgbToHex(node.strokes[0]?.color)
					// }
					// else {
					//     console.log("Stroke cannot have opacity")
					//     return undefined
					// }
				}
			})(),
			strokeWidth: node.strokeWeight,
			strokeAlign: sanitiseValue(node.strokeAlign),
			rotation: node.rotation,
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
			spacing: (() => {
				if (node.primaryAxisAlignItems === "SPACE_BETWEEN" || node.counterAxisAlignItems === "SPACE_BETWEEN") {
					return "auto"
				}
				else {
					return node.itemSpacing
				}
			})(),
			effect: (() => {
				if (node.effects && node.effects.length > 0) {
					return sanitiseValue(node.effects)
				}
			})(),

			// effect: sanitiseValue(node.effects[0]),
			direction: sanitiseValue(node.layoutMode),
			fontSize: node.fontSize,
			fontFamily: node.fontName?.family,
			fontWeight: (() => {
				if (node.fontName) return sanitiseValue(node.fontName.style)
				// switch (node.fontName?.style) {

				//     case "Thin":
				//         return 100
				//         break
				//     case "ExtraLight":
				//         return 200
				//         break
				//     case "Medium":
				//         return 300
				//         break
				//     case "Normal":
				//         return 400
				//         break
				//     case "Medium":
				//         return 500
				//         break
				//     case "SemiBold" && "Semi Bold":
				//         return 600
				//         break
				//     case "Bold":
				//         return 700
				//         break
				//     case "ExtraBold":
				//         return 800
				//         break
				//     case "Black" && "Heavy":
				//         return 900
				//         break
				//     default: 400
				// }
			})(),
			textDecoration: sanitiseValue(node.textDecoration),
			horizontalAlignText: sanitiseValue(node.textAlignHorizontal),
			verticalAlignText: sanitiseValue(node.textAlignVertical),
			lineHeight: (() => {
				if (node.lineHeight) {
					return sanitiseValue(node.lineHeight.value)
				}
			})(),
			letterSpacing: (() => {
				if (node.letterSpacing?.unit) {
					var unit;
					if (node.letterSpacing.unit === "PERCENT") {
						unit = "%"
					}
					if (node.letterSpacing.unit === "PIXELS") {
						unit = "px"
					}
					return node.letterSpacing.value + unit
				}
			})(),
			textCase: sanitiseValue(node.textCase),
			horizontalAlignItems: (() => {
				if (node.layoutMode === "HORIZONTAL") {
					return sanitiseValue(node.primaryAxisAlignItems)
				}
				if (node.layoutMode === "VERTICAL") {
					return sanitiseValue(node.counterAxisAlignItems)
				}
			})(),
			verticalAlignItems: (() => {
				if (node.layoutMode === "HORIZONTAL") {
					return sanitiseValue(node.counterAxisAlignItems)
				}
				if (node.layoutMode === "VERTICAL") {
					return sanitiseValue(node.primaryAxisAlignItems)
				}
			})(),
			overflow: (() => {
				if (node.clipsContent) {
					return "hidden"
				}
				else {
					return "visible"
				}
			})()
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

		if (node.type === "FRAME" || node.type === "GROUP" || node.type === "INSTANCE" || node.type === "COMPONENT") {
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

		if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "POLYGON" || node.type === "STAR" || (node.exportSettings && node.exportSettings[0]?.format === "SVG")) {
			component = "SVG"
		}

		var svg, stop = false;


		if (component === "SVG") {
			if (node.visible) {
				svg = await node.exportAsync({ format: "SVG" })
			}
			else {
				// Skip component
				component = "skip"
			}

			// Don't iterate children
			stop = true
		}

		if (!node.visible) {
			// Skip component
			component = "skip"
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

		// if (component === "SVG") {
		// 	res = tree.next(await callback(node, component, genProps()) || {})
		// 	console.log(res)
		// }
		// else {

		if (component !== "skip") {
			console.log("skip", component)
			res = tree.next(await callback(node, component, genProps(), stop, svg))
		}
		else {
			res = tree.next({skip: true})
		}


		// }


		count++;
		depth++;
	}

	if (string === "") {
		throw "No output generated from selection"
	}

	return string
}

export async function genWidgetStr(origSel) {
	return walkNodes(origSel, async (node, component, props, stop, svg) => {

		if (component) {
			return {
				stop,
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
			figma.notify("Node doesn't exist as a React component")
			console.log("Node doesn't exist as a React component")
		}
	})
}
