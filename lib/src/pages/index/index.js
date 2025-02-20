"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
require("taro-ui/dist/style/components/button.scss"); // 按需引入
const api_1 = require("../../api/api");
const carBanner1_png_1 = require("../../../static/banner/carBanner1.png");
const carBanner2_png_1 = require("../../../static/banner/carBanner2.png");
require("./index.scss");
class Index extends react_1.Component {
    constructor() {
        super(...arguments);
        this.handleGridItemClick = (index) => {
            if (index === 0) {
                taro_1.default.navigateTo({ url: '/pages/routes/index' });
            }
            if (index === 3) {
                taro_1.default.navigateTo({ url: '/pages/allTickets/index' });
            }
            if (index === 2) {
                (0, api_1.getUserList)();
            }
            if (index === 4) {
                taro_1.default.getStorage({
                    key: 'AUTH_TICKET',
                    success: function (res) {
                        console.log(res.data);
                    }
                });
            }
        };
        this.getPhoneNumber = async (e) => {
            (0, api_1.wxLogin)();
        };
        this.checkSession = () => {
            //检测sessionkey
            taro_1.default.checkSession({
                success: function () {
                    console.log("session_key 未过期");
                    taro_1.default.showToast({
                        title: '未过期',
                        icon: 'success',
                        duration: 2000
                    });
                    //session_key 未过期，并且在本生命周期一直有效
                },
                fail: function () {
                    console.log("session_key 已经失效");
                    taro_1.default.showToast({
                        title: '已经失效',
                        icon: 'error',
                        duration: 2000
                    });
                    // session_key 已经失效，需要重新执行登录流程
                    // 登录
                    (0, api_1.wxLogin)();
                }
            });
        };
    }
    componentDidMount() {
        this.checkSession();
    }
    componentWillUnmount() { }
    componentDidShow() {
    }
    componentDidHide() { }
    render() {
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'index' }, { children: (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'main-content' }, { children: [(0, jsx_runtime_1.jsxs)(components_1.Swiper, Object.assign({ className: 'swiper-container', indicatorColor: '#999', indicatorActiveColor: '#333', circular: true, indicatorDots: true, autoplay: true }, { children: [(0, jsx_runtime_1.jsx)(components_1.SwiperItem, { children: (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'demo-text-1' }, { children: (0, jsx_runtime_1.jsx)(components_1.Image, { src: carBanner1_png_1.default }) })) }), (0, jsx_runtime_1.jsx)(components_1.SwiperItem, { children: (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'demo-text-2' }, { children: (0, jsx_runtime_1.jsx)(components_1.Image, { src: carBanner2_png_1.default }) })) })] })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtGrid, { onClick: (item, index) => this.handleGridItemClick(index), data: [
                            {
                                image: 'https://img.icons8.com/color/48/000000/train-ticket.png',
                                value: '购买车票',
                            },
                            {
                                image: 'https://img.icons8.com/?size=100&id=zLUcOB9hQUB9&format=png&color=000000',
                                value: '车次时刻表'
                            },
                            {
                                image: 'https://img.icons8.com/color/48/000000/sale.png',
                                value: '优惠活动'
                            },
                            {
                                image: 'https://img.icons8.com/color/48/000000/ticket.png',
                                value: '我的车票'
                            },
                            {
                                image: 'https://img.icons8.com/?size=100&id=ivYbKVk9YcWX&format=png&color=000000',
                                value: '车站位置'
                            },
                            {
                                image: 'https://img.icons8.com/color/48/000000/info.png',
                                value: '帮助中心'
                            }
                        ] }), (0, jsx_runtime_1.jsx)(components_1.Button, Object.assign({ openType: 'getPhoneNumber', onGetPhoneNumber: this.getPhoneNumber }, { children: "Get Phone Number" })), (0, jsx_runtime_1.jsx)(components_1.Button, Object.assign({ openType: 'getPhoneNumber', onGetPhoneNumber: this.checkSession }, { children: "Check Session" }))] })) })));
    }
}
exports.default = Index;
//# sourceMappingURL=index.js.map