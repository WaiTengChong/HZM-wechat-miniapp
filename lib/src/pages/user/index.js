"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const taro_ui_1 = require("taro-ui");
class User extends react_1.Component {
    render() {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'user-page' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6211\u7684" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: 'primary' }, { children: "This is the User Page" }))] })));
    }
}
exports.default = User;
//# sourceMappingURL=index.js.map