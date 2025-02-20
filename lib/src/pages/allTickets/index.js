"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
const api_1 = require("../../api/api");
require("./index.scss");
class TicketListPage extends react_1.Component {
    constructor() {
        super(...arguments);
        this.state = {
            orderList: [],
            loading: true,
            ticketData: [],
        };
        this.fetchTickets = () => {
            const { orderList } = this.state;
            Promise.all(orderList.map(async (orderNo) => {
                const ticketInfo = await (0, api_1.getTicketInfo)(orderNo);
                return ticketInfo;
            }))
                .then((ticketData) => {
                this.setState({ ticketData, loading: false });
            })
                .catch(() => {
                taro_1.default.showToast({
                    title: 'Error fetching tickets',
                    icon: 'none',
                });
            });
        };
    }
    componentDidMount() {
        const orderList = taro_1.default.getStorageSync('orderList') || [];
        if (orderList.length === 0) {
            this.setState({ loading: false });
        }
        else {
            this.setState({ orderList }, async () => {
                await this.fetchTickets();
            });
        }
    }
    render() {
        const { loading, orderList, ticketData } = this.state;
        if (loading) {
            return (0, jsx_runtime_1.jsx)(taro_ui_1.AtActivityIndicator, { mode: 'center' });
        }
        if (orderList.length === 0) {
            return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'empty-list' }, { children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u5217\u8868\u4E3A\u7A7A" }) })));
        }
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'container' }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: ticketData.map((ticket, index) => ((0, jsx_runtime_1.jsx)(taro_ui_1.AtCard, Object.assign({ title: `Ticket No: ${ticket.ticketApplayStock.ETicketNO}`, note: `${ticket.ticketApplayStock.goOnArea} → ${ticket.ticketApplayStock.goOffArea}` }, { children: (0, jsx_runtime_1.jsxs)(taro_ui_1.AtList, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u767C\u8ECA\u6642\u9593', extraText: ticket.ticketApplayStock.Line_Date }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5230\u9054\u6642\u9593', extraText: ticket.ticketApplayStock.line_Stop_Time }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5EA7\u4F4D', extraText: ticket.ticketApplayStock.seat }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u7968\u50F9', extraText: ticket.ticketApplayStock.fristPrice }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u7968\u7A2E', extraText: ticket.ticketApplayStock.ticketSpecies }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u72C0\u614B', extraText: ticket.ticketApplayStock.signFlag })] }) }), index))) }) })));
    }
}
exports.default = TicketListPage;
//# sourceMappingURL=index.js.map