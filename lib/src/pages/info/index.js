"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
const api_1 = require("../../api/api"); // Import the API method
require("./index.scss");
class PassengerForm extends react_1.Component {
    constructor() {
        super(...arguments);
        this.state = {
            ticketCategoryLineId: "",
            ticketTypeId: "",
            departureOriginId: "",
            departureDestinationId: "",
            departureRunId: "",
            departureDate: "",
            ticketQuantities: {},
            ticket: null,
            addedTickets: [],
        };
        this.formatPassengersName = () => {
            const { ticketQuantities } = this.state;
            const result = [];
            for (const ticketId in ticketQuantities) {
                const tpaEntries = ticketQuantities[ticketId];
                const tpaResults = [];
                for (const tpaId in tpaEntries) {
                    const passengers = tpaEntries[tpaId];
                    const passengerNames = passengers.map(p => p.passengers).join(","); // Join passengers for the same tpaId
                    tpaResults.push(passengerNames);
                }
                result.push(tpaResults.join(";")); // Join different tpaId results with ";"
            }
            return result.join(", "); // Join different ticketId results with ", "
        };
        // ... existing code ...
        // Function to format passengers and their telephone numbers
        this.formatPassengerTel = () => {
            const { ticketQuantities } = this.state;
            const result = [];
            for (const ticketId in ticketQuantities) {
                const tpaEntries = ticketQuantities[ticketId];
                const tpaResults = [];
                for (const tpaId in tpaEntries) {
                    const passengers = tpaEntries[tpaId];
                    const passengerNames = passengers.map(p => p.passengers).join(","); // Join passengers for the same tpaId
                    const passengerTels = passengers.map(p => p.passengerTels).join(","); // Join telephone numbers for the same tpaId
                    // Combine names and telephone numbers
                    tpaResults.push(`${passengerNames} (${passengerTels})`); // Format: "name1,name2 (tel1,tel2)"
                }
                result.push(tpaResults.join(";")); // Join different tpaId results with ";"
            }
            return result.join(", "); // Join different ticketId results with ", "
        };
        // Update input handlers to set values based on index
        this.handleInputChange = (index, field, value) => {
            this.setState((prevState) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                const updatedTicketQuantities = Object.assign({}, prevState.ticketQuantities);
                const updatedPassengers = [...(((_c = (_b = (_a = updatedTicketQuantities[prevState.ticketTypeId]) === null || _a === void 0 ? void 0 : _a[prevState.ticketCategoryLineId]) === null || _b === void 0 ? void 0 : _b[index]) === null || _c === void 0 ? void 0 : _c.passengers) || [])];
                const updatedTels = [...(((_f = (_e = (_d = updatedTicketQuantities[prevState.ticketTypeId]) === null || _d === void 0 ? void 0 : _d[prevState.ticketCategoryLineId]) === null || _e === void 0 ? void 0 : _e[index]) === null || _f === void 0 ? void 0 : _f.passengerTels) || [])];
                const updatedIds = [...(((_j = (_h = (_g = updatedTicketQuantities[prevState.ticketTypeId]) === null || _g === void 0 ? void 0 : _g[prevState.ticketCategoryLineId]) === null || _h === void 0 ? void 0 : _h[index]) === null || _j === void 0 ? void 0 : _j.passengerIds) || [])];
                if (field === 'name') {
                    updatedPassengers[index] = value;
                }
                else if (field === 'tel') {
                    updatedTels[index] = value;
                }
                else if (field === 'id') {
                    updatedIds[index] = value;
                }
                return {
                    ticketQuantities: updatedTicketQuantities,
                };
            });
        };
        this.handleDeletePassenger = (index) => {
            const { ticketQuantities } = this.state;
            const updatedTicketQuantities = Object.assign({}, ticketQuantities);
            for (const ticketId in updatedTicketQuantities) {
                const tpaEntries = updatedTicketQuantities[ticketId];
                for (const tpaId in tpaEntries) {
                    const passengers = tpaEntries[tpaId];
                    const updatedPassengers = passengers.filter((_, i) => i !== index);
                    const updatedTels = updatedPassengers.map(p => p.passengerTels);
                    const updatedIds = updatedPassengers.map(p => p.passengerIds);
                    updatedTicketQuantities[ticketId][tpaId] = updatedPassengers;
                }
            }
            this.setState({ ticketQuantities: updatedTicketQuantities });
        };
        this.handleSubmit = async () => {
            taro_1.default.showLoading({
                title: '提交中...',
                mask: true
            });
            const { ticketCategoryLineId, ticketTypeId, departureOriginId, departureDestinationId, departureRunId, departureDate } = this.state;
            if (this.formatPassengersName() === "") {
                taro_1.default.hideLoading();
                taro_1.default.showToast({ title: "乘客信息不能为空", icon: "none" });
                return;
            }
            try {
                const quantitiesArray = Object.values(this.state.ticketQuantities).flatMap(Object.values);
                const response = await (0, api_1.createReservation)(this.formatPassengersName(), this.formatPassengerTel(), quantitiesArray.reverse().toString(), this.state.addedTickets.map(tpa => tpa.ticketCategoryLineId).join(","), "1", // currency_id
                departureOriginId, departureDestinationId, departureRunId, departureDate);
                if (response.errorCode === "SUCCESS") {
                    const getTicketsResponse = await (0, api_1.getTickets)(response.orderNo, response.orderPrice, response.ticketNo);
                    if (getTicketsResponse.errorCode === "SUCCESS") {
                        const orderList = taro_1.default.getStorageSync("orderList") || []; // Ensure orderList is an array
                        orderList.push(response.ticketNo);
                        taro_1.default.setStorageSync("orderList", orderList);
                        taro_1.default.setStorageSync("ticket", getTicketsResponse);
                        taro_1.default.showToast({ title: "提交成功", icon: "success" });
                        taro_1.default.navigateTo({
                            url: '/pages/order/index'
                        });
                        taro_1.default.hideLoading();
                    }
                }
                else {
                    taro_1.default.hideLoading();
                    taro_1.default.showToast({ title: response.errorMsg, icon: "error" });
                }
                //call getTickets 锁票确认
            }
            catch (error) {
                taro_1.default.showToast({ title: "提交失败", icon: "none" });
                console.error("API Error:", error);
            }
        };
        this.handleQuantityChange = (ticketId, tpaId, value) => {
            var _a;
            const addedTickets = (_a = this.state.ticket) === null || _a === void 0 ? void 0 : _a.tpa.filter(tpa => tpa.ticketTypeId === tpaId);
            this.setState((prevState) => {
                const updatedAddedTickets = value > 0
                    ? [...prevState.addedTickets, ...addedTickets]
                    : prevState.addedTickets.filter(t => t.ticketTypeId !== tpaId);
                const updatedTicketQuantities = Object.assign(Object.assign({}, prevState.ticketQuantities), { [ticketId]: Object.assign(Object.assign({}, prevState.ticketQuantities[ticketId]), { [tpaId]: Array(value).fill({
                            passengers: '',
                            passengerTels: '',
                            passengerIds: '',
                            ticketTypeId: tpaId,
                        }) }) });
                return {
                    addedTickets: updatedAddedTickets,
                    departureDestinationId: updatedAddedTickets.length > 0 ? updatedAddedTickets[0].endStopId : prevState.departureDestinationId,
                    departureOriginId: updatedAddedTickets.length > 0 ? updatedAddedTickets[0].beginStopId : prevState.departureOriginId,
                    departureRunId: prevState.ticket.runId,
                    ticketQuantities: updatedTicketQuantities,
                };
            });
            console.log(this.state.ticketQuantities);
        };
    }
    componentDidMount() {
        const ticket = taro_1.default.getStorageSync('ticket');
        const ticketDate = taro_1.default.getStorageSync('ticket_date');
        if (ticket) {
            this.setState({
                ticket: ticket,
                departureDate: ticketDate,
            }, () => {
            });
        }
    }
    // Add this method to handle state and ticket retrieval
    getPassengerData() {
        const { ticketQuantities, ticket } = this.state;
        return { ticketQuantities, ticket };
    }
    render() {
        const { ticketQuantities, ticket } = this.getPassengerData();
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: "container" }, { children: (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: "page-body" }, { children: [(0, jsx_runtime_1.jsxs)(taro_ui_1.AtCard, Object.assign({ note: (ticket === null || ticket === void 0 ? void 0 : ticket.tpa[0].beginStopName) + " → " + (ticket === null || ticket === void 0 ? void 0 : ticket.tpa[0].endStopName), title: `公司: ${ticket === null || ticket === void 0 ? void 0 : ticket.laCompanyName}`, extra: `ID: ${ticket === null || ticket === void 0 ? void 0 : ticket.runId}` }, { children: [(0, jsx_runtime_1.jsxs)(taro_ui_1.AtList, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u767C\u8ECA\u6642\u9593', extraText: ticket === null || ticket === void 0 ? void 0 : ticket.runStartTime, disabled: false }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5230\u9054\u6642\u9593', extraText: ticket === null || ticket === void 0 ? void 0 : ticket.arriveTime, disabled: false })] }), ticket === null || ticket === void 0 ? void 0 : ticket.tpa.sort((a, b) => parseInt(b.ticketTypeId) - parseInt(a.ticketTypeId)).map((tpa) => {
                                var _a, _b;
                                return ((0, jsx_runtime_1.jsxs)(taro_ui_1.AtList, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: `${tpa.ticketType} 票價: $${tpa.fee}`, extraText: "", hasBorder: true, iconInfo: { size: 20, color: "dark-green", value: "money" } }), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ style: { display: 'flex', justifyContent: 'flex-end' } }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtInputNumber, { min: 0, max: 10, step: 1, size: 'large', value: ((_b = (_a = ticketQuantities[ticket === null || ticket === void 0 ? void 0 : ticket.runId]) === null || _a === void 0 ? void 0 : _a[tpa.ticketTypeId]) === null || _b === void 0 ? void 0 : _b.length) || 0, onChange: (value) => {
                                                    var _a, _b, _c, _d;
                                                    this.handleQuantityChange(ticket === null || ticket === void 0 ? void 0 : ticket.runId, tpa.ticketTypeId, value);
                                                    // Remove passengers if quantity decreases
                                                    if (value < (((_b = (_a = ticketQuantities[ticket === null || ticket === void 0 ? void 0 : ticket.runId]) === null || _a === void 0 ? void 0 : _a[tpa.ticketTypeId]) === null || _b === void 0 ? void 0 : _b.length) || 0)) {
                                                        const quantityDifference = (((_d = (_c = ticketQuantities[ticket === null || ticket === void 0 ? void 0 : ticket.runId]) === null || _c === void 0 ? void 0 : _c[tpa.ticketTypeId]) === null || _d === void 0 ? void 0 : _d.length) || 0) - value;
                                                        for (let i = 0; i < quantityDifference; i++) {
                                                            //this.handleDeletePassenger(ticket?.runId, tpa.ticketTypeId, this.state.passengers.length - 1); // Remove last passenger
                                                        }
                                                    }
                                                }, type: 'number' }) }))] }, tpa.ticketTypeId));
                            })] }), ticket === null || ticket === void 0 ? void 0 : ticket.runId), Object.entries(ticketQuantities).map(([ticketId, quantities], index) => {
                        const passengers = Object.values(quantities).flat(); // Flatten the passengers array
                        const total = passengers.length; // Calculate total based on flattened array
                        return ((0, jsx_runtime_1.jsxs)(components_1.View, { children: [" ", Array.from({ length: total }).map((_, i) => {
                                    var _a, _b, _c;
                                    return ( // Create input fields based on total
                                    (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: "form-container" }, { children: (0, jsx_runtime_1.jsxs)(taro_ui_1.AtForm, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: `乘客資料 ${i + 1}` }), (0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: "title" }, { children: "\u4E58\u5BA2\u59D3\u540D" })), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'input-container' }, { children: (0, jsx_runtime_1.jsx)(components_1.Input, { name: `passengerName_${i}`, type: "text", placeholder: "\u8BF7\u8F93\u5165\u4E58\u5BA2\u59D3\u540D", value: ((_a = passengers[i]) === null || _a === void 0 ? void 0 : _a.passengers) || "", onInput: (e) => this.handleInputChange(i, 'name', e.detail.value) }) })), (0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: "title" }, { children: "\u4E58\u5BA2\u7535\u8BDD" })), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'input-container' }, { children: (0, jsx_runtime_1.jsx)(components_1.Input, { name: `passengerTel_${i}`, placeholder: "\u8BF7\u8F93\u5165\u4E58\u5BA2\u7535\u8BDD", value: ((_b = passengers[i]) === null || _b === void 0 ? void 0 : _b.passengerTels) || "", onInput: (e) => this.handleInputChange(i, 'tel', e.detail.value) }) })), (0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: "title" }, { children: "\u4E58\u5BA2\u8B49\u4EF6" })), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'input-container' }, { children: (0, jsx_runtime_1.jsx)(components_1.Input, { name: `passengerId_${i}`, type: "text", placeholder: "\u8BF7\u8F93\u5165\u4E58\u5BA2\u8B49\u4EF6", value: ((_c = passengers[i]) === null || _c === void 0 ? void 0 : _c.passengerIds) || "", onInput: (e) => this.handleInputChange(i, 'id', e.detail.value) }) }))] }) }), i));
                                })] }, ticketId));
                    }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: "\u4E58\u5BA2\u5217\u8868" }), Object.values(ticketQuantities).flatMap(tpaEntries => Object.values(tpaEntries).flatMap(passengers => passengers.map((passenger, index) => ((0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: "passenger-item" }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: `乘客姓名: ${passenger.passengers}` }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: `乘客电话: ${passenger.passengerTels}` }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: `乘客證件: ${passenger.passengerIds}` })] }), index))))), Object.values(ticketQuantities).flatMap(tpaEntries => Object.values(tpaEntries).flatMap(passengers => passengers)).length >= 1 && Object.values(ticketQuantities).flatMap(tpaEntries => Object.values(tpaEntries).flatMap(passengers => passengers)).every((passenger) => passenger.passengers && passenger.passengerTels && passenger.passengerIds // Check if all inputs are filled
                    ) && ((0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: "primary", onClick: this.handleSubmit }, { children: "\u63D0\u4EA4" })))] })) })));
    }
}
exports.default = PassengerForm;
//# sourceMappingURL=index.js.map