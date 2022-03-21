import v from 'voca'
import Str from './str'
import { getInstanceCounterpart, getTopInstance, getInstanceCounterpartUsingLocation, getOverrides, getNodeDepth, getParentInstance, getNoneGroupParent, isInsideInstance } from '@fignite/helpers'
import { putValuesIntoArray, nodeToObject } from './helpers'
import { defaultPropValues, textProps, styleProps } from './props'

// TODO: Check for properties that can't be set on instances or nodes inside instances
// TODO: walkNodes and string API could be improved
// TODO: Fix mirror hangding null in vectors
// TODO: Some issues with auto layout, grow 1. These need to be applied to children after all children have been created.
// TODO: How to check for missing fonts
// TODO: Add support for images
// TODO: Find a way to handle exponential numbers better

// function getParentInstances(node, instances = []) {
// 	const parent = node.parent
// 	if (node.type === "PAGE") return null
// 	if (parent.type === "INSTANCE") {
// 		instances.push(parent)
// 	}
// 	if (isInsideInstance(node)) {
// 		return getParentInstances(node.parent, instances)
// 	} else {
// 		return instances
// 	}
// }

function getParentInstances(node, instances = []) {
	if (node.type === "PAGE") return null
	if (node.parent.type === "INSTANCE") {
		instances.push(node.parent)
	}
	if (isInsideInstance(node)) {
		return getParentInstances(node.parent, instances)
	} else {
		return instances
	}
}

function getParentComponents(node, instances = []) {
	if (node.type === "PAGE") return null
	if (node.parent.type === "INSTANCE") {
		instances.push(node.parent.mainComponent)
	}
	if (isInsideInstance(node)) {
		return getParentInstances(node.parent, instances)
	} else {
		return instances
	}
}

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

function toArrayBuffer(buf) {
	var ab = new ArrayBuffer(buf.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buf.length; ++i) {
		view[i] = buf[i];
	}
	console.log(ab)
	return ab;
}

function toBuffer(ab) {
	var buf = Buffer.alloc(ab.byteLength);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buf.length; ++i) {
		buf[i] = view[i];
	}
	console.log(buf)
	return buf;
}

// FIXME: vectorNetwork and vectorPath cannot be over ridden on an instance

function simpleClone(val) {
	return JSON.parse(JSON.stringify(val))
}

export async function genPluginStr(origSel, opts?) {

        var str = new Str()

        var fonts
        var allComponents = []
        var discardNodes = []

	var styles = {}
	var images = []
        // console.log(styles)

        // Provides a reference for the node when printed as a string
        function Ref(nodes) {


            var result = []

                // TODO: Needs to somehow replace parent node references of selection with figma.currentPage
                // result.push(v.camelCase(node.type) + node.id.replace(/\:|\;/g, "_"))

                nodes = putValuesIntoArray(nodes)

                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i]

					// console.log("node", node)

					if (node) {

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
							// if (isInsideInstance(node)) {
							// 	result.push(`figma.getNodeById("I" + ${Ref(node.parent)}.id + ";" + ${Ref(node.parent.mainComponent.children[getNodeIndex(node)])}.id)`)
							// }
							// else {
							// result.push(v.camelCase(node.type) + "_" + node.id.replace(/\:|\;/g, "_") + "_" + node.name.replace(/\:|\;|\/|=/g, "_"))
							result.push(v.camelCase(node.type) + "_" + node.id.replace(/\:|\;/g, "_"))
							// }
						}

					}

                }

                if (result.length === 1) result = result[0]



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

                // console.log(node.type)
                // If main component doesn't exist in document then add it to list to be created
                // Don't think this does anything
                // if (node.type === "COMPONENT" && node.parent === null) {
                //     // console.log(node.type, node.mainComponent, node.name, node)
                //     // FIXME: Don't create a clone becuase this will give it a diffrent id. Instead add it to the page so it can be picked up? Need to then remove it again to clean up the document? Might be better to see where this parent is used and subsitute with `figma.currentPage`
                //     // console.log(node.name)


                //     // If component can't be added to page, then it is from an external library
                //     // Why am I adding it to the page again?
                //     try {
                //         // figma.currentPage.appendChild(node)
                //     }
                //     catch (error) {
                //         // node = node.clone()
                //     }


                //     // discardNodes.push(node)
                // }

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
					// console.log("sibling node", node)
                    // If boolean value of true returned from createBasic() then this sets a flag to stop iterating children in node
					// console.log("node being traversed", node)

                    stop = callback.during(node, obj)
                }

                if (node.children) {
					++level

                    if (stop && nodes[i + 1]) {
                        // Iterate the next node
                        // ++i

                        walkNodes([nodes[i + 1]], callback, ref, selection, level)
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

		if (node.type === "INSTANCE") {
			var isInstanceDefaultVariant = true
			var componentSet = node.mainComponent.parent
			if (componentSet) {
				if (componentSet.type === "COMPONENT_SET") {
					if (componentSet !== null && componentSet.type === "COMPONENT_SET") {
						var defaultVariant = componentSet.defaultVariant

						if (defaultVariant && defaultVariant.id !== node.mainComponent.id) {
							isInstanceDefaultVariant = false
						}

					}

					return isInstanceDefaultVariant
				}
			}
			else {
				return false
			}

		}
		else {
			// Returns true because is not an instance and therefor should pass
			// TODO: Consider changing function to hasComponentBeenSwapped or something similar
			return true
		}

	}

	function componentHasBeenSwapped(node) {

		if (node.type === "INSTANCE") {
			if (node.mainComponent.parent) {
				if (node.mainComponent.parent.type === "COMPONENT_SET") {
					var componentBeenSwapped = false
					var componentSet = node.mainComponent.parent
					if (componentSet !== null && componentSet.type === "COMPONENT_SET") {
						var defaultVariant = componentSet.defaultVariant

						if (defaultVariant && defaultVariant.id !== node.mainComponent.id) {
							componentBeenSwapped = true
						}

					}

					return componentBeenSwapped
				}

			}
		}

	}

	function collectImageHash(node) {
		if ('fills' in node) {
			for (var i = 0; i < node.fills.length; i++) {
				var fill = node.fills[i]
				if (fill.type === "IMAGE") {
					images.push(fill.imageHash)
				}
			}
		}
	}

	function replaceImageHasWithRef(node) {
		if ('fills' in node) {
			var fills = simpleClone(node.fills)
			for (var i = 0; i < fills.length; i++) {
				var fill = fills[i]
				if (fill.type === "IMAGE") {
					images.push({ imageHash: fill.imageHash, node })
					fill.imageHash = `${Ref(node)}_image.imageHash`
				}
			}
			return fills
		}
	}

	// async function createImageHash(node) {
	// 	if ('fills' in node) {
	// 		for (var i = 0; i < node.fills.length; i++) {
	// 			var fill = node.fills[i]
	// 			if (fill.type === "IMAGE") {
	// 				// figma.getImageByHash(fill.imageHash).getBytesAsync().then((image) => {
	// 				// 	str`
	// 				// 	// Create IMAGE HASH
	// 				// 	var ${Ref(node)}_image_hash = ${image}\n
	// 				// `
	// 				// })

	// 				return figma.getImageByHash(fill.imageHash).getBytesAsync()
	// 			}
	// 		}
	// 	}
	// }

	// createImageHash(node).then((image) => {
	// 	str`
	// 				// 	// Create IMAGE HASH
	// 				// 	var ${Ref(node)}_image_hash = ${image}\n
	// 				// `


	// })

	function createProps(node, level, options = {}, mainComponent?) {




            var string = ""
            var staticPropsStr = ""
            var textPropsString = ""
            var fontsString = ""
            var hasText;
			var hasWidthOrHeight = true;

			// collectImageHash(node)


				var object = node.__proto__ ? nodeToObject(node) : node

                for (let [name, value] of Object.entries(object)) {

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
						&& name !== "variantGroupProperties"
						&& name !== "absoluteRenderBounds"
						&& name !== "fillGeometry"
						&& name !== "strokeGeometry"
						&& name !== "backgrounds"
						&& !((isInsideInstance(node) || node.type === "INSTANCE") && name === "vectorNetwork")
						&& !((isInsideInstance(node) || node.type === "INSTANCE") && name === "vectorPaths")) {

                        // TODO: ^ Add some of these exclusions to nodeToObject()

                        var overriddenProp = true;
                        var counterSizingIsFixed = false;
                        var primarySizingIsFixed = false;
                        var shouldResizeWidth = false;
                        var shouldResizeHeight = false;

                        if (node.type === "INSTANCE" && !isInsideInstance(node)) {
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
                        if (isInsideInstance(node)) {
                            var parentInstance = getParentInstance(node)
                            // var depthOfNode = getNodeDepth(node, parentInstance)

                            // Add these exclusions to getOverrides helper
                            // if (!('horizontalPadding' in node) || !('verticalPadding' in node)) {




                                if (typeof getOverrides(node, name) !== 'undefined') {

                                }
                                else {
                                    overriddenProp = false
                                }
                            // }


                        }

                        if (overriddenProp) {

                            // Can't override certain properties on nodes which are part of instance
                            if (!(isInsideInstance(node)
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

                                            // FIXME: Should this apply to all nodes types?
                                            if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "RECTANGLE" || node.type === "INSTANCE") && node.width < 0.01) width = 0.01
                                            if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "RECTANGLE" || node.type === "INSTANCE") && node.height < 0.01) height = 0.01


                                            if (node.type === "FRAME" && node.width < 0.01 || node.height < 0.01) {
                                                string += `	${Ref(node)}.resizeWithoutConstraints(${width}, ${height})\n`
                                            }
                                            else {
                                                string += `	${Ref(node)}.resize(${width}, ${height})\n`
                                            }

                                            // Need to check for sizing property first because not all nodes have this property eg TEXT, LINE, RECTANGLE
                                            // This is to reset the sizing of either the width of height because it has been overriden by the resize method
                                            if (node.primaryAxisSizingMode && node.primaryAxisSizingMode !== "FIXED") {
                                                string += `	${Ref(node)}.primaryAxisSizingMode = ${JSON.stringify(node.primaryAxisSizingMode)}\n`
                                            }

                                            if (node.counterAxisSizingMode && node.counterAxisSizingMode !== "FIXED") {
                                                string += `	${Ref(node)}.counterAxisSizingMode = ${JSON.stringify(node.counterAxisSizingMode)}\n`
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
                                        string += `	${Ref(node)}.${name} = ${StyleRef(style)}.id\n`
                                    }

                                }

                                // If text prop
                                if (textProps.includes(name)) {
                                    if (name === "textStyleId") {
                                        textPropsString += `	${Ref(node)}.${name} = ${StyleRef(style)}.id\n`
                                    } else {
                                        textPropsString += `	${Ref(node)}.${name} = ${JSON.stringify(value)}\n`
                                    }
                                }

                                // If a text node
                                if (name === "characters") {
                                    hasText = true
                                    fonts = fonts || []
                                    if (!fonts.some((item) => JSON.stringify(item) === JSON.stringify(node.fontName))) {
                                        fonts.push(node.fontName)
                                    }

									if (node.fontName) {
										fontsString += `\
	${Ref(node)}.fontName = {
		family: ${JSON.stringify(node.fontName?.family)},
		style: ${JSON.stringify(node.fontName?.style)}
	}`
									}

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
										// Disabled for now because I'm not sure how to programmatically add images. I think might have to include function to convert bytes to array
										// if (name === "fills") {
										// 	var newValueX = JSON.stringify(replaceImageHasWithRef(node))

										// 	staticPropsStr += `${Ref(node)}.fills = ${newValueX}\n`
										// }
										// else {
											staticPropsStr += `	${Ref(node)}.${name} = ${JSON.stringify(value)}\n`
										// }

                                    }

                                }
                            }

                        }

                    }
                }


            var loadFontsString = "";

            if (hasText) {
                loadFontsString = `
	${fontsString}
	${textPropsString}`
            }

            string += `${staticPropsStr}`
            string += `	${loadFontsString}`

            // TODO: Need to create another function for lifecylce of any node and add this to bottom
            if (opts?.includeObject) {
				if (level === 0) {
					string += `nodes.push(${Ref(node)})\n`
				}
            }
            str`${string}`

        }

        function appendNode(node) {

            // If parent is a group type node then append to nearest none group parent
			if (node.parent) {
				if (node.parent?.type === "BOOLEAN_OPERATION"
					|| node.parent?.type === "GROUP") {
					str`	${Ref(getNoneGroupParent(node))}.appendChild(${Ref(node)})\n`
				}
				else if (node.parent?.type === "COMPONENT_SET") {
					// Currently set to do nothing, but should it append to something? Is there a way?
					// str`${Ref(getNoneGroupParent(node))}.appendChild(${Ref(node)})\n`
				}
				else {
					str`	${Ref(node.parent)}.appendChild(${Ref(node)})\n`
				}
			}



        }

        function createBasic(node, level, options = {}) {

            if (node.type === "COMPONENT") {
                // If node being visited matches a component already visited (ie, already created?), then set falg to true so loop stops traversing
                if (allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
                    return true
                }
			}



            if (node.type !== "GROUP"
                && node.type !== "INSTANCE"
                && node.type !== "COMPONENT_SET"
                && node.type !== "BOOLEAN_OPERATION"
                && !isInsideInstance(node)) {

                    // If it's a component first check if it's been added to the list before creating, if not then create it and add it to the list (only creates frame)

                    if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node))) {
                        str`

	// Create ${node.type}
	var ${Ref(node)} = figma.create${v.titleCase(node.type)}()\n`
                        createProps(node, level)

						if (node.type !== "COMPONENT" || options?.append !== false) {
                            appendNode(node)
                        }
						// else if (options?.append !== false) {
						// 	if (node.type !== "COMPONENT") {
						// 		appendNode(node)
						// 	}

                        // }


                        allComponents.push(node)
                    }



			}


			function createRefToInstanceNode(node) {
				// FIXME: I think this needs to include the ids of several nested instances. In order to do that, references need to be made for them even if there no overrides
				// This dynamically creates the reference to nodes nested inside instances. I consists of two parts. The first is the id of the parent instance. The second part is the id of the current instance counterpart node.


					// var childRef = ""
					// // if (getNodeDepth(node, getParentInstance(node)) > 0) {

					// 	// console.log("----")
					// 	// console.log("instanceNode", node)
					// 	// console.log("counterpart", getInstanceCounterpart(node))
					// 	// console.log("nodeDepth", getNodeDepth(node, findParentInstance(node)))
					// 	// console.log("instanceParent", findParentInstance(node))

					// 	// FIXME: In some cases counterpart is returned as undefined. I think because layer might be hidden?. Tried again with layer hidden and issue didn't happen again. Maybe a figma bug. Perhaps to workaround, unhide layer and hide again.
					// 	if (typeof getInstanceCounterpartUsingLocation(node) === 'undefined') {
					// 		console.warn("Can't get location of counterpart", node)
					// 	}
					// 	else {
					// 		childRef = ` + ";" + ${Ref(getInstanceCounterpartUsingLocation(node))}.id`
					// 	}

					// // }

					// var letterI = `"I" +`


					// if (getParentInstance(node).id.startsWith("I")) {
					// 	letterI = ``
					// }

				// TODO: Try getting all the ids of the parents
				// TODO: 1. Get all the nodes of the parent instannces
				//       2. Output the id
				//       3. output the id of the original component

				var letterI = `"I" + `


				if (getParentInstance(node).id.startsWith("I")) {
					letterI = ``
				}

				// // Does it only need the top instance?
				// var parentInstances = getParentInstances(node)
				// var string = ""
				// if (parentInstances) {
				// 	// parentInstances.shift()
				// 	console.log(parentInstances)
				// 	var array = []
				// 	for (var i = 0; i < parentInstances.length; i++) {
				// 		var instance = parentInstances[i]

				// 		array.push(`${Ref(instance)}.id`)
				// 	}

				// 	string = array.join(` + ";" + `)
				// }

				var child = `${Ref(getInstanceCounterpartUsingLocation(node, getParentInstance(node)))}.id`
				var ref = `${letterI}${Ref(getParentInstance(node))}.id + ";" + ${child}`
				// if (node.id === figma.currentPage.selection[0].id) {
				// 	console.log(">>>>>", figma.currentPage.selection[0].id, ref)
				// }

					// console.log(getParentInstances(node).join(";"))

					return `var ${Ref(node)} = figma.getNodeById(${ref})`


			}

            // Create overides for nodes inside instances

            // if (!('horizontalPadding' in node) || !('verticalPadding' in node)) {
                // if (getOverrides(node)) {
            if (isInsideInstance(node)) {



				// if (node.type === "INSTANCE") {
				// 	if (isInstanceDefaultVariant(node)) {
				// 		str`
				// 	// Component wasn't swapped by user
				// 	var ${Ref(node)}`
				// 	}
				// }


				str`
	// Ref to SUB NODE
	${createRefToInstanceNode(node)}\n`

                        if (getOverrides(node)) {
                            // If overrides exist apply them
                            createProps(node, level)
                        }
                    }
                // }
            // }




            // Swap instances if different from default variant
			if (node.type === "INSTANCE") {
				// console.log("node name", node.name)
                // Swap if not the default variant
				// if (!isInstanceDefaultVariant(node)) {
					// console.log("node name swapped", node.name)



                    // NOTE: Cannot use node ref when instance/node nested inside instance because not created by plugin. Must use an alternative method to identify instance to swap. Cannot use getNodeById unless you know what the node id will be. So what we do here, is dynamically lookup the id by combining the dynamic ids of several node references. This might need to work for more than one level of instances nested inside an instance.
					// if (isInsideInstance(node)) {
					// 	str`
					// // Swap COMPONENT
					// 	${createRefToInstanceNode(node)}\n`
					// }
					// if (node.id === figma.currentPage.selection[0].id) {
					// 	console.log(">>>>>", " has been swapped")
					// }

				// NOTE: Decided to always swap the component because can't know if it's correct or not.
				str`

				// Swap COMPONENT
				${Ref(node)}.swapComponent(${Ref(node.mainComponent)})\n`



                // }

            }

        }

        function createInstance(node, level) {

			var mainComponent;



            if (node.type === "INSTANCE") {
                mainComponent = node.mainComponent
			}

			// console.log("node", node.type, node.mainComponent)

            if (node.type === "INSTANCE") {

                // If main component not selected by user
                // Grab all components and add to list
                // If main component of instance not already visited, ie (selected by the user), then create it and it's children

                if (!allComponents.includes(mainComponent)) {
                    createNode(mainComponent, { append: false })
                }

			}


            if (node.type === "INSTANCE" && !isInsideInstance(node)) {

				str`

	// Create INSTANCE
	var ${Ref(node)} = ${Ref(mainComponent)}.createInstance()\n`


                // Need to reference main component so that createProps can check if props are overriden
                createProps(node, level, {}, mainComponent)

                appendNode(node)
            }



            // Once component has been created add it to array of all components
            if (node.type === "INSTANCE") {
                if (!allComponents.some((component) => JSON.stringify(component) === JSON.stringify(mainComponent))) {
                    allComponents.push(mainComponent)
                }
			}


        }

        function createGroup(node, level) {
            if (node.type === "GROUP" && !isInsideInstance(node)) {
                var children: any = Ref(node.children)
                if (Array.isArray(children)) {
                    children = Ref(node.children).join(', ')
                }
                var parent
                if (node.parent?.type === "GROUP"
                    || node.parent?.type === "COMPONENT_SET"
                    || node.parent?.type === "BOOLEAN_OPERATION") {

                    parent = `${Ref(getNoneGroupParent(node))}`
                    // parent = `figma.currentPage`
                }
                else {
                    parent = `${Ref(node.parent)}`
                }
                str`

	// Create GROUP
	var ${Ref(node)} = figma.group([${children}], ${parent})\n`
                createProps(node, level, { resize: false, relativeTransform: false, x: false, y: false, rotation: false })
            }
        }

        function createBooleanOperation(node, level) {
            // Boolean can not be created if inside instance
            // TODO: When boolean objects are created they loose their coordinates?
            // TODO: Don't resize boolean objects
            if (node.type === "BOOLEAN_OPERATION"
                && !isInsideInstance(node)) {
                var children: any = Ref(node.children)
                if (Array.isArray(children)) {
                    children = Ref(node.children).join(', ')
                }
                var parent
                if (node.parent?.type === "GROUP"
                    || node.parent?.type === "COMPONENT_SET"
                    || node.parent?.type === "BOOLEAN_OPERATION") {
                    parent = `${Ref(getNoneGroupParent(node))}`
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
                createProps(node, level, { resize: false, relativeTransform: false, x: false, y: false, rotation: false })
            }
        }

        function createComponentSet(node, level) {
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
                    parent = `${Ref(getNoneGroupParent(node))}`
                }
                else {
                    parent = `${Ref(node.parent)}`
                }


                str`

	// Create COMPONENT_SET
	var ${Ref(node)} = figma.combineAsVariants([${children}], ${parent})\n`

                createProps(node, level)
            }
        }

        function createNode(nodes, options) {
            nodes = putValuesIntoArray(nodes)

            walkNodes(nodes, {
				during(node, { ref, level, sel, parent }) {
                    createInstance(node, level)

                    return createBasic(node, level, options)
                },
                after(node, { ref, level, sel, parent }) {
                    createGroup(node, level)
                    createBooleanOperation(node, level)
                    createComponentSet(node, level)
                }
            })
        }

	function generateImagesHash(nodes, data){
		let result = data || [];
		if (!Array.isArray(nodes)) nodes = [nodes];

		for (let i in nodes) {
			let nodeElement = nodes[i];
			if (typeof nodeElement != 'undefined') {

				// find all the images hash
				if (nodeElement.type == 'FRAME' || nodeElement.type == 'INSTANCE' || nodeElement.type == 'COMPONENT') {
					if (nodeElement.fills){
						for(let j in nodeElement.fills){
							if (nodeElement.fills[j].type == "IMAGE"){
								// Only uniq images
								if (result.indexOf(nodeElement.fills[j].imageHash) == -1)
									result.push(nodeElement.fills[j].imageHash);
							}
						}
					}
				}
				if (nodeElement.children){
					result = [...result, ...generateImagesHash(nodeElement.children)]
				}
			}
		}
		return result;
	}

	async function generateImages(arr){
		for (let i in arr){
			const image = figma.getImageByHash(arr[i]);
			let binImage = ( await image.getBytesAsync() );

			str.prepend `figma.createImage(new Uint8Array([${binImage}]));`
		}
	}

        // figma.showUI(__html__, { width: 320, height: 480 });

        var selection = origSel

        // for (var i = 0; i < selection.length; i++) {
        createNode(selection)
        // }

/*	async function generateImages() {
		var array = []
		if (images && images.length > 0) {
			for (var i = 0; i < images.length; i++) {
				var { imageHash } = images[i]

				var imageBytes = await figma.getImageByHash(imageHash).getBytesAsync()

				// Commented for now because causing syntax highlighter to crash
				array.push(`
					// Create IMAGE HASH
					// var image = figma.createImage(toBuffer(${imageBytes}))\n`)


			}
		}

		return array
	}*/

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

					styleString += `

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
				family: ${JSON.stringify(font?.family)},
				style: ${JSON.stringify(font?.style)}
				})`
		})}
		])
	}

	await loadFonts()`
	}

	// Remove nodes created for temporary purpose
	for (var i = 0; i < discardNodes.length; i++) {
		var node = discardNodes[i]
		// console.log(node)

		// Cannot remove node. Is it because it is from another file?
		// TEMP FIX: Check node exists before trying to remove

		if (figma.getNodeById(node.id) && node.parent !== null) node.remove()
	}

	if (opts?.wrapInFunction) {

		let hashes = generateImagesHash(selection);
		await generateImages(hashes)

		if (opts?.includeObject) {
			str`
	return nodes\n`
		}
		// Wrap in function
		str`
}\n
createNodes()
	`
	}

	if (opts?.wrapInFunction) {

		if (opts?.includeObject) {
            str.prepend`
	const nodes = []
	`
		}

		// Wrap in function
		str.prepend`
// Wrap in function
async function createNodes() {
`
	}

	// var imageArray = await generateImages()

	// var imageString = ""
	// if (imageArray && imageArray.length > 0) {
	// 	imageString = imageArray.join()
	// }



	return [...str().replace(/^\n|\n$/g, "").match(/(?=[\s\S])(?:.*\n?){1,8}/g)]

	// result = result.join("").replace(/^\n|\n$/g, "")
}
