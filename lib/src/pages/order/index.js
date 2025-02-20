"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
const api_1 = require("../../api/api"); // Import the API method
require("./index.scss");
class OrderDetail extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.state = {
            orderNo: "",
            orderPrice: "",
            ticketNo: "",
            qrCodeUrl: "",
            depatureDestinatName: "",
            depatureOriginName: "",
            runDate: "",
            runTime: "",
        };
        this.handleCancelOrder = async () => {
            const { orderNo } = this.state;
            const response = await (0, api_1.cancelOrder)(orderNo);
            if (response.errorCode === "SUCCESS") {
                taro_1.default.showToast({ title: "订单已取消", icon: "success", duration: 2000 });
            }
            else {
                taro_1.default.showToast({ title: response.errorMsg || "取消订单失败", icon: 'none', duration: 2000 });
            }
        };
        this.handleOrderInfo = async () => {
            const { orderNo } = this.state;
            const response = await (0, api_1.getOrderInfo)(orderNo);
            if (response.errorCode === "SUCCESS") {
                taro_1.default.showToast({ title: "获取订单信息成功", icon: "success", duration: 2000 });
            }
            else {
                taro_1.default.showToast({ title: response.errorMsg || "获取订单信息失败", icon: 'none', duration: 2000 });
            }
        };
        this.handleGetTicketInfo = async () => {
            const { ticketNo } = this.state;
            const response = await (0, api_1.getTicketInfo)(ticketNo);
            if (response.ticketApplayStock.ETicketNO !== null || response.ticketApplayStock.ETicketNO !== undefined) {
                taro_1.default.showToast({ title: "获取票号信息成功", icon: "success", duration: 2000 });
            }
            else {
                taro_1.default.showToast({ title: "获取票号信息失败", icon: 'none', duration: 2000 });
            }
        };
    }
    componentDidMount() {
        const apiResponse = taro_1.default.getStorageSync("ticket");
        this.setState({
            orderNo: apiResponse.orderNo,
            orderPrice: apiResponse.orderCost,
            ticketNo: apiResponse.orderDetailLst.ticketCode,
            qrCodeUrl: apiResponse.orderDetailLst.takeTicketCode,
            depatureDestinatName: apiResponse.orderDetailLst.depatureDestinatName,
            depatureOriginName: apiResponse.orderDetailLst.depatureOriginName,
            runDate: apiResponse.orderDetailLst.runDate,
            runTime: apiResponse.orderDetailLst.runTime,
        });
    }
    render() {
        const { orderNo, orderPrice, ticketNo, qrCodeUrl, depatureDestinatName, depatureOriginName, runDate, runTime } = this.state;
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: "order-detail-container" }, { children: (0, jsx_runtime_1.jsxs)(taro_ui_1.AtCard, Object.assign({ title: "\u8BA2\u5355\u8BE6\u60C5", extra: orderNo, className: "order-card" }, { children: [(0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: "depature-info" }, { children: (0, jsx_runtime_1.jsxs)(components_1.Text, Object.assign({ className: "depature-text" }, { children: [depatureDestinatName, " \u2192 ", depatureOriginName] })) })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: "\u4E8C\u7EF4\u7801" }), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: "qr-code-container", onClick: () => taro_1.default.previewImage({ urls: [`https://api.qrserver.com/v1/create-qr-code/?data=${qrCodeUrl}&size=600x600`] }) }, { children: (0, jsx_runtime_1.jsx)(components_1.Image, { src: `https://api.qrserver.com/v1/create-qr-code/?data=${qrCodeUrl}&size=600x600`, className: "qr-code" }) })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: "\u8ECA\u7968\u4FE1\u606F" }), (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: "order-info" }, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: "\u7968\u53F7", extraText: ticketNo }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: "\u8BA2\u5355\u4EF7\u683C", hasBorder: false, extraText: `$${orderPrice}` }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: "\u51FA\u53D1\u65E5\u671F", hasBorder: false, extraText: runDate }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: "\u51FA\u53D1\u65F6\u95F4", hasBorder: false, extraText: runTime })] })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: "secondary", className: "cancel-button", onClick: this.handleGetTicketInfo }, { children: "\u67E5\u770B\u7968\u53F7" })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: "secondary", className: "cancel-button", onClick: this.handleOrderInfo }, { children: "\u67E5\u770B\u8BA2\u5355" })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: "secondary", className: "cancel-button", onClick: this.handleCancelOrder }, { children: "\u53D6\u6D88\u8BA2\u5355" })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: "primary", className: "back-button", onClick: () => taro_1.default.navigateBack() }, { children: "\u8FD4\u56DE" }))] })) })));
    }
}
exports.default = OrderDetail;
//# sourceMappingURL=index.js.map