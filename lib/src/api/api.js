"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wxLogin = exports.userName = exports.routes = exports.localhosturl = exports.getUserList = exports.getTickets = exports.getTicketInfo = exports.getOrderInfo = exports.getLocationByRoute = exports.getDeparturesZL = exports.getBusLine = exports.generateSignature = exports.fetchRoutesAPI = exports.createReservation = exports.cancelOrder = exports.baseUrl = exports.apiPassword = exports.APICall = void 0;
const taro_1 = require("@tarojs/taro");
const axios_1 = require("axios");
const crypto_js_1 = require("crypto-js"); // Import CryptoJS
const dayjs_1 = require("dayjs");
const md5_1 = require("md5");
const baseUrl = "http://113.98.201.46:8050/cnhkbusapi2.2/rest/cl_basic_info";
exports.baseUrl = baseUrl;
const getUserListUrl = "http://39.108.61.92:8082/web/getUserList";
const localhosturl = "http://localhost:8082/web";
exports.localhosturl = localhosturl;
const routes = "routes"; // Removed the leading slash
exports.routes = routes;
const userName = "HK059api"; // Replace with your actual username
exports.userName = userName;
const apiPassword = "1S3E8E49-D31C-0519B-3A16-7D4A04C623B5A"; // Replace with your actual password
exports.apiPassword = apiPassword;
const getUserList = async () => {
    const response = await APICall.post(getUserListUrl, {
        page: 1,
        pageSize: -1,
    }, {
        headers: {
            Accept: "*/*",
            "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            DNT: "1",
            token: "1",
            user: "1",
        },
    });
    console.log(response.data);
    return response.data;
};
exports.getUserList = getUserList;
const generateSignature = (name, psw, timestamp) => {
    const stringToHash = `userName=${name}&psw=${psw}&timestamp=${timestamp}`;
    return (0, md5_1.default)(stringToHash);
};
exports.generateSignature = generateSignature;
const encryptionKey = "kcmTicketing2022"; // Replace with your actual encryption key
const iv = crypto_js_1.default.enc.Utf8.parse("your-iv"); // Replace with your actual IV
const encrypt = (text) => {
    const encrypted = crypto_js_1.default.AES.encrypt(text, crypto_js_1.default.enc.Utf8.parse(encryptionKey), {
        iv: iv,
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.Pkcs7,
    });
    return encrypted.toString();
};
const APICall = axios_1.default.create({
    baseURL: baseUrl,
    timeout: 10000,
});
exports.APICall = APICall;
const fetchRoutesAPI = async () => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get("routes", {
        // Add 'routes' directly here without leading or trailing slash
        params: {
            userName,
            timestamp,
            signture: signature,
            format: "json", // or "json" if that's your preferred format
        },
    });
    return response.data;
};
exports.fetchRoutesAPI = fetchRoutesAPI;
const getLocationByRoute = async (routeId) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/locations`, {
        params: {
            userName: userName,
            routeId: routeId,
            timestamp,
            signture: signature,
            format: "json", // or "xml" based on what you need
        },
    });
    return response.data;
};
exports.getLocationByRoute = getLocationByRoute;
const getDeparturesZL = async (routeId, beginCityArea, endCityArea, origin_id, destination_id, isReturn, beginTime, number, departure_date) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/departuresZL`, {
        params: {
            Plus: "",
            route_id: routeId,
            endCityArea: "",
            origin_id: origin_id,
            destination_id: destination_id,
            currency_id: 1,
            isReturn: isReturn,
            beginTime: beginTime,
            number: number,
            departure_date: departure_date,
            timestamp,
            signture: signature,
            userName: userName,
            format: "json", // or "xml" based on what you need
        },
    });
    return response.data;
};
exports.getDeparturesZL = getDeparturesZL;
//依据路线查询班次信息，只显示班次基本信息，不返回班次可售人数及票价，依据指定班次查询人数及票价
const getBusLine = async (departure_date, routeId, currency_id, priceType) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/busLines?`, {
        params: {
            departure_date: departure_date,
            routeId: routeId,
            currency_id: currency_id,
            priceType: priceType,
            timestamp,
            signture: signature,
            userName: userName,
            format: "json", // or "xml" based on what you need
        },
    });
    return response.data;
};
exports.getBusLine = getBusLine;
const createReservation = async (passengers, passenger_tels, numbers, ticket_category_line_id, currency_id, departure_origin_id, departure_destination_id, departure_run_id, departure_date) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    // Encrypt passengers and passenger_tels
    const encryptedPassengers = encrypt(passengers);
    const encryptedPassengerTels = encrypt(passenger_tels);
    const response = await APICall.get(`/reservations`, {
        params: {
            currency_id: currency_id,
            departure_destination_id: departure_destination_id,
            passenger_tels: passenger_tels,
            format: "json",
            departure_origin_id: departure_origin_id,
            departure_date: departure_date,
            passengers: encryptedPassengers,
            ticket_category_line_id: ticket_category_line_id,
            numbers: numbers,
            departure_run_id: departure_run_id,
            timestamp: timestamp,
            signture: signature,
            userName: userName,
        },
    });
    return response.data;
};
exports.createReservation = createReservation;
const getTickets = async (orderNo, price, trackNo) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/getTickets`, {
        params: {
            OrderNo: orderNo,
            price: price,
            trackNo: trackNo,
            showHKCost: "",
            userName: userName,
            cash_Price: "",
            cash_No: "",
            timestamp: timestamp,
            signture: signature,
            format: "json",
        },
    });
    return response.data;
};
exports.getTickets = getTickets;
const cancelOrder = async (orderNo) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/cancelOrder`, {
        params: {
            OrderNo: orderNo,
            userName: userName,
            timestamp: timestamp,
            signture: signature,
            format: "json",
        },
    });
    return response.data;
};
exports.cancelOrder = cancelOrder;
const getOrderInfo = async (orderNo) => {
    const timestamp = (0, dayjs_1.default)().unix().toString();
    const signature = generateSignature(userName, apiPassword, timestamp);
    const response = await APICall.get(`/getOrderInfo`, {
        params: {
            OrderNo: orderNo,
            userName: userName,
            timestamp: timestamp,
            signture: signature,
            format: "json",
        },
    });
    return response.data;
};
exports.getOrderInfo = getOrderInfo;
const getTicketInfo = async (ticketNos) => {
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Current Unix timestamp
    const signature = generateSignature(userName, apiPassword, timestamp);
    try {
        const response = await axios_1.default.get("http://113.98.201.46:8050/cnhkbusapi2.2/rest/cl_basic_info/getTicketInfo", {
            params: {
                ticketNos: ticketNos,
                userName: userName,
                timestamp: timestamp,
                signture: signature,
                format: "json",
            },
        });
        return response.data;
    }
    catch (error) {
        throw new Error(`Error fetching ticket info: ${error.message}`);
    }
};
exports.getTicketInfo = getTicketInfo;
const wxLogin = () => {
    //清除缓存
    taro_1.default.clearStorageSync();
    // 登录
    taro_1.default.login({
        success: (res) => {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            if (res.code) {
                //发起网络请求
                taro_1.default.request({
                    url: `${localhosturl}/wxLogin`,
                    data: {
                        code: res.code,
                        openId: taro_1.default.getStorageSync("OPEN_ID"),
                        authKey: taro_1.default.getStorageSync("AUTH_TICKET"),
                    },
                    method: "POST",
                    header: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                    success: (res) => {
                        if (res.data.messageCode == 0) {
                            taro_1.default.showToast({
                                title: "登录成功",
                                icon: "success",
                                duration: 2000,
                            });
                            // 存储AUTH_TICKET
                            taro_1.default.setStorageSync("AUTH_TICKET", res.data.resultData.auth_key);
                            taro_1.default.setStorageSync("OPEN_ID", res.data.resultData.open_id);
                            // // 携带AUTH_TICKET请求接口，获取数据
                            // Taro.request({
                            //   method: 'POST',
                            //   url:
                            //     that.globalData.path + '/comLogin/statffCompany.ajax',
                            //   header: {
                            //     'Content-Type': 'application/x-www-form-urlencoded',
                            //     'weixinauth': mdata.data.AUTH_TICKET
                            //   },
                            //   success: function (res) {
                            //     console.log(res)
                            //   }
                            // })
                        }
                        else if (res.data.messageCode != 0) {
                            //此ID未绑定
                            //获取手机号码绑定
                        }
                    },
                });
            }
            else {
                console.log("登录失败！" + res.errMsg);
            }
        },
    });
};
exports.wxLogin = wxLogin;
//# sourceMappingURL=api.js.map