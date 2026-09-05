/** SVGO 4 — AUMARA lockup (file URL / CSS background, not inline). */
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
            convertToZ: true,
            lineShorthands: true,
            curveSmoothShorthands: true,
            collapseRepeated: true,
            utilizeAbsolute: true,
            forceAbsolutePath: false,
            removeUseless: true,
          },
          cleanupNumericValues: { floatPrecision: 2, leadingZero: true },
          convertColors: {
            currentColor: false,
            names2hex: true,
            rgb2hex: true,
            shorthex: true,
            shortname: false,
          },
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
