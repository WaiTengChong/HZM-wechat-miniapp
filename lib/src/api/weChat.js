"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCount = exports.addCount = exports.getCount = void 0;
const taro_1 = require("@tarojs/taro");
const weChatUrl = "https://springboot-rbe7-125493-8-1330679997.sh.run.tcloudbase.com/api/";
const getCount = async () => {
    const res = await taro_1.default.request({
        url: `${weChatUrl}count`,
    });
    console.log(res.data.data);
};
exports.getCount = getCount;
const addCount = async () => {
    const res = await taro_1.default.request({
        url: `${weChatUrl}count`,
        method: "POST",
        data: {
            action: 'inc',
        },
    });
    console.log(res.data.data);
};
exports.addCount = addCount;
const clearCount = async () => {
    const res = await taro_1.default.request({
        url: `${weChatUrl}count`,
        method: "POST",
        data: {
            action: "clear",
        },
    });
    console.log(res.data.data);
};
exports.clearCount = clearCount;
//# sourceMappingURL=weChat.js.map