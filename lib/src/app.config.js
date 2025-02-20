"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineAppConfig({
    pages: [
        "pages/index/index",
        "pages/info/index",
        "pages/order/index",
        "pages/allTickets/index",
        "pages/routes/index",
        "pages/ticket/index",
        "pages/user/index",
    ],
    tabBar: {
        color: "#000000",
        selectedColor: "#0000FF",
        backgroundColor: "#ffffff",
        position: "bottom",
        list: [
            {
                pagePath: "pages/index/index",
                iconPath: "image/home.png",
                selectedIconPath: "image/home.png",
                text: "Home",
            },
            {
                pagePath: "pages/user/index",
                iconPath: "image/user.png",
                selectedIconPath: "image/user.png",
                text: "我的",
            },
        ],
    },
    permission: {
        "scope.userLocation": {
            desc: "你的位置信息将用于小程序位置接口的效果展示",
        },
    },
    window: {
        backgroundTextStyle: "light",
        navigationBarBackgroundColor: "#fff",
        navigationBarTitleText: "港珠澳汽車快線",
        navigationBarTextStyle: "black",
    },
    networkTimeout: {
        request: 220000,
    },
});
//# sourceMappingURL=app.config.js.map