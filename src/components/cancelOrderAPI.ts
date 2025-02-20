export interface CancelOrderResponse {
  errorCode: string; // "CANCELORDER_FAILURE" or "SUCCESS"
  errorMsg?: string; // Error message if the cancellation fails
  orderNo: string; // The order number that was cancelled
  orderCost: string; // Total amount of the order
  orderDetailList: CancelOrderOrderDetail[]; // List of order details
}

interface CancelOrderOrderDetail {
  orderNo: string; // Order number
  cost: string; // Total ticket cost
  depatureDestinatId: string; // Destination ID
  depatureDestinatName: string; // Destination name
  depatureOriginId: string; // Origin ID
  depatureOriginName: string; // Origin name
  Passenger: string; // Passenger name
  Status: string; // Payment status (e.g., "NOTPAY")
  statusName: string; // Description of the payment status
  Tel: string; // Passenger contact number
  ticketCode: string; // Ticket number
}
