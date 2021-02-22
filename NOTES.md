# Notes

Below is the order of things that need to be checked for

1. Create nodes
    1. Walk node
        1. If instance -> Check doesn't already exist -> Push component to array
        2. Push font to array
        3. Create nodes
            1. If component check it doesn't match one in component array
            1. Do not create nested instances

3. Create components
    1. Walk nodes
        1. Create nodes

            2. Do not create nested instances
            3. Do not push component to array
            3. Do not push font to array

2. Create fonts


Order in which nodes are created

1. Create components in reverse
2. Create all other nodes
3. If 


## Functions

### `walkNodes()`

A function which loops through each node, with special properties.

### `createProps()`

```js
`${createProps()}`
```

### `appendNode()`

```js
`${Ref(node.parent)}.appendChild(${Ref(node)})\n`
```

### `createNode()`

```js
`// Create ${node.type}
var ${Ref(node.parent)} = figma.create${v.titleCase(node.type)}
${createProps}`
```

### `createInstance()`

```js
function createInstance(node) {
    var components = [];

    walkNodes([node], {
        during(node) {
            components.push(node.mainComponent)
        },
        after(node) {
            `// Create INSTANCE
            var ${Ref(node)} = ${Ref(node.mainComponent)}.createInstance()\n`
        }
    })
}
```

### `createGroup()`

```js
`// Create GROUP
figma.group([${Ref(node.children)}], ${Ref(node.parent)})\n`
```

### `createComponentSet()`

```js
`// Create COMPONENT_SET
var ${Ref(node)} = figma.combineAsVariants([${Ref(node.children).join(", ")}], ${Ref(node.parent)})
${createProps}`
```


```js
var fonts, components;



walkNodes(nodes, {
        during(node) {
            // If instance push component to array
            createNode()
            createInstance()
            appendNode()
        },
        after(node) {
            createGroup()
            createComponent(() => {
                    walkNodes(node.children, {
                        during(node) {
                            createProps()
                        }
                    })
                }
            )
        }
    }
)

createFonts(fonts)

```
