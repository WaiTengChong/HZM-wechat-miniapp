export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/info/index",
    "pages/ticket/index",
    "pages/order/index",
    "pages/allTickets/index",
    "pages/routes/index",
    "pages/user/index",
    "pages/support/index",
  ],
  // tabBar: {
  //   color: "#000000",
  //   selectedColor: "#0000FF",
  //   backgroundColor: "#ffffff",
  //   position: "bottom",
  //   list: [
  //     {
  //       pagePath: "pages/index/index",
  //       iconPath: "image/home.png",
  //       selectedIconPath: "image/home.png",
  //       text: "Home",
  //     },
  //     {
  //       pagePath: "pages/user/index",
  //       iconPath: "image/user.png",
  //       selectedIconPath: "image/user.png",
  //       text: "我的",
  //     },
  //   ],
  // },
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
