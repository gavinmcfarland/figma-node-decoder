import { genPluginStr } from "../src/pluginGeneration";
import { genWidgetStr } from "../src/widgetGeneration";

export async function encodeAsync(array, options?) {
	if (options.platform === "PLUGIN" || options.platform === "plugin") {
		return await (
			await genPluginStr(array, {
				wrapInFunction: true,
				includeObject: true,
			})
		).join("");
	}
	if (options.platform === "WIDGET" || options.platform === "widget") {
		return await genWidgetStr(array);
	}
}

export async function decodeAsync(string, options?) {
	return {
		nodes: await eval(string),
	};
}
