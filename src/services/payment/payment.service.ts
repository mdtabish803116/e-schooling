import { Injectable, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sq1hvJ0UCpPptT',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dQFWXqe0WXaZyr1NSIpetWzI',
    });
  }

  /**
   * Creates a Razorpay Order.
   * Amount must be in the smallest currency unit (paise for INR).
   */
  async createRazorpayOrder(amount: number, receiptId: string) {
    try {
      const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: receiptId,
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new BadRequestException('Failed to create Razorpay order: ' + error.message);
    }
  }

  /**
   * Fetches an existing order detail from Razorpay.
   */
  async getRazorpayOrder(razorpayOrderId: string) {
    try {
      const order = await this.razorpay.orders.fetch(razorpayOrderId);
      return order;
    } catch (error) {
      throw new BadRequestException('Failed to fetch Razorpay order status: ' + error.message);
    }
  }

  /**
   * Verifies the Razorpay Signature.
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dQFWXqe0WXaZyr1NSIpetWzI';
    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}
