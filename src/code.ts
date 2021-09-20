import v from 'voca'
import { str } from './str'
import { putValuesIntoArray, isNestedInstance, copyPasteProps, nodeToObject } from './helpers'
import { defaultPropValues, readOnlyProps, dynamicProps, textProps, styleProps } from './props'

function getNodeIndex(node: SceneNode): number {
	return node.parent.children.indexOf(node)
}

function getNodeDepth(node, container = figma.currentPage, level = 0) {
	if (node !== null) {
		if (node.id === container.id) {
			return level
		}
		else {
			level += 1
			return getNodeDepth(node.parent, container, level)
		}
	}
}

function isPartOfInstance(node: SceneNode): boolean {
	const parent = node.parent
	if (parent.type === 'INSTANCE') {
		return true
	} else if (parent.type === 'PAGE') {
		return false
	} else {
		return isPartOfInstance(parent as SceneNode)
	}
}
function isPartOfComponent(node: SceneNode): boolean {
	const parent = node.parent
	if (parent.type === 'COMPONENT') {
		return true
	} else if (parent.type === 'PAGE') {
		return false
	} else {
		return isPartOfComponent(parent as SceneNode)
	}
}

function findParentInstance(node) {
	const parent = node.parent
	if (node.type === "PAGE") return null
	if (parent.type === "INSTANCE") {
		return parent
	} else if (isPartOfInstance(node)) {
		return findParentInstance(node.parent)
	} else {
		return node
	}

}

function getNodeCoordinates(node, container = figma.currentPage, depth = []) {
	if (node !== null) {
		if (node.id === container.id) {
			if (depth.length > 0) {
				// Because nodesIndex have been captured in reverse
				return depth.reverse()
			}
			else {
				return false
			}
		}
		else {
			var nodeIndex = getNodeIndex(node)
			// if (node.parent.layoutMode == "HORIZONTAL" || node.parent.layoutMode === "VERTICAL") {
			// 	nodeIndex = (node.parent.children.length - 1) - getNodeIndex(node)
			// }
			depth.push(nodeIndex)
			return getNodeCoordinates(node.parent, container, depth)
		}
	}
}

function getInstanceCounterpart2(instance, node, componentNode = instance?.mainComponent, coordinates = getNodeCoordinates(node, findParentInstance(node))) {
	// console.log("componentNode", componentNode)
	// console.log(coordinates, findParentInstance(node))
	// if (componentNode) {
	if (coordinates.length > 0) {
		for (var a = 0; a < coordinates.length; a++) {
			var nodeIndex = coordinates[a]

			// if (componentNode.parent.layoutMode == "HORIZONTAL" || componentNode.parent.layoutMode === "VERTICAL") {
			// 	// console.log("hasAutoLayout", a)
			// 	// console.log("nodeIndex", (coordinates.length) - coordinates[a])
			// 	// nodeIndex = ((componentNode.children.length - 1) - coordinates[a])
			// 	nodeIndex = a
			// }


			// `node.type !== "INSTANCE"` must stop when get to an instance because...?
			if ((componentNode.children?.length > 0) && node.type !== "INSTANCE") {
				return getInstanceCounterpart2(instance.children[nodeIndex], node, componentNode.children[nodeIndex], coordinates[a])
			}
			else {
				return componentNode
			}
		}
	}
	else {
		return componentNode
	}
	// }
	// else {
	// 	return false
	// }

}

function findTopInstance(node) {
	if (node.type === "PAGE") return null
	if (isPartOfInstance(node)) {
		return findTopInstance(node.parent)
	} else {
		return node
	}
}

function getParentInstances(node, instances = []) {
	if (node.type === "PAGE") return null
	if (node.type === "INSTANCE") {
		instances.push(node)
	}
	if (isPartOfInstance(node)) {
		return getParentInstances(node.parent, instances)
	} else {
		return instances
	}
}

function getInstanceCounterpart(node) {

	if (isPartOfInstance(node)) {
		var child = figma.getNodeById(node.id.split(';').slice(-1)[0])
		return child
	}

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

function getOverrides(node, prop?) {

	if (isPartOfInstance(node)) {
		var componentNode = getInstanceCounterpart(node)

		var properties = nodeToObject(node)
		var overriddenProps = {}

		if (prop) {
			if (prop !== "key"
				&& prop !== "mainComponent"
				&& prop !== "absoluteTransform"
				&& prop !== "type"
				&& prop !== "id"
				&& prop !== "parent"
				&& prop !== "children"
				&& prop !== "masterComponent"
				&& prop !== "mainComponent"
				&& prop !== "horizontalPadding"
				&& prop !== "verticalPadding"
				&& prop !== "reactions"
				&& prop !== "overlayPositionType"
				&& prop !== "overflowDirection"
				&& prop !== "numberOfFixedChildren"
				&& prop !== "overlayBackground"
				&& prop !== "overlayBackgroundInteraction"
				&& prop !== "remote"
				&& prop !== "defaultVariant"
				&& prop !== "hasMissingFont"
				&& prop !== "exportSettings") {

				if (JSON.stringify(node[prop]) !== JSON.stringify(componentNode[prop])) {
					return node[prop]
				}
			}
		} else {
			for (let [key, value] of Object.entries(properties)) {
				if (key !== "key"
					&& key !== "mainComponent"
					&& key !== "absoluteTransform"
					&& key !== "type"
					&& key !== "id"
					&& key !== "parent"
					&& key !== "children"
					&& key !== "masterComponent"
					&& key !== "mainComponent"
					&& key !== "horizontalPadding"
					&& key !== "verticalPadding"
					&& key !== "reactions"
					&& key !== "overlayPositionType"
					&& key !== "overflowDirection"
					&& key !== "numberOfFixedChildren"
					&& key !== "overlayBackground"
					&& key !== "overlayBackgroundInteraction"
					&& key !== "remote"
					&& key !== "defaultVariant"
					&& key !== "hasMissingFont"
					&& key !== "exportSettings") {

					if (JSON.stringify(properties[key]) !== JSON.stringify(componentNode[key])) {
						overriddenProps[key] = value
					}
				}
			}

			if (JSON.stringify(overriddenProps) === "{}") {
				return false
			}
			else {
				return overriddenProps
			}
		}
	}
}

// TODO: Check for properties that can't be set on instances or nodes inside instances
// TODO: walkNodes and string API could be improved
// TODO: Fix mirror hangding null in vectors
// TODO: Some issues with auto layout, grow 1. These need to be applied to children after all children have been created.
// TODO: How to check for missing fonts
// TODO: Add support for images
// TODO: Find a way to handle exponential numbers better

var fonts
var allComponents = []
var discardNodes = []

var styles = {}


function main(opts?) {

	function sendToUI(msg) {
		figma.ui.postMessage(msg)
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
				// function nodeExistsInSel(nodes = figma.currentPage.selection) {
				// 	for (var i = 0; i < nodes.length; i++) {
				// 		var sourceNode = nodes[i]
				// 		if (sourceNode.id === node.id) {
				// 			return true
				// 		}
				// 		else if (sourceNode.children) {
				// 			return nodeExistsInSel(sourceNode.children)
				// 		}
				// 	}
				// }

				// console.log(node.name, node.id, node.type, nodeExistsInSel())

				if (node.type === "PAGE") {
					result.push('figma.currentPage')
				}
				else {
					// If node is nested inside an instance it needs another reference
					// if (isPartOfInstance(node)) {
					// 	result.push(`figma.getNodeById("I" + ${Ref(node.parent)}.id + ";" + ${Ref(node.parent.mainComponent.children[getNodeIndex(node)])}.id)`)
					// }
					// else {
					result.push(v.camelCase(node.type) + "_" + node.id.replace(/\:|\;/g, "_"))
					// }
				}

			}

			if (result.length === 1) result = result[0]
		}


		return result

	}


	function StyleRef(style) {
		return v.lowerCase(style.name.replace(/\s|\//g, "_").replace(/\./g, "")) + "_" + style.key.slice(-4)
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
			if (node.type === "COMPONENT" && node.parent == null) {
				console.log(node.type)
				// FIXME: Don't create a clone becuase this will give it a diffrent id. Instead add it to the page so it can be picked up? Need to then remove it again to clean up the document? Might be better to see where this parent is used and subsitute with `figma.currentPage`
				figma.currentPage.appendChild(node)
				// node = node.clone()
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

	function isInstanceDefaultVariant(node) {
		var isInstanceDefaultVariant = true
		var componentSet = node.mainComponent.parent

		if (componentSet !== null && componentSet.type === "COMPONENT_SET") {
			var defaultVariant = componentSet.defaultVariant

			if (defaultVariant && defaultVariant.id !== node.mainComponent.id) {
				isInstanceDefaultVariant = false
			}

		}

		return isInstanceDefaultVariant
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
				&& name !== "defaultVariant"
				&& name !== "hasMissingFont"
				&& name !== "exportSettings"
				&& name !== "variantProperties"
				&& name !== "variantGroupProperties") {

				// TODO: ^ Add some of these exclusions to nodeToObject()

				var overriddenProp = true;
				var counterSizingIsFixed = false;
				var primarySizingIsFixed = false;
				var shouldResizeWidth = false;
				var shouldResizeHeight = false;

				if (node.type === "INSTANCE" && !isNestedInstance(node)) {
					overriddenProp = JSON.stringify(node[name]) !== JSON.stringify(mainComponent[name])
				}

				if (node.type === "INSTANCE") {
					if (node.width !== node.mainComponent?.width) {
						if (node.primaryAxisSizingMode === "FIXED") {
							shouldResizeWidth = true
						}
					}

					if (node.height !== node.mainComponent?.height) {
						if (node.counterAxisSizingMode === "FIXED") {
							shouldResizeHeight = true
						}
					}
				}
				else {
					shouldResizeHeight = true
					shouldResizeWidth = true
				}

				// Applies property overrides of instances (currently only activates characters)
				if (isPartOfInstance(node)) {
					var parentInstance = findParentInstance(node)
					// var depthOfNode = getNodeDepth(node, parentInstance)

					if (getOverrides(node, name)) {

					}
					else {
						overriddenProp = false
					}


				}

				if (overriddenProp) {

					// Can't override certain properties on nodes which are part of instance
					if (!(isPartOfInstance(node)
						&& (name === 'x'
						|| name === 'y'
						|| name === 'relativeTransform'))) {

						// Add resize

						if (options?.resize !== false) {

							// FIXME: This is being ignored when default of node is true for width, but not for height
							if ((name === "width" || name === "height") && hasWidthOrHeight) {
								hasWidthOrHeight = false

								// This checks if the instance is set to fixed sizing, if so it checks if it's different from the main component to determine if it should be resized
								if (shouldResizeHeight || shouldResizeWidth) {
									// Round widths/heights less than 0.001 to 0.01 because API does not accept less than 0.01 for frames/components/component sets
									// Need to round super high relative transform numbers
									var width = node.width.toFixed(10)
									var height = node.height.toFixed(10)

									if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && node.width < 0.01) width = 0.01
									if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && node.height < 0.01) height = 0.01


									if (node.type === "FRAME" && node.width < 0.01 || node.height < 0.01) {
										string += `${Ref(node)}.resizeWithoutConstraints(${width}, ${height})\n`
									}
									else {
										string += `${Ref(node)}.resize(${width}, ${height})\n`
									}

									// Need to check for sizing property first because not all nodes have this property eg TEXT, LINE, RECTANGLE
									// This is to reset the sizing of either the width of height because it has been overriden by the resize method
									if (node.primaryAxisSizingMode && node.primaryAxisSizingMode !== "FIXED") {
										string += `${Ref(node)}.primaryAxisSizingMode = ${JSON.stringify(node.primaryAxisSizingMode)}\n`
									}

									if (node.counterAxisSizingMode && node.counterAxisSizingMode !== "FIXED") {
										string += `${Ref(node)}.counterAxisSizingMode = ${JSON.stringify(node.counterAxisSizingMode)}\n`
									}
									

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

							// FIXME: Need a less messy way to do this on all numbers
							// Need to round super high relative transform numbers
							if (name === "relativeTransform") {
								var newValue = [
									[
										0,
										0,
										0
									],
									[
										0,
										0,
										0
									]
								]
								newValue[0][0] = +value[0][0].toFixed(10)
								newValue[0][1] = +value[0][1].toFixed(10)
								newValue[0][2] = +value[0][2].toFixed(10)

								newValue[1][0] = +value[1][0].toFixed(10)
								newValue[1][1] = +value[1][1].toFixed(10)
								newValue[1][2] = +value[1][2].toFixed(10)

								value = newValue

							}
							if (options?.[name] !== false) {
								staticPropsStr += `${Ref(node)}.${name} = ${JSON.stringify(value)}\n`
							}

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

		// TODO: Need to create another function for lifecylce of any node and add this to bottom
		if (opts?.includeObject) {
			string += `obj.${Ref(node)} = ${Ref(node)}\n`
		}
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

	function createBasic(node, options = {}) {

		if (node.type === "COMPONENT") {
			if (allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
				return true
			}
		}

		if (node.type !== "GROUP"
			&& node.type !== "INSTANCE"
			&& node.type !== "COMPONENT_SET"
			&& node.type !== "BOOLEAN_OPERATION"
			&& !isPartOfInstance(node)) {

			// console.log(!isPartOfComponent(node), node)

			// TODO: Need to find a way to prevent objects being created for components that have already created by instances
			// TODO: Tidy below, its a bit of a mess
			// If it's anything but a component then create the object
			if (node.type !== "COMPONENT") {
				// This prevents objects from being looped if component already generated
				if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {

					str`

			// Create ${node.type}
var ${Ref(node)} = figma.create${v.titleCase(node.type)}()\n`

					createProps(node)



					appendNode(node)


					allComponents.push(node)

				}
			} else {
				// If it's a component first check if it's been added to the list before creating, if not then create it and add it to the list (only creates frame)

				// if (node.type === "COMPONENT") {

				if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
					str`
				
				// Create ${node.type}
var ${Ref(node)} = figma.create${v.titleCase(node.type)}()\n`
					createProps(node)

					if (options?.append !== false) {
						appendNode(node)
					}


					allComponents.push(node)
				}
				// }
			}



		}

		// Create overides for nodes inside instances
		// TODO: Only create reference if there are overrides
		if (getOverrides(node)) {
			if (isPartOfInstance(node)) {

				// This dynamically creates the reference to nodes nested inside instances. I consists of two parts. The first is the id of the parent instance. The second part is the id of the current instance counterpart node.
				var childRef = ""
				if (getNodeDepth(node, findParentInstance(node)) > 0) {

					// console.log("----")
					// console.log("instanceNode", node)
					// console.log("counterpart", getInstanceCounterpart(node))
					// console.log("nodeDepth", getNodeDepth(node, findParentInstance(node)))
					// console.log("instanceParent", findParentInstance(node))
					childRef = ` + ";" + ${Ref(getInstanceCounterpart(node))}.id`
				}

				var letterI = `"I" +`


				if (findParentInstance(node).id.startsWith("I")) {
					letterI = ``
				}

				str`

		// Apply INSTANCE OVERRIDES
		var ${Ref(node)} = figma.getNodeById(${letterI} ${Ref(findParentInstance(node))}.id${childRef})\n`

				createProps(node)
			}
		}


		// Swap instances if different from default variant
		if (node.type === "INSTANCE") {
			// Swap if not the default variant
			if (!isInstanceDefaultVariant(node)) {

				var instanceRef = ""

				// NOTE: Cannot use node ref when instance/node nested inside instance because not created by plugin. Must use an alternative method to identify instance to swap. Cannot use getNodeById unless you know what the node id will be. So what we do here, is dynamically lookup the id by combining the dynamic ids of several node references. This might need to work for more than one level of instances nested inside an instance.
				// if (isNestedInstance(node)) {
				// 	instanceRef = `\nvar ${Ref(node)} = figma.getNodeById("I" + ${Ref(node.parent)}.id + ";" + ${Ref(node.parent.mainComponent.children[getNodeIndex(node)])}.id)`
				// }

				str`// Swap COMPONENT
				${Ref(node)}.swapComponent(${Ref(node.mainComponent)})\n`
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
			// FIXME: This checks if component is missing from canvas but its actually still stored in cache and so when it's cloned it's creating a brand new component. It needs to avoid doing this and instead just add the component to the list to be created.
			if (node.mainComponent.parent === null || !node.mainComponent) {
				// Create the component
				var temp = node.mainComponent
				mainComponent = temp
				// Add to nodes to discard at end
				discardNodes.push(temp)
			}
		}


		if (node.type === "INSTANCE" && !isNestedInstance(node)) {

			// If main component not selected by user
			if (!allComponents.includes(mainComponent)) {
				createNode(mainComponent, { append: false })
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
			createProps(node, { resize: false, relativeTransform: false, x: false, y: false, rotation: false })
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

	function genOverrides(node) {
		// console.log("parentInstance", findParentInstance(node))
	}

	function createNode(nodes, options) {
		nodes = putValuesIntoArray(nodes)
		walkNodes(nodes, {
			during(node, { ref, level, sel, parent }) {
				createInstance(node)
				// genOverrides(node)
				return createBasic(node, options)
			},
			after(node, { ref, level, sel, parent }) {
				createGroup(node)
				createBooleanOperation(node)
				createComponentSet(node)
			}
		})
	}



	figma.showUI(__html__, { width: 320, height: 480 });

	var selection = figma.currentPage.selection

	// for (var i = 0; i < selection.length; i++) {
	createNode(selection)
	// }

	if (opts?.wrapInFunction) {
		// Wrap in function
		str.prepend`
	// Wrap in function
	function createNodes() {
		const obj : any = {}
	`
	}

	if (opts?.includeObject) {
		str.prepend`
		const obj : any = {}
	`
	}


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

	if (opts?.wrapInFunction) {
		// Wrap in function
		str`
		return obj
	}
	`
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
