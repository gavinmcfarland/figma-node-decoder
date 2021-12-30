# Readme

This is a proof of concept to adapt the Node Decoder plugin for use as a library within Figma plugins.

For now, to test it, install it from Github as a node module.

```bash
npm install --save-dev https://github.com/limitlessloop/figma-node-decoder/tarball/javascript-api
```

Import in your plugin

```js
// code.ts
import { encodeAsync, decodeAsync } from 'figma-node-decoder'
```

To encode a node

```js
// Pass nodes as an array
encodeAsync(figma.currentPage.selection).then((string) => {

    // Store it somewhere
    figma.root.setPluginData("nodeAsString", string)
})
```

To decode

```js
// Grab the string
let nodeAsString = figma.root.getPluginData("nodeAsString")

console.log(nodeAsString)

// Recreate the node from string
decodeAsync(nodeAsString).then(() => {
	figma.closePlugin("recreated node")
})
```