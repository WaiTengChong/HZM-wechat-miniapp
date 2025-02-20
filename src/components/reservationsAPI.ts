export interface ReservationResponse {
  bargainPrice: string;
  effTime: string;
  errorCode: string;
  errorMsg: string;
  msg: string;
  orderCost: string;
  orderDetailLst: OrderDetail;
  orderNo: string;
  orderPrice: string;
  orderTime: string;
  settleType: string;
  ticketNo: string;
}

export interface OrderDetail {
  cost: string;
  depatureDestinatId: string;
  depatureDestinatName: string;
  depatureDestinatNameEn: string;
  depatureOriginId: string;
  depatureOriginName: string;
  depatureOriginNameEn: string;
  isRoundtrip: string;
  lineBc: string;
  offAddress: string;
  offAddressEn: string;
  onAddress: string;
  onAddressEn: string;
  passangerType: string;
  passenger: string;
  routeName: string;
  runDate: string;
  runTime: string;
  seats: string;
  status: string;
  statusName: string;
  tel: string;
  ticketCode: string;
  ticketTypeId: string;
  trip: string;
}
