import Taro from "@tarojs/taro";
import axios from "axios";
import CryptoJS from "Crypto-js";
import dayjs from "dayjs";
import md5 from "md5";

import { CancelOrderResponse } from "src/components/cancelOrderAPI";
import { GetTicketInfoResponse } from "src/components/getTicketInfoAPI";
import { TicketResponse } from "src/components/getTicketsAPI";
import { GoodsDetail } from "src/components/orderDetail";
import { GetOrderInfoResponse } from "src/components/OrderInfoAPI";
import { ReservationResponse } from "src/components/reservationsAPI";
import { RemoteSetting } from "../types/remoteSettings";

const baseUrl = "https://weapp.alteronetech.top/";
//const baseUrl = "http://localhost:8081/";

// Define local variables for each API endpoint
const GET_REMOTE_SETTINGS = "web/getRemoteSettings";
const ROUTES = "web/routes";
const LOCATIONS = "web/locations";
const DEPARTURES_ZL = "web/departuresZL";
const BUS_LINES = "web/busLines";
const RESERVATIONS = "web/reservations";
const GET_TICKETS = "web/getTickets";
const CANCEL_ORDER = "web/cancelOrder";
const GET_ORDER_INFO = "web/getOrderInfo";
const GET_TICKET_INFO = "web/getTicketInfo";
const WX_LOGIN = "web/wxLogin";
const CREATE_WECHAT_PAY_JSAPI = "pay/createWechatPayJsapi";
const GET_WECHAT_REQUEST_PAYMENT = "pay/getWechatRequestPayment";
const GET_ORDER_LIST = "web/getOrderList";

export const getEnvIsLive = () => {
  return (baseUrl as string) === "https://weapp.alteronetech.top/";
};

const makeAPICall = async (
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  data: any = {},
  headers: any = {}
) => {
  const AUTH_TICKET = Taro.getStorageSync("AUTH_TICKET");
  const OPEN_ID = Taro.getStorageSync("OPEN_ID");
  try {
    const response = await axios({
      baseURL: baseUrl,
      url: path,
      method: method,
      data: method !== "GET" ? data : undefined,
      params: method === "GET" ? data : undefined,
      headers: {
        Accept: "*/*",
        //if path include pay, use application/json
        "Content-Type": path.includes("pay")
          ? "application/json"
          : "application/x-www-form-urlencoded; charset=UTF-8",
        authKey: AUTH_TICKET,
        openId: OPEN_ID,
        web: "1",
        ...headers,
      },
      timeout: 10000000,
    });
    if (response.data.messageCode != 0) {
      Taro.showToast({
        title: response.data.message,
        icon: "error",
      }).then(() => {
        Taro.clearStorageSync();
        Taro.navigateTo({
          url: "/pages/index/index",
        });
      });
      return Promise.reject(response.data.message);
    } else {
      return response.data.resultData;
    }
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      Taro.showToast({
        title: "网络超时",
        icon: "error",
      });
    }
    throw new Error(`API call failed: ${error.message}`);
  }
};

const getRemoteSettings = async (): Promise<RemoteSetting[]> => {
  try {
    const response = await makeAPICall(
      GET_REMOTE_SETTINGS,
      "POST",
      {},
      {
        Accept: "*/*",
        "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        DNT: "1",
        web: "1",
      }
    );
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch remote settings: ${error.message}`);
  }
};

const createOrder = async (
  orderNo: string,
  totalPrice: string,
  description: string,
  ticketData: GoodsDetail[],
  time_expire: string
) => {
  const OPEN_ID = Taro.getStorageSync("OPEN_ID");
  const response = await makeAPICall(CREATE_WECHAT_PAY_JSAPI, "POST", {
    amount: {
      total: totalPrice, // TODO change to the total price
    },
    description: description, // Description of the product
    // goods_tag: ticketTypeId, // Tag for the bus ticket product
    out_trade_no: orderNo,
    detail: {
      cost_price: totalPrice, // TODO change to the total price
      // receipt_id: ticketCode, // Receipt ID for the transaction
      goods_detail: ticketData,
    },
    openid: OPEN_ID, // User's open ID
    time_expire: time_expire,
  });
  return response;
};

const wxMakePay = async (
  prepayId: string,
  orderNo: string
): Promise<string> => {
  try {
    console.log("is prepayId ", prepayId);
    const response = await makeAPICall(GET_WECHAT_REQUEST_PAYMENT, "POST", {
      prepayId: prepayId,
    });

    return new Promise((resolve, reject) => {
      Taro.requestPayment({
        timeStamp: response.timeStamp,
        nonceStr: response.nonceStr,
        package: response.package,
        signType: "RSA",
        paySign: response.paySign,
        success: function (res) {
          if (res.errMsg === "requestPayment:ok") {
            resolve("SUCCESS");
          } else {
            resolve(res.errMsg);
          }
        },
        fail: async function (res) {
          await cancelOrder(orderNo);
          if (res.errMsg === "requestPayment:fail cancel") {
            resolve("CANCELLED"); // User cancelled payment
            Taro.showToast({
              title: "支付取消",
              icon: "none",
            });
          } else {
            resolve("FAILED"); // Payment failed for other reasons
            Taro.showToast({
              title: "支付失败",
              icon: "none",
            });
          }
        },
        complete: function () {},
      });
    });
  } catch (error) {
    console.error(`Payment request failed: ${error.message}`);
    return error.message;
  }
};

const generateSignature = (
  name: string,
  psw: string,
  timestamp: string
): string => {
  const stringToHash = `userName=${name}&psw=${psw}&timestamp=${timestamp}`;
  return md5(stringToHash);
};

const encryptionKey = "kcmTicketing2022"; // Replace with your actual encryption key
const iv = CryptoJS.enc.Utf8.parse("your-iv"); // Replace with your actual IV

const encrypt = (text: string): string => {
  const encrypted = CryptoJS.AES.encrypt(
    text,
    CryptoJS.enc.Utf8.parse(encryptionKey),
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return encrypted.toString();
};

const fetchRoutesAPILocal = async () => {
  const response = await makeAPICall(
    ROUTES,
    "POST",
    {},
    {
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getLocationByRoute = async (routeId: string): Promise<LocationApi> => {
  const response = await makeAPICall(
    LOCATIONS,
    "POST",
    { routeId: routeId },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getDeparturesZL = async (
  routeId: string,
  origin_id: string,
  destination_id: string,
  isReturn: number,
  number: string,
  departure_date: string
): Promise<DepartureZL> => {
  const response = await makeAPICall(
    DEPARTURES_ZL,
    "POST",
    {
      route_id: routeId,
      origin_id: origin_id,
      destination_id: destination_id,
      isReturn: isReturn,
      number: number,
      departure_date: departure_date,
      currency_id: "1",
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getBusLine = async (
  departure_date: string,
  routeId: string,
  currency_id: string,
  priceType: string
): Promise<DepartureZL> => {
  const response = await makeAPICall(
    BUS_LINES,
    "POST",
    {
      route_id: routeId,
      departure_date: departure_date,
      currency_id: currency_id,
      priceType: priceType,
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const createReservation = async (
  passengers: string,
  passenger_tels: string,
  numbers: string,
  ticket_category_line_id: string,
  currency_id: string,
  departure_origin_id: string,
  departure_destination_id: string,
  departure_run_id: string,
  departure_date: string
): Promise<ReservationResponse> => {
  const encryptedPassengers = encrypt(passengers);
  const response = await makeAPICall(
    RESERVATIONS,
    "POST",
    {
      departure_destination_id: departure_destination_id,
      passenger_tels: passenger_tels,
      departure_origin_id: departure_origin_id,
      departure_date: departure_date,
      passengers: passengers,
      ticket_category_line_id: ticket_category_line_id,
      currency_id: currency_id,
      numbers: numbers,
      departure_run_id: departure_run_id,
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getTickets = async (
  orderNo: string,
  price: string,
  trackNo: string,
  onLat: number,
  onLong: number,
  offLat: number,
  offLong: number
): Promise<TicketResponse> => {
  const AUTH_TICKET = Taro.getStorageSync("AUTH_TICKET");
  const response = await makeAPICall(
    GET_TICKETS,
    "POST",
    {
      OrderNo: orderNo,
      price: price,
      trackNo: trackNo,
      showHKCost: "",
      cash_Price: "",
      cash_No: "",
      timestamp: dayjs().unix().toString(),
      format: "json",
      auth_key: AUTH_TICKET,
      onLat: onLat.toString(),
      onLong: onLong.toString(),
      offLat: offLat.toString(),
      offLong: offLong.toString(),
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const cancelOrder = async (orderNo: string): Promise<CancelOrderResponse> => {
  const response = await makeAPICall(
    CANCEL_ORDER,
    "POST",
    {
      OrderNo: orderNo,
      format: "json",
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getOrderInfo = async (orderNo: string): Promise<GetOrderInfoResponse> => {
  const response = await makeAPICall(
    GET_ORDER_INFO,
    "POST",
    {
      OrderNo: orderNo,
      format: "json",
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getTicketInfo = async (
  ticketNos: string
): Promise<GetTicketInfoResponse> => {
  const response = await makeAPICall(
    GET_TICKET_INFO,
    "POST",
    {
      ticketNos: ticketNos,
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      DNT: "1",
      web: "1",
    }
  );

  return response;
};

const getOrderList = async () => {
  const AUTH_TICKET = Taro.getStorageSync("AUTH_TICKET");
  const response = await makeAPICall(
    GET_ORDER_LIST,
    "POST",
    {
      auth_key: AUTH_TICKET,
    },
    {
      Accept: "*/*",
      "Accept-Language": "en,zh;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      DNT: "1",
      web: "1",
    }
  );
  console.log("response", response);
  return response;
};

const wxLogin = () => {
  //清除缓存
  Taro.clearStorageSync();
  // 登录
  Taro.login({
    success: (res) => {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      if (res.code) {
        //发起网络请求
        Taro.request({
          url: `${baseUrl}${WX_LOGIN}`,
          data: {
            code: res.code,
          },
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          success: (res) => {
            if (res.data.messageCode == 0) {
              Taro.showToast({
                title: "登录成功",
                icon: "success",
                duration: 2000,
              });
              // 存储AUTH_TICKET
              Taro.setStorageSync("AUTH_TICKET", res.data.resultData.auth_key);
              Taro.setStorageSync("OPEN_ID", res.data.resultData.open_id);
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
            } else if (res.data.messageCode != 0) {
              //此ID未绑定
              //获取手机号码绑定
            }
          },
        });
      } else {
        console.log("登录失败！" + res.errMsg);
      }
    },
  });
};

export {
  cancelOrder,
  createOrder,
  createReservation,
  fetchRoutesAPILocal,
  generateSignature,
  getBusLine,
  getDeparturesZL,
  getLocationByRoute,
  getOrderInfo,
  getOrderList,
  getRemoteSettings,
  getTicketInfo,
  getTickets,
  wxLogin,
  wxMakePay
};

