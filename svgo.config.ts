export default {
  multipass: true,
  plugins: [
    "removeXMLNS",
    "cleanupIds",
    "removeUselessStrokeAndFill",
    "removeDimensions",
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
            makeArcs: false,
            straightCurves: false,
            lineShorthands: false,
            curveSmoothShorthands: false,
            removeUseless: false,
            collapseRepeated: false,
            utilizeAbsolute: false,
          },
          convertTransform: false,
          mergePaths: false,
        },
      },
    },
  ],
};
