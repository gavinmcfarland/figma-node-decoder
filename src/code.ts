import v from 'voca'
import { str } from './str'
import { putValuesIntoArray, isNestedInstance, copyPasteProps, nodeToObject } from './helpers'
import { defaultPropValues, readOnlyProps, dynamicProps, textProps, styleProps } from './props'


// TODO: Check for mixed values like in corner radius
// TODO: Check for properties that can't be set on instances or nodes inside instances
// TODO: walkNodes and string API could be improved
// TODO: Fix mirror hangding null in vectors
// TODO: Some issues with auto layout, grow 1. These need to be applied to children after all children have been created.
// TODO: Need to createProps for nodes nested inside instance somewhere

var fonts
var allComponents = []
var discardNodes = []

var styles = {}

function sendToUI(msg) {
	figma.ui.postMessage(msg)
}

function findNoneGroupParent(node) {
	if (node.parent?.type === "BOOLEAN_OPERATION"
		|| node.parent?.type === "COMPONENT_SET"
		|| node.parent?.type === "GROUP") {
		return findNoneGroupParent(node.parent)
	}
	else {
		return node.parent
	}

}

// Provides a reference for the node when printed as a string
function Ref(nodes) {
	var result = []
	if (node !== null) {
		// TODO: Needs to somehow replace parent node references of selection with figma.currentPage
		// result.push(v.camelCase(node.type) + node.id.replace(/\:|\;/g, "_"))

		nodes = putValuesIntoArray(nodes)



		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i]

			// TODO: Needs to check if node exists inside selection
			// figma.currentPage.selection.some((item) => item === node)
			function nodeExistsInSel(nodes = figma.currentPage.selection) {
				for (var i = 0; i < nodes.length; i++) {
					var sourceNode = nodes[i]
					if (sourceNode.id === node.id) {
						return true
					}
					else if (sourceNode.children) {
						return nodeExistsInSel(sourceNode.children)
					}
				}
			}

			// console.log(node.name, node.id, node.type, nodeExistsInSel())

			if (node.type === "PAGE") {
				result.push('figma.currentPage')
			}
			else {
				result.push(v.camelCase(node.type) + "_" + node.id.replace(/\:|\;/g, "_"))
			}

		}

		if (result.length === 1) result = result[0]
	}


	return result

}


function StyleRef(style) {
	return v.lowerCase(style.name.replace(/\s|\//g, "_")) + "_" + style.key.slice(-4)
}

// A function that lets you loop through each node and their children, it provides callbacks to reference different parts of the loops life cycle, before, during, or after the loop.

function walkNodes(nodes, callback?, parent?, selection?, level?) {
	let node

	for (var i = 0; i < nodes.length; i++) {

		if (!parent) {
			selection = i
			level = 0
		}

		node = nodes[i]

		// If main component doesn't exist in document then create it
		// FIXME: This causes a mismatch with component IDs
		if (node.type === "COMPONENT" && node.parent == null) {
			node = node.clone()
			discardNodes.push(node)
		}

		let sel = selection // Index of which top level array the node lives in
		let ref = node.type?.toLowerCase() + (i + 1 + level - sel) // Trying to find a way to create a unique identifier based on where node lives in structure

		if (!parent) parent = "figma.currentPage"

		// These may not be needed now
		var obj = {
			ref,
			level, // How deep down the node lives in the array structure
			sel,
			parent
		}
		var stop = false
		if (callback.during) {
			// If boolean value of true returned from createBasic() then this sets a flag to stop iterating children in node
			stop = callback.during(node, obj)
		}


		if (node.children) {
			++level
			if (stop && nodes[i + 1]) {
				// Iterate the next node
				++i
				walkNodes([nodes[i]], callback, ref, selection, level)
			}
			else {
				walkNodes(node.children, callback, ref, selection, level)
			}

			if (callback.after) {
				callback.after(node, obj)
			}
		}


	}
}

function createProps(node, options = {}, mainComponent?) {
	var string = ""
	var staticPropsStr = ""
	var textPropsString = ""
	var fontsString = ""
	var hasText;
	var hasWidthOrHeight = true;

	for (let [name, value] of Object.entries(nodeToObject(node))) {

		// }
		// copyPasteProps(nodeToObject(node), ({ obj, name, value }) => {
		if (JSON.stringify(value) !== JSON.stringify(defaultPropValues[node.type][name])
			&& name !== "key"
			&& name !== "mainComponent"
			&& name !== "absoluteTransform"
			&& name !== "type"
			&& name !== "id"
			&& name !== "parent"
			&& name !== "children"
			&& name !== "masterComponent"
			&& name !== "mainComponent"
			&& name !== "horizontalPadding"
			&& name !== "verticalPadding"
			&& name !== "reactions"
			&& name !== "overlayPositionType"
			&& name !== "overflowDirection"
			&& name !== "numberOfFixedChildren"
			&& name !== "overlayBackground"
			&& name !== "overlayBackgroundInteraction"
			&& name !== "remote"
			&& name !== "defaultVariant") {

			// TODO: ^ Add some of these exclusions to nodeToObject()

			var overriddenProp = true;

			if (node.type === "INSTANCE") {
				overriddenProp = JSON.stringify(node[name]) !== JSON.stringify(mainComponent[name])
			}

			if (overriddenProp) {
				// Add resize

				if (options?.resize !== false) {

					// FIXME: This is being ignored when default of node is true for width, but not for height
					if ((name === "width" || name === "height") && hasWidthOrHeight) {
						hasWidthOrHeight = false


						// Round widths/heights less than 0.001 to 0.01 because API does not accept less than 0.01 for frames/components/component sets
						var width = node.width
						var height = node.height
						if (node.type === "FRAME" && node.width < 0.01) width = 0.01
						if (node.type === "FRAME" && node.height < 0.01) height = 0.01


						if (node.type === "FRAME" && node.width < 0.01 || node.height < 0.01) {
							string += `${Ref(node)}.resizeWithoutConstraints(${width}, ${height})\n`
						}
						else {
							string += `${Ref(node)}.resize(${width}, ${height})\n`
						}

					}
				}





				// If styles

				let style
				if (styleProps.includes(name)) {
					var styleId = node[name]
					styles[name] = styles[name] || []

					// Get the style
					style = figma.getStyleById(styleId)

					// Push to array if unique
					if (!styles[name].some((item) => JSON.stringify(item.id) === JSON.stringify(style.id))) {
						styles[name].push(style)
					}

					// Assign style to node
					if (name !== "textStyleId") {
						string += `${Ref(node)}.${name} = ${StyleRef(style)}.id\n`
					}

				}

				// If text prop
				if (textProps.includes(name)) {
					if (name === "textStyleId") {
						textPropsString += `\t\t\t${Ref(node)}.${name} = ${StyleRef(style)}.id\n`
					} else {
						textPropsString += `\t\t\t${Ref(node)}.${name} = ${JSON.stringify(value)}\n`
					}
				}

				// If a text node
				if (name === "characters") {
					hasText = true
					fonts = fonts || []
					if (!fonts.some((item) => JSON.stringify(item) === JSON.stringify(node.fontName))) {
						fonts.push(node.fontName)
					}

					fontsString += `${Ref(node)}.fontName = {
				family: ${JSON.stringify(node.fontName.family)},
				style: ${JSON.stringify(node.fontName.style)}
			}`
				}

				if (name !== 'width' && name !== 'height' && !textProps.includes(name) && !styleProps.includes(name)) {
					if (options?.[name] !== false) {
						staticPropsStr += `${Ref(node)}.${name} = ${JSON.stringify(value)}\n`
					}

				}
			}

		}
	}

	var loadFontsString = "";

	if (hasText) {
		loadFontsString = `\
	loadFonts().then((res) => {
			${fontsString}
${textPropsString}
	})\n`
	}

	string += `${staticPropsStr}`
	string += `${loadFontsString}`
	str`${string}`

}

function appendNode(node) {

	// If parent is a group type node then append to nearest none group parent
	if (node.parent?.type === "BOOLEAN_OPERATION"
		|| node.parent?.type === "GROUP") {
		str`${Ref(findNoneGroupParent(node))}.appendChild(${Ref(node)})\n`
	}
	else if (node.parent?.type === "COMPONENT_SET") {
		// Currently set to do nothing, but should it append to something? Is there a way?
		// str`${Ref(findNoneGroupParent(node))}.appendChild(${Ref(node)})\n`
	}
	else {
		str`${Ref(node.parent)}.appendChild(${Ref(node)})\n`
	}


}

function createBasic(node) {

	if (node.type === "COMPONENT") {
		if (allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
			return true
		}
	}

	if (node.type !== "GROUP"
		&& node.type !== "INSTANCE"
		&& node.type !== "COMPONENT_SET"
		&& node.type !== "BOOLEAN_OPERATION"
		&& !isNestedInstance(node)) {

		// TODO: Need to find a way to prevent objects being created for components that have already created by instances

		// If it's anything but a component then create the object
		if (node.type !== "COMPONENT") {
			str`

			// Create ${node.type}
var ${Ref(node)} = figma.create${v.titleCase(node.type)}()\n`
			createProps(node)


			appendNode(node)

		}

		// If it's a component first check if it's been added to the list before creating, if not then create it and add it to the list

		if (node.type === "COMPONENT") {

			if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
				str`
				
				// Create ${node.type}
var ${Ref(node)} = figma.create${v.titleCase(node.type)}()\n`
				createProps(node)


				appendNode(node)

				allComponents.push(node)
			}
		}

	}
}

function createInstance(node) {

	var mainComponent;

	if (node.type === "INSTANCE") {
		mainComponent = node.mainComponent
	}

	// If component doesn't exist in the document (as in it's in secret Figma location)
	if (node.type === "INSTANCE") {
		if (node.mainComponent.parent === null || !node.mainComponent) {
			// Create the component
			var temp = node.mainComponent.clone()
			mainComponent = temp
			// Add to nodes to discard at end
			discardNodes.push(temp)
		}
	}


	if (node.type === "INSTANCE" && !isNestedInstance(node)) {


		if (!allComponents.includes(mainComponent)) {
			createNode(mainComponent)
		}

		str`

		
// Create INSTANCE
var ${Ref(node)} = ${Ref(mainComponent)}.createInstance()\n`


		// Need to reference main component so that createProps can check if props are overriden
		createProps(node, {}, mainComponent)

		appendNode(node)
	}



	// Once component has been created add it to array of all components
	if (node.type === "INSTANCE") {
		if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(mainComponent))) {
			allComponents.push(mainComponent)
		}
	}

}

function createGroup(node) {
	if (node.type === "GROUP") {
		var children: any = Ref(node.children)
		if (Array.isArray(children)) {
			children = Ref(node.children).join(', ')
		}
		var parent
		if (node.parent?.type === "GROUP"
			|| node.parent?.type === "COMPONENT_SET"
			|| node.parent?.type === "BOOLEAN_OPERATION") {

			parent = `${Ref(findNoneGroupParent(node))}`
			// parent = `figma.currentPage`
		}
		else {
			parent = `${Ref(node.parent)}`
		}
		str`
		
		// Create GROUP
		var ${Ref(node)} = figma.group([${children}], ${parent})\n`
	}
}

function createBooleanOperation(node) {
	// Boolean can not be created if inside instance
	// TODO: When boolean objects are created they loose their coordinates?
	// TODO: Don't resize boolean objects
	if (node.type === "BOOLEAN_OPERATION"
		&& !isNestedInstance(node)) {
		var children: any = Ref(node.children)
		if (Array.isArray(children)) {
			children = Ref(node.children).join(', ')
		}
		var parent
		if (node.parent?.type === "GROUP"
			|| node.parent?.type === "COMPONENT_SET"
			|| node.parent?.type === "BOOLEAN_OPERATION") {
			parent = `${Ref(findNoneGroupParent(node))}`
		}
		else {
			parent = `${Ref(node.parent)}`
		}
		str`
		
		// Create BOOLEAN_OPERATION
		var ${Ref(node)} = figma.${v.lowerCase(node.booleanOperation)}([${children}], ${parent})\n`

		var x = node.parent.x - node.x;
		var y = node.parent.y - node.y;

		// TODO: Don't apply relativeTransform, x, y, or rotation to booleans
		createProps(node, { resize: false, relativeTransform: false, x: false, y: false, rotation: false })
	}
}

function createComponentSet(node, callback?) {
	// FIXME: What should happen when the parent is a group? The component set can't be added to a appended to a group. It therefore must be added to the currentPage, and then grouped by the group function?
	if (node.type === "COMPONENT_SET") {
		var children: any = Ref(node.children)
		if (Array.isArray(children)) {
			children = Ref(node.children).join(', ')
		}
		var parent
		if (node.parent?.type === "GROUP"
			|| node.parent?.type === "COMPONENT_SET"
			|| node.parent?.type === "BOOLEAN_OPERATION") {
			parent = `${Ref(findNoneGroupParent(node))}`
		}
		else {
			parent = `${Ref(node.parent)}`
		}


		str`
		
		// Create COMPONENT_SET
		var ${Ref(node)} = figma.combineAsVariants([${children}], ${parent})\n`

		createProps(node)
	}
}

function createNode(nodes) {
	nodes = putValuesIntoArray(nodes)
	walkNodes(nodes, {
		during(node, { ref, level, sel, parent }) {

			createInstance(node)
			return createBasic(node)
		},
		after(node, { ref, level, sel, parent }) {
			createGroup(node)
			createBooleanOperation(node)
			createComponentSet(node)
		}
	})
}

function main() {

	figma.showUI(__html__, { width: 320, height: 480 });

	var selection = figma.currentPage.selection

	// for (var i = 0; i < selection.length; i++) {
	createNode(selection)
	// }

	// Create styles
	if (styles) {
		var styleString = ""
		for (let [key, value] of Object.entries(styles)) {
			for (let i = 0; i < value.length; i++) {
				var style = value[i]


				if (style.type === "PAINT" || style.type === "EFFECT" || style.type === "GRID") {
					let nameOfProperty

					if (style.type === "GRID") {
						nameOfProperty = "layoutGrids"
					}
					else {
						nameOfProperty = v.camelCase(style.type) + "s"
					}

					styleString += `\

				// Create STYLE
				var ${StyleRef(style)} = figma.create${v.titleCase(style.type)}Style()
				${StyleRef(style)}.name = ${JSON.stringify(style.name)}
				${StyleRef(style)}.${nameOfProperty} = ${JSON.stringify(style[nameOfProperty])}
				`
				}

				if (style.type === "TEXT") {
					let nameOfProperty = "";

					styleString += `\

				// Create STYLE
				var ${StyleRef(style)} = figma.create${v.titleCase(style.type)}Style()
				${StyleRef(style)}.name = ${JSON.stringify(style.name)}
				${StyleRef(style)}.fontName = ${JSON.stringify(style.fontName)}
				${StyleRef(style)}.fontSize = ${JSON.stringify(style.fontSize)}
				${StyleRef(style)}.letterSpacing = ${JSON.stringify(style.letterSpacing)}
				${StyleRef(style)}.lineHeight = ${JSON.stringify(style.lineHeight)}
				${StyleRef(style)}.paragraphIndent = ${JSON.stringify(style.paragraphIndent)}
				${StyleRef(style)}.paragraphSpacing = ${JSON.stringify(style.paragraphSpacing)}
				${StyleRef(style)}.textCase = ${JSON.stringify(style.textCase)}
				${StyleRef(style)}.textDecoration = ${JSON.stringify(style.textDecoration)}
				`
				}

			}
		}
		str.prepend`${styleString}`
	}

	if (fonts) {
		str.prepend`
		// Load FONTS
		async function loadFonts() {
			await Promise.all([
				${fonts.map((font) => {
			return `figma.loadFontAsync({
					family: ${JSON.stringify(font.family)},
					style: ${JSON.stringify(font.style)}
					})`
		})}
			])
		}\n\n`
	}

	// Remove nodes created for temporary purpose
	for (var i = 0; i < discardNodes.length; i++) {
		var node = discardNodes[i]
		node.remove()
	}

	var result = str().match(/(?=[\s\S])(?:.*\n?){1,8}/g)

	sendToUI({ type: 'string-received', value: result })

}


var successful;

figma.ui.onmessage = (res) => {
	if (res.type === "code-rendered") {
		successful = true
	}

	if (res.type === "code-copied") {
		figma.notify("Copied to clipboard")
	}
}


if (figma.currentPage.selection.length > 0) {
	main()

	setTimeout(function () {

		if (!successful) {
			figma.notify("Plugin timed out")
			figma.closePlugin()
		}
	}, 6000)
}
else {
	figma.notify("Select nodes to decode")
	figma.closePlugin()
}

