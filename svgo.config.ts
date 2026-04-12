export default {
  multipass: true,
  plugins: [
    "removeXMLNS",
    "cleanupIds",
    "mergePaths",
    "removeUselessStrokeAndFill",
    "removeDimensions",
    "reusePaths",
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          cleanupNumericValues: {
            floatPrecision: 1,
          },
          convertPathData: {
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
          convertTransform: {
            floatPrecision: 1,
            transformPrecision: 3,
          },
        },
      },
    },
  ],
};
