export interface Detail {
  cost_price: number; // Cost price of the bus ticket in cents
  receipt_id: string; // Receipt ID for the transaction
  goods_detail: GoodsDetail[];
}

interface GoodsDetail {
  goods_id: string; // Unique ID for the bus ticket
  wxpay_goods_id: string; // Wxpay goods ID for the bus ticket
  goods_name: string; // Name of the bus ticket
  quantity: number; // Quantity of tickets purchased
  price: number; // Price per ticket in cents
}
