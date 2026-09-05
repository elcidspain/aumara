/** SVGO 4 config for AUMARA lockups (CSS background / <img>, not inline). */
export default {
  multipass: true,
  floatPrecision: 2,
  js2svg: {
    pretty: false,
    eol: "lf",
    finalNewline: true,
  },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          convertPathData: {
            floatPrecision: 2,
            transformPrecision: 2,
            applyTransforms: true,
            applyTransformsStroked: true,
            straightCurves: true,
            convertToQ: true,
            lineShorthands: true,
            collapseRepeated: true,
            utilizeAbsolute: true,
            negativeExtraSpace: true,
          },
          cleanupNumericValues: { floatPrecision: 2, leadingZero: true },
          convertColors: { currentColor: false, names2hex: true, rgb2hex: true, shorthex: true },
          mergePaths: { force: false, floatPrecision: 2 },
          collapseGroups: true,
          cleanupIds: { minify: true, remove: true },
        },
      },
    },
    "removeDimensions",
    "removeRasterImages",
  ],
};
