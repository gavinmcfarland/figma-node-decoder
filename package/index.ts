import { genPluginStr } from '../src/pluginGeneration'

export async function encodeAsync(array, options?) {

	if (options.platform === "PLUGIN" || options.platform === "plugin") {
		return await (await genPluginStr(array, {wrapInFunction: true, includeObject: true })).join("")
	}
	if (options.platform === "WIDGET" || options.platform === "widget") {

	}
}

export async function decodeAsync(string, options?) {
	return {
		nodes: await eval(string)
	}
}
