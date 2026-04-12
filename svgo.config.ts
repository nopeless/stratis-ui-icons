export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
        },
      },
    },
    {
      name: "convertPathData",
      params: {
        floatPrecision: 1,
        transformPrecision: 3,
        makeArcs: true,
        straightCurves: true,
        lineShorthands: true,
        curveSmoothShorthands: true,
        removeUseless: true,
        collapseRepeated: true,
        utilizeAbsolute: true,
      },
    },
    {
      name: "cleanupNumericValues",
      params: {
        floatPrecision: 1,
      },
    },
    {
      name: "convertTransform",
      params: {
        floatPrecision: 1,
        transformPrecision: 3,
      },
    },
    "mergePaths",
    "convertShapeToPath",
    "removeDimensions",
  ],
};
