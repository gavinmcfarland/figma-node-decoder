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

interface Options {
	include?: string[]
	exclude?: string[],
	withoutRelations?: boolean
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

const readonly: string[] = [
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

export const copyPasteProps = (source, target?, { include, exclude, withoutRelations = true }: Options = {}) => {
	const props = Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(source)))
	// const props = Object.entries(Object.assign(source, source))
	const blacklist = ['parent', 'children', 'removed', 'masterComponent', 'horizontalPadding', 'verticalPadding']
	const obj: any = Object.assign({ id: source.id, type: source.type }, source)
	for (const [name, prop] of props) {
		if (prop.get && !blacklist.includes(name)) {
			try {
				if (typeof obj[name] === 'symbol') {
					obj[name] = 'Mixed'
				} else {
					obj[name] = prop.get.call(source)
				}
			} catch (err) {
				obj[name] = undefined
			}
		}
	}
	if (source.parent && !withoutRelations) {
		obj.parent = { id: source.parent.id, source: source.parent.type }
	}
	if (source.children && !withoutRelations) {
		obj.children = source.children.map((child: any) => copyPasteProps(child, withoutRelations))
	}
	if (source.masterComponent && !withoutRelations) {
		obj.mainComponent = copyPasteProps(source.mainComponent, withoutRelations)
	}
	if (target) {
		!obj.fillStyleId && obj.fills ? null : delete obj.fills
		!obj.strokeStyleId && obj.strokes ? null : delete obj.strokes
		!obj.backgroundStyleId && obj.backgrounds ? null : delete obj.backgrounds
		!obj.effectStyleId && obj.effects ? null : delete obj.effects

		if (obj.cornerRadius !== figma.mixed) {
			delete obj.topLeftRadius
			delete obj.topRightRadius
			delete obj.bottomLeftRadius
			delete obj.bottomRightRadius
		}
		else {
			delete obj.cornerRadius
		}

		// return Object.assign(target, obj)
	}
	// else {
	// 	return obj
	// }

	console.log(obj)
	return obj
}