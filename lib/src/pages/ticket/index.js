"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
require("./index.scss");
class TicketSelection extends react_1.Component {
    constructor() {
        super(...arguments);
        this.state = {
            tickets: [],
            loading: true,
            selectedTicket: null,
            ticketDate: "",
        };
        this.handleCardClick = (ticket) => {
            this.setState({ selectedTicket: ticket });
        };
        this.handleConfirmSelection = () => {
            const { selectedTicket } = this.state;
            if (!selectedTicket) {
                taro_1.default.showToast({
                    title: '請選擇一張車票',
                    icon: 'none',
                    duration: 2000
                });
            }
            else {
                //instead of pass through url params, we pass through the ticket object by using Taro.setStorageSync
                taro_1.default.setStorageSync('ticket', selectedTicket);
                taro_1.default.navigateTo({
                    url: `/pages/info/index`
                });
            }
        };
    }
    componentDidMount() {
        // Retrieve the ticket data from storage
        const ticketData = taro_1.default.getStorageSync('ticketData');
        const ticketDate = taro_1.default.getStorageSync('ticket_date');
        if (ticketData) {
            this.setState({
                tickets: ticketData,
                loading: false
            });
        }
        else {
            // If no data in storage, listen for the event
            taro_1.default.eventCenter.on('ticketDataUpdated', (data) => {
                this.setState({
                    tickets: data,
                    loading: false
                });
            });
        }
        if (ticketDate) {
            this.setState((prevState) => (Object.assign(Object.assign({}, prevState), { ticketDate })));
        }
    }
    componentWillUnmount() {
        // Clean up the event listener when component unmounts
        taro_1.default.eventCenter.off('ticketDataUpdated');
    }
    render() {
        const { tickets, loading, selectedTicket } = this.state;
        if (loading) {
            return (0, jsx_runtime_1.jsx)(taro_ui_1.AtActivityIndicator, { mode: 'center' });
        }
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'container' }, { children: (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-body' }, { children: [(0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'section-title' }, { children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u73ED\u6B21" }) })), tickets.map(ticket => ((0, jsx_runtime_1.jsxs)(taro_ui_1.AtCard, Object.assign({ note: ticket.tpa[0].beginStopName + " → " + ticket.tpa[0].endStopName, title: `公司: ${ticket.laCompanyName}`, extra: `ID: ${ticket.runId}`, onClick: () => this.handleCardClick(ticket), extraStyle: { color: (selectedTicket === null || selectedTicket === void 0 ? void 0 : selectedTicket.runId) === ticket.runId ? 'blue' : 'black' }, className: (selectedTicket === null || selectedTicket === void 0 ? void 0 : selectedTicket.runId) === ticket.runId ? 'selected-card' : '' }, { children: [(0, jsx_runtime_1.jsxs)(taro_ui_1.AtList, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u767C\u8ECA\u6642\u9593', extraText: ticket.runStartTime, hasBorder: false, disabled: false }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5230\u9054\u6642\u9593', extraText: ticket.arriveTime, hasBorder: false, disabled: false })] }), (selectedTicket === null || selectedTicket === void 0 ? void 0 : selectedTicket.runId) === ticket.runId ?
                                (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: ticket.tpa
                                        .sort((a, b) => parseInt(b.ticketTypeId) - parseInt(a.ticketTypeId)) // Convert to number and sort by ticketTypeId in descending order
                                        .map(tpa => ((0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: tpa.ticketType, extraText: "$" + tpa.fee, disabled: false, hasBorder: true, iconInfo: { size: 20, color: "dark-green", value: "money" } }, tpa.ticketTypeId))) })
                                : null] }), ticket.runId))), (0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: '\u8ECA\u7968\u5217\u8868\u7D50\u675F' }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: 'primary', onClick: this.handleConfirmSelection }, { children: "\u78BA\u8A8D\u9078\u64C7" }))] })) })));
    }
}
exports.default = TicketSelection;
//# sourceMappingURL=index.js.map