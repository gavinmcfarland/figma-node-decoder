// TODO: embed this into walk functions to reduce computational effort
export function isNestedInstance(node) {
	if (node.type === "PAGE") return false

	if (node.parent?.type === "INSTANCE") {
		return true
	}
	else {
		return isNestedInstance(node.parent)
	}

}

function convertArrayToObject(array, value = undefined) {
	return array.reduce(function (obj, name) {
		obj[name] = value;
		return obj;
	}, {})
}

// Doesn't work because the component has already been added to the component list by the time the walker gets to the children nodes
export function isInsideComponentThatAlreadyExists(node, allComponents) {
	if (node.type === "PAGE") return false

	if (allComponents.some((component) => JSON.stringify(component) === JSON.stringify(node.parent))) {
		return true
	}
	else {
		return isInsideComponentThatAlreadyExists(node.parent, allComponents)
	}


}

export function isTopLevelInstance(node) {
	if (node !== null) {
		if (isNestedInstance(node.parent)) {
			return true
		}
		else {
			return false
		}
	}
}

export function isNestedComponentSet(node) {
	if (node !== null) {
		if (node.type === "COMPONENT_SET") {
			return true
		}
		else if (node.type === "PAGE") {
			return false
		}
		else {
			return isNestedComponentSet(node.parent)
		}
	}
}

export function putValuesIntoArray(value) {
	return Array.isArray(value) ? value : [value]
}

function isFunction(functionToCheck) {
	return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

const nodeProps: string[] = [
	'id',
	'parent',
	'name',
	'removed',
	'visible',
	'locked',
	'children',
	'constraints',
	'absoluteTransform',
	'relativeTransform',
	'x',
	'y',
	'rotation',
	'width',
	'height',
	'constrainProportions',
	'layoutAlign',
	'layoutGrow',
	'opacity',
	'blendMode',
	'isMask',
	'effects',
	'effectStyleId',
	'expanded',
	'backgrounds',
	'backgroundStyleId',
	'fills',
	'strokes',
	'strokeWeight',
	'strokeMiterLimit',
	'strokeAlign',
	'strokeCap',
	'strokeJoin',
	'dashPattern',
	'fillStyleId',
	'strokeStyleId',
	'cornerRadius',
	'cornerSmoothing',
	'topLeftRadius',
	'topRightRadius',
	'bottomLeftRadius',
	'bottomRightRadius',
	'exportSettings',
	'overflowDirection',
	'numberOfFixedChildren',
	'overlayPositionType',
	'overlayBackground',
	'overlayBackgroundInteraction',
	'reactions',
	'description',
	'remote',
	'key',
	'layoutMode',
	'primaryAxisSizingMode',
	'counterAxisSizingMode',
	'primaryAxisAlignItems',
	'counterAxisAlignItems',
	'paddingLeft',
	'paddingRight',
	'paddingTop',
	'paddingBottom',
	'itemSpacing',
	// 'horizontalPadding',
	// 'verticalPadding',
	'layoutGrids',
	'gridStyleId',
	'clipsContent',
	'guides'
]

const readOnly: string[] = [
	'id',
	'parent',
	'removed',
	'children',
	'absoluteTransform',
	'width',
	'height',
	'overlayPositionType',
	'overlayBackground',
	'overlayBackgroundInteraction',
	'reactions',
	'remote',
	'key',
	'type'
]

const instanceProps: string[] = [
	'rotation',
	'constrainProportions'
]

const defaults: string[] = [
	'name',
	'guides',
	'description',
	'remote',
	'key',
	'reactions',
	'x',
	'y',
	'exportSettings',
	'expanded',
	'isMask',
	'exportSettings',
	'overflowDirection',
	'numberOfFixedChildren',
	'constraints',
	'relativeTransform'
]

const mixedProp = {
	cornerRadius: [
		'topleftCornerRadius',
		'topRightCornerRadius',
		'bottomLeftCornerRadius',
		'bottomRightCornerRadius']
}

function applyMixedValues(node, prop) {


	const obj = {};

	if (mixedProp[prop] && node[prop] === figma.mixed) {
		for (let prop of mixedProp[prop]) {
			obj[prop] = source[prop]
		}
	} else {
		obj[prop] = node[prop]
	}
}


export const nodeToObject = (node: any, withoutRelations?: boolean, removeConflicts?: boolean) => {
	const props = Object.entries(Object.getOwnPropertyDescriptors(node.__proto__))
	const blacklist = ['parent', 'children', 'removed', 'masterComponent']
	const obj: any = { id: node.id, type: node.type }
	for (const [name, prop] of props) {
		if (prop.get && !blacklist.includes(name)) {
			try {
				if (typeof obj[name] === 'symbol') {
					obj[name] = 'Mixed'
				} else {
					obj[name] = prop.get.call(node)
				}
			} catch (err) {
				obj[name] = undefined
			}
		}
	}
	if (node.parent && !withoutRelations) {
		obj.parent = { id: node.parent.id, type: node.parent.type }
	}
	if (node.children && !withoutRelations) {
		obj.children = node.children.map((child: any) => nodeToObject(child, withoutRelations))
	}
	if (node.masterComponent && !withoutRelations) {
		obj.masterComponent = nodeToObject(node.masterComponent, withoutRelations)
	}

	if (!removeConflicts) {
		!obj.fillStyleId && obj.fills ? delete obj.fillStyleId : delete obj.fills
		!obj.strokeStyleId && obj.strokes ? delete obj.strokeStyleId : delete obj.strokes
		!obj.backgroundStyleId && obj.backgrounds ? delete obj.backgroundStyleId : delete obj.backgrounds
		!obj.effectStyleId && obj.effects ? delete obj.effectStyleId : delete obj.effects

		if (obj.cornerRadius !== figma.mixed) {
			delete obj.topLeftRadius
			delete obj.topRightRadius
			delete obj.bottomLeftRadius
			delete obj.bottomRightRadius
		}
		else {
			delete obj.cornerRadius
		}
	}

	return obj
}