module.exports = {
  publicPath: process.env.NODE_ENV === 'development' ? '' : '/',
  productionSourceMap: false,
  chainWebpack: (config) => {
    config
      .plugin('html')
      .tap((args) => {
        args[0].title = 'VUE + TESSERACT = OCR';
        return args;
      });
  },
};
