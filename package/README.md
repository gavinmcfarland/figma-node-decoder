# Readme

This is a proof of concept to adapt the Node Decoder plugin for use as a library within Figma plugins.

For now, to test it, install it from Github as a npm.

```
npm install --save-dev https://github.com/limitlessloop/figma-node-decoder/tarball/javascript-api
```

Import in your plugin

```js
// code.ts
import { encodeAsync, decodeAsync } from 'figma-node-decoder'
```

To encode a node

```js
var node = figma.createFrame()

// Pass nodes as an array
encodeAsync([node]).then((string) => {

    // Store it somewhere
    figma.root.setPluginData("nodeAsString", string)
}
```

To decode a node

```js
// Grab the string
let nodeAsString = figma.root.getPluginData("nodeAsString")

// Recreate the node from string
decodeAsync(nodeAsString).then(() => {
	figma.closePlugin()
})
```