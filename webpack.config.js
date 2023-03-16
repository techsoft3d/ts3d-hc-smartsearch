const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');
module.exports = {
  entry: './dev/js/smartFilter/hcSmartFilter.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'smartFilter.min.js',
    library: 'hcSmartFilter', //add this line to enable re-use
  },
  plugins: [
    new FileManagerPlugin({
        events: {
            onEnd: {
                copy: [
                    {
                        source: path.join(__dirname, 'dev/css/SmartFilterUI.css'),
                        destination: path.join(__dirname, 'dist/SMartFilterUI.css')
                    }
                ]
            }
        }
    })
]
};
