import { genPluginStr } from '../src/pluginGeneration'

export async function encodeAsync(array) {

	// return nodeToObject(node)

	return await genPluginStr(array, {wrapInFunction: true})

}

export async function decodeAsync(string) {
	return eval(string)
}
