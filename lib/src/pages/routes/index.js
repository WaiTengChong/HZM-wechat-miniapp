"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const dayjs_1 = require("dayjs");
const react_1 = require("react");
const taro_ui_1 = require("taro-ui");
require("taro-ui/dist/style/components/button.scss"); // 按需引入
const api_1 = require("../../api/api");
require("./index.scss");
class Routes extends react_1.Component {
    constructor() {
        super(...arguments);
        // Initialize state
        this.state = {
            route: [],
            location: [],
            selectorChecked: '',
            selectorIndex: 0,
            selectedRouteId: '',
            timeSel: '--:--',
            dateSel: (0, dayjs_1.default)().format('YYYY-MM-DD'),
            loading: true,
            startLocation: '',
            endLocation: '',
            stepCurrent: 0,
            startLocations: [],
            endLocations: [],
            selectedStartLocation: '',
            selectedEndLocation: '',
            selectedStartLocationIndex: 0,
            selectedEndLocationIndex: 0,
        };
        // Handle changes in the selector dropdown
        this.onChange = async (e) => {
            const selectedIndex = e.detail.value;
            const selectedRouteId = this.state.route[selectedIndex].routeId;
            this.setState({
                selectorChecked: this.state.route[selectedIndex].routeCName,
                selectorIndex: selectedIndex,
                selectedRouteId: selectedRouteId,
                stepCurrent: 1,
            });
            try {
                this.setLoading(true);
                const response = await (0, api_1.getLocationByRoute)(selectedRouteId);
                this.setState({
                    location: response.locations,
                    startLocations: response.locations.filter(lc => lc.on === "true"),
                    endLocations: response.locations.filter(lc => lc.on === "false"),
                    //for testing 
                    selectedStartLocation: response.locations.filter(lc => lc.on === "true")[0].cname,
                    selectedEndLocation: response.locations.filter(lc => lc.on === "false")[0].cname,
                });
                console.log('Locations:', response.locations);
                this.setLoading(false);
            }
            catch (error) {
                this.setLoading(false);
                console.error('Error fetching locations:', error);
            }
        };
        // Handle time changes
        this.onTimeChange = (e) => {
            this.setState({
                timeSel: e.detail.value // Use e.detail.value for time input
            });
        };
        this.onStartLoaciontChange = (e) => {
            this.setState({
                selectedStartLocationIndex: e.detail.value,
                selectedStartLocation: this.state.startLocations[e.detail.value].cname
            });
        };
        this.onEndLoaciontChange = (e) => {
            this.setState({
                selectedEndLocationIndex: e.detail.value,
                selectedEndLocation: this.state.endLocations[e.detail.value].cname
            });
        };
        // Handle date changes
        this.onDateChange = (e) => {
            this.setState({
                dateSel: e.value // Use e.date for date input
            });
        };
    }
    // Fetch data from the API when the component mounts
    componentDidMount() {
        (0, api_1.fetchRoutesAPI)()
            .then(response => {
            if (response.route && Array.isArray(response.route)) {
                this.setState({
                    route: response.route,
                    loading: false,
                });
            }
            else {
                console.error('Invalid response:', response);
                this.setState({ loading: false });
            }
        })
            .catch(error => {
            console.error(error);
            this.setState({ loading: false });
        });
    }
    setLoading(loading) {
        this.setState({ loading });
    }
    onStepChange(stepCurrent) {
        this.setState({
            stepCurrent
        });
    }
    // Render the component
    render() {
        const { route: routes, selectorChecked, selectedRouteId, selectorIndex, timeSel, dateSel, loading, startLocation, endLocation, location, stepCurrent, selectedStartLocation, selectedEndLocation, selectedStartLocationIndex, selectedEndLocationIndex, startLocations, endLocations } = this.state;
        const items = [
            { 'title': '路線', 'desc': '選擇出發地和目的地' },
            { 'title': '地點', 'desc': '選擇具體上下車地點' },
            { 'title': '班次', 'desc': '選擇合適的班次' }
        ];
        return ((0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'container' }, { children: (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-body' }, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtSteps, { items: items, current: this.state.stepCurrent, onChange: this.onChange.bind(this) }), loading ? ((0, jsx_runtime_1.jsx)(taro_ui_1.AtActivityIndicator, { mode: 'center', content: 'Loading' })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: 'section-title' }, { children: "\u8DEF\u7DDA" })), (0, jsx_runtime_1.jsx)(components_1.View, { children: (0, jsx_runtime_1.jsx)(components_1.Picker, Object.assign({ mode: 'selector', range: routes.map(route => `${route.routeCName}`), onChange: this.onChange, value: selectorIndex }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u9078\u4E2D\u8DEF\u7DDA', extraText: this.state.selectorChecked }) }) })) })] })), selectedRouteId !== '' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: 'section-title' }, { children: "\u51FA\u767C" })), (0, jsx_runtime_1.jsx)(components_1.Picker, Object.assign({ mode: 'selector', range: location.filter(lc => lc.on === "true").map(locations => `${locations.cname}`), onChange: this.onStartLoaciontChange, defaultValue: 0, value: selectedStartLocationIndex }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5730\u9EDE', note: this.state.selectedStartLocation, extraText: this.state.selectedStartLocation }) }) }))] })), (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: 'section-title' }, { children: "\u5230\u9054" })), (0, jsx_runtime_1.jsx)(components_1.Picker, Object.assign({ mode: 'selector', range: location.filter(lc => lc.on === "false").map(locations => `${locations.cname}`), onChange: this.onEndLoaciontChange, defaultValue: 0, value: selectedEndLocationIndex }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u5730\u9EDE', note: this.state.selectedEndLocation, extraText: this.state.selectedEndLocation }) }) }))] })), (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: 'section-title' }, { children: "\u65E5\u671F" })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtCalendar, { minDate: (0, dayjs_1.default)().format('YYYY-MM-DD'), maxDate: (0, dayjs_1.default)().add(1, 'month').format('YYYY-MM-DD'), onDayClick: this.onDateChange })] })), (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, Object.assign({ className: 'section-title' }, { children: "\u4E0A\u8ECA\u6642\u9593" })), (0, jsx_runtime_1.jsx)(components_1.Picker, Object.assign({ mode: 'time', onChange: this.onTimeChange, defaultValue: '15:00', value: timeSel }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtListItem, { title: '\u7AD9\u9EDE\u958B\u8ECA\u6642\u9593', extraText: this.state.timeSel }) }) }))] })), (0, jsx_runtime_1.jsx)(taro_ui_1.AtDivider, { content: '\u8A02\u7968\u9700\u77E5 ' }), (0, jsx_runtime_1.jsxs)(components_1.View, Object.assign({ className: 'page-section' }, { children: [(0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "1. \u6240\u6709\u8ECA\u7968\u53EA\u9650\u7968\u9762\u4E0A\u8A3B\u660E\u4E4B\u65E5\u671F\u53CA\u73ED\u6B21\u6709\u6548\uFF0C\u4E58\u5BA2\u5FC5\u9808\u4F9D\u7167\u9078\u5B9A\u7684\u65E5\u671F\u53CA\u4E0A\u8ECA\u5730\u9EDE\u767B\u8ECA\uFF0C\u904E\u671F\u7121\u6548\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "2. \u4E58\u5BA2\u5FC5\u9808\u6309\u8ECA\u7968\u4E0A\u8A3B\u660E\u4E4B\u73ED\u6B21\u65BC\u958B\u8ECA\u524D15\u5206\u9418\u5230\u9054\u4E0A\u8ECA\u9EDE\u5019\u8ECA\uFF0C\u903E\u6642\u4E0D\u5019\uFF0C\u4EA6\u4E0D\u7372\u9000\u7968\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "3. \u5152\u7AE5\u8ECA\u7968\u53EA\u9069\u54083-5\u6B72\u5C0F\u7AE5\u4F7F\u7528\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "4. \u5982\u9700\u8FA6\u7406\u9810\u8FA6\u767B\u6A5F\u624B\u7E8C\uFF0C\u5E73\u65E5\u8ACB\u65BC\u822A\u73ED\u8D77\u98DB\u524D3\u5C0F\u6642\u5230\u9054\u672C\u516C\u53F8\u7968\u52D9\u4E2D\u5FC3\u8FA6\u7406\u624B\u7E8C\uFF1B\u800C\u7BC0\u65E5\u6216\u9031\u672B\u524D\u5915\u8ACB\u65BC\u822A\u73ED\u8D77\u98DB\u524D4\u5C0F\u6642\u5230\u9054\u672C\u516C\u53F8\u7968\u52D9\u4E2D\u5FC3\u8FA6\u7406\u624B\u7E8C\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "5. \u9999\u6E2F\u5E02\u5340\u8207\u6DF1\u5733\u5BF6\u5B89\u6A5F\u5834\u9593\u4E4B\u8ECA\u7A0B\u7D04\u70BA2\u5C0F\u6642 \u300C\u4E0D\u5305\u62EC\u7279\u6B8A\u8DEF\u9762\u4EA4\u901A\u60C5\u6CC1\u53CA\u904E\u95DC\u7B49\u5019\u6642\u9593\u300D\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "6. \u4E58\u5BA2\u5982\u56E0\u904E\u95DC\u5EF6\u8AA4\uFF0C\u53EF\u8F49\u4E58\u672C\u53F8\u4E0B\u4E00\u73ED\u8ECA\u524D\u5F80\u76EE\u7684\u5730\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "7. \u4ED8\u6B3E\u65B9\u5F0F: Wechat Pay\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "8. \u66F4\u6539\u8A02\u55AE: \u6240\u6709\u8A02\u55AE\u5747\u4E0D\u8A2D\u4EFB\u4F55\u53D6\u6D88\u53CA\u66F4\u6539\u3002" }), (0, jsx_runtime_1.jsx)(taro_ui_1.AtList, { children: "9. \u9000\u6B3E\u53CA\u9000\u8CA8: \u6240\u6709\u8A02\u55AE\u5747\u4E0D\u8A2D\u9000\u6B3E\u53CA\u9000\u8CA8\u3002" })] })), (0, jsx_runtime_1.jsx)(components_1.View, Object.assign({ className: 'confirm-button' }, { children: (0, jsx_runtime_1.jsx)(taro_ui_1.AtButton, Object.assign({ type: 'primary', onClick: async () => {
                                                var _a, _b;
                                                taro_1.default.showLoading();
                                                const test = await (0, api_1.getBusLine)(selectedRouteId, dateSel, "1", "1");
                                                console.log(test);
                                                const response = await (0, api_1.getDeparturesZL)(selectedRouteId, selectedStartLocation, selectedEndLocation, (_a = location.find(lc => lc.cname === selectedStartLocation)) === null || _a === void 0 ? void 0 : _a.id, (_b = location.find(lc => lc.cname === selectedEndLocation)) === null || _b === void 0 ? void 0 : _b.id, 0, timeSel, "", dateSel);
                                                if (response.run != undefined && response.run.length > 0) {
                                                    taro_1.default.hideLoading();
                                                    taro_1.default.showToast({ title: '提交成功', icon: 'success' });
                                                    console.log(response.run);
                                                    // Use Taro.setStorageSync to store the data
                                                    taro_1.default.setStorageSync('ticketData', response.run);
                                                    taro_1.default.setStorageSync('ticket_date', dateSel);
                                                    taro_1.default.navigateTo({
                                                        url: '/pages/ticket/index',
                                                        success: () => {
                                                            // Optionally, you can use Events to pass data
                                                            taro_1.default.eventCenter.trigger('ticketDataUpdated', response.run);
                                                        }
                                                    });
                                                }
                                                else {
                                                    taro_1.default.showToast({ title: '没有可用的车票', icon: 'none' });
                                                }
                                            } }, { children: "\u63D0\u4EA4" })) }))] }))] }))] })) })));
    }
}
exports.default = Routes;
//# sourceMappingURL=index.js.map