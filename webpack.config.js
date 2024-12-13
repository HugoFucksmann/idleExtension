const path = require("path");

module.exports = {
  entry: {
    extension: "./extension.ts",
    webview: "./webview.jsx",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "out"),
    libraryTarget: "commonjs2",
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".jsx"],
  },
  externals: {
    vscode: "commonjs vscode",
  },
};
