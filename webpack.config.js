const path = require("path");

module.exports = {
  target: "node",
  entry: {
    extension: "./src/extension.ts",
    webview: "./ui/webview.jsx",
  },
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
    child_process: "commonjs child_process",
    path: "commonjs path",
    fs: "commonjs fs"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react"],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
