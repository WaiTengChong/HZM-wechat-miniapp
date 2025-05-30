export interface GetOrderInfoResponse {
  errorCode: string; // "GETORDERINFO_FAILURE" or "SUCCESS"
  errorMsg: string;
  integral: string;
  msg: string;
  orderCost: string; // Total amount of the order
  orderNo: string; // The order number
  orderDetailLst: OrderDetail | OrderDetail[]; // Can be single object or array
}

export interface OrderDetail {
  cost: string;
  depatureDestinatId: string;
  depatureDestinatName: string;
  depatureDestinatNameEn: string;
  depatureOriginId: string;
  depatureOriginName: string;
  depatureOriginNameEn: string;
  efflimitTime: string;
  isRoundtrip: string;
  offAddress: string;
  offAddressEn: string;
  onAddress: string;
  onAddressEn: string;
  passenger: string;
  passengerEmails: string | null;
  passenger_flightNo: string | null;
  printStatus: string;
  printStatusName: string;
  runDate: string;
  runTime: string;
  seats: string;
  secondLineId: string;
  status: string;
  statusName: string;
  takeTicketCode: string;
  tel: string;
  ticketCategory: string;
  ticketCode: string;
  trip: string;
  onLat: string;
  onLong: string;
  offLat: string;
  offLong: string;
  wxPay_status: number;
}
