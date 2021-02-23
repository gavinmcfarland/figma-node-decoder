const exportPropValues = {
    exportSettings: []
}

const prototypingPropValues = {
    overflowDirection: "NONE",
    numberOfFixedChildren: 0
}

const sceneNodePropValues = {
    visible: true,
    locked: false
}

const containerPropValues = {
    expanded: true,
    backgrounds: [
        {
            type: "SOLID",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            color: {
                r: 1,
                g: 1,
                b: 1
            }
        }
    ]
}

const cornerPropValues = {
    cornerRadius: 0,
    cornerSmoothing: 0,
    topLeftRadius: 0,
    topRightRadius: 0,
    bottomLeftRadius: 0,
    bottomRightRadius: 0
}

const layoutPropValues = {
    absoluteTransform: [],
    relativeTransform: [],
    x: 0,
    y: 0,
    rotation: 0,
    width: 0,
    height: 0,

    constrainProportions: false,
    constraints: {
        horizontal: "MIN",
        vertical: "MIN"
    },
    layoutAlign: "INHERIT",
    layoutGrow: 0
}

const geometryPropValues = {
    fills: [{
        type: "SOLID",
        visible: true,
        opacity: 1,
        blendMode: "NORMAL",
        color: {
            r: 1,
            g: 1,
            b: 1
        }
    }],
    // strokes: [], Despite being default, it's needed for vectors?
    strokeWeight: 1,
    strokeMiterLimit: 4,
    strokeAlign: "INSIDE",
    strokeCap: "NONE",
    strokeJoin: "MITER",
    dashPattern: [],
    fillStyleId: "",
    strokeStyleId: ""
}

const textPropValues = {
    fontSize: 12,
    hasMissingFont: false,
    paragraphIndent: 0,
    paragraphSpacing: 0,
    textAlignHorizontal: "LEFT",
    textAlignVertical: "TOP",
    textAutoResize: "WIDTH_AND_HEIGHT",
    textCase: "ORIGINAL",
    textDecoration: "NONE",
    textStyleId: "",
    letterSpacing: {
        unit: "PERCENT",
        value: 0
    },
    characters: "",
    autoRename: true
}

const baseFramePropValues = {
    ...containerPropValues,
    ...layoutPropValues,
    layoutMode: "NONE",
    primaryAxisSizingMode: "AUTO",
    counterAxisSizingMode: "FIXED",

    primaryAxisAlignItems: "MIN",
    counterAxisAlignItems: "MIN",

    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,

    verticalPadding: 0,
    horizontalPadding: 0,

    layoutGrids: [],
    gridStyleId: "",
    clipsContent: true,
    guides: []
}

const blendPropValues = {
    opacity: 1,
    blendMode: "PASS_THROUGH",
    isMask: false,
    effects: []
}

export const defaultPropValues: {} = {
    "FRAME": {
        ...geometryPropValues,
        ...baseFramePropValues,
        ...blendPropValues,
        ...cornerPropValues,
        ...sceneNodePropValues,
        ...prototypingPropValues,
        ...exportPropValues,
        ...containerPropValues
    },
    "GROUP": {
        ...containerPropValues,
        ...sceneNodePropValues,
        ...exportPropValues
    },
    "SLICE": {
        ...sceneNodePropValues,
        ...exportPropValues
    },
    "BOOLEAN_OPERATION": {
        ...sceneNodePropValues,
        ...blendPropValues,
        ...containerPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "RECTANGLE": {
        ...geometryPropValues,
        ...blendPropValues,
        ...cornerPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...layoutPropValues
    },
    "LINE": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "ELLIPSE": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "POLYGON": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "STAR": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "VECTOR": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues
    },
    "TEXT": {
        ...geometryPropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...exportPropValues,
        ...cornerPropValues,
        ...layoutPropValues,
        ...textPropValues
    },
    "COMPONENT": {
        ...geometryPropValues,
        ...baseFramePropValues,
        ...blendPropValues,
        ...sceneNodePropValues,
        ...prototypingPropValues,
        ...exportPropValues,
        ...cornerPropValues
    },
    "COMPONENT_SET": {
        ...geometryPropValues,
        ...baseFramePropValues,
        ...blendPropValues,
        ...cornerPropValues,
        ...sceneNodePropValues,
        ...prototypingPropValues,
        ...exportPropValues
    },
    "INSTANCE": {
        scaleFactor: 1
    }
}

export const readOnlyProps: string[] = [
    'id',
    'parent',
    'removed',
    'children',
    'width',
    'height',
    'overlayPositionType',
    'overlayBackground',
    'overlayBackgroundInteraction',
    'reactions',
    'remote',
    'key',
    'type',
    'defaultVariant',
    'hasMissingFont',
    'characters', // Not a readonly prop
    // 'relativeTransform', // Need to check if same as default x y coordinates to avoid unnecessary code
    'absoluteTransform',
    'horizontalPadding', // Not a readonly prop, just want to ignore
    'verticalPadding', // Not a readonly prop, just want to ignore
    'mainComponent', // Not a readonly prop, just want to ignore
    'masterComponent' // Not a readonly prop, just want to ignore

]

export const textProps: string[] = [
    'characters',
    'fontSize',
    'fontName',
    // 'textStyleId',
    'textCase',
    'textDecoration',
    'letterSpacing',
    'lineHeight',
    'textAlignVertical',
    'textAlignHorizontal',
    'textAutoResize'
]

export const styleProps: string[] = [
    'fillStyleId',
    'strokeStyleId',
    'textStyleId',
    'effectStyleId',
    'gridStyleId',
    'backgroundStyleId'
]

export var dynamicProps = [
    'width',
    'height'
]