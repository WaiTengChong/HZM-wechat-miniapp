export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/info/index",
    "pages/order/index",
    "pages/allTickets/index",
    "pages/routes/index",
    "pages/support/index",
  ],
  permission: {
    "scope.userLocation": {
      desc: "你的位置信息将用于小程序位置接口的效果展示",
    },
    "scope.customerService": {
      desc: "你的小程序需要開啟客服消息功能",
    },
  },
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "港珠澳汽車快線",
    navigationBarTextStyle: "black",
    backgroundColor: "#ffffff"
  },
  networkTimeout: {
    request: 220000,
  },
});
