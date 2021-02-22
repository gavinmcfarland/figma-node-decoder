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