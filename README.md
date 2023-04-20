# Node Decoder

Node Decoder is a Figma plugin that generates plugin or widget source code from any Figma design as Javascript and JSX. This is useful for avoiding the need to code visual assets manually when developing for Figma.

https://www.figma.com/community/plugin/933372797518031971/Node-Decoder

## JavaScript API (Alpha)

To use the Node Decoder plugin in your own plugin, you can use the JavaScript API. It has been adapted so you can use it as a library inside your plugin.

**Please note**: While you can convert JSON to Figma using the functions below, the JSON needs to reference all of a node's parent relations, ie, its parent, grandparent, great-grandparent, great-great-grandparent etc. I'll provide a custom helper for this at some point.

### Getting started

For now, install it from Github as a node module.

```bash
npm install --save-dev https://github.com/limitlessloop/figma-node-decoder/tarball/javascript-api
```

Import the helpers into your plugin

```js
// code.ts
import { encodeAsync, decodeAsync } from 'figma-node-decoder'
```

Pass in the nodes you want to encode.

```js
// Pass nodes as an array and the platform you're encoding
encodeAsync(figma.currentPage.selection, { platform: 'PLUGIN' }).then((string) => {

    // Store it somewhere
    figma.root.setPluginData("selectionAsString", string)
})
```

Decode the string when you want to recreate the nodes.

```js
// Grab the string
let selectionAsString = figma.root.getPluginData("selectionAsString")

// Recreate the nodes from string
decodeAsync(selectionAsString).then(({ nodes }) => {
    figma.currentPage.selection = nodes
    figma.viewport.scrollAndZoomIntoView(nodes)
    figma.closePlugin("Nodes created")
})
```

## Development

### Setup
```bash
npm install
```

### Development
During development, watch your project for changes with the following command.

```bash
npm run dev
```

### Build
When ready to package up your final Figma Plugin:
```bash
npm run build
```
