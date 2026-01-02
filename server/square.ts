import { SquareClient } from 'square';
import crypto from 'crypto';

// Square client instance
let squareClient: SquareClient | null = null;
let squareConfig: { accessToken: string; locationId: string; applicationId: string; environment: string } | null = null;

/**
 * Initialize Square client with credentials
 */
export function initializeSquare(accessToken: string, locationId: string, applicationId: string, isProduction: boolean = false): void {
  squareConfig = {
    accessToken,
    locationId,
    applicationId,
    environment: isProduction ? 'production' : 'sandbox'
  };
  
  squareClient = new SquareClient({
    token: accessToken,
    environment: isProduction ? 'production' : 'sandbox',
  });
  
  console.log(`[SQUARE] Initialized Square client in ${squareConfig.environment} mode`);
}

/**
 * Check if Square is properly configured
 */
export function isSquareConfigured(): boolean {
  return squareClient !== null && squareConfig !== null;
}

/**
 * Get Square configuration (for frontend)
 */
export function getSquareConfig(): { applicationId: string; locationId: string; environment: string } | null {
  if (!squareConfig) return null;
  return {
    applicationId: squareConfig.applicationId,
    locationId: squareConfig.locationId,
    environment: squareConfig.environment
  };
}

/**
 * Create a Square payment
 * Unlike Stripe which uses payment intents, Square creates payments directly
 */
export async function createSquarePayment(
  sourceId: string, // The payment source token from Square Web Payments SDK
  amountCents: number,
  currency: string = 'USD',
  metadata?: Record<string, string>
): Promise<{ paymentId: string; status: string; receiptUrl?: string }> {
  if (!squareClient || !squareConfig) {
    throw new Error('Square client not initialized. Please configure Square payment credentials.');
  }

  try {
    const idempotencyKey = crypto.randomUUID();
    
    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: currency as any,
      },
      locationId: squareConfig.locationId,
      note: metadata?.bookingId ? `Booking: ${metadata.bookingId}` : undefined,
      referenceId: metadata?.bookingId || metadata?.invoiceId,
    });

    const payment = response.payment;
    
    if (!payment) {
      throw new Error('No payment returned from Square');
    }

    return {
      paymentId: payment.id || '',
      status: payment.status || 'UNKNOWN',
      receiptUrl: payment.receiptUrl
    };
  } catch (error: any) {
    console.error('[SQUARE] Payment error:', error);
    if (error.errors) {
      throw new Error(`Square payment failed: ${error.errors?.map((e: any) => e.detail).join(', ')}`);
    }
    throw new Error(`Square payment failed: ${error.message}`);
  }
}

/**
 * Get Square payment details
 */
export async function getSquarePayment(paymentId: string): Promise<{
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  receiptUrl?: string;
} | null> {
  if (!squareClient) {
    throw new Error('Square client not initialized');
  }

  try {
    const response = await squareClient.payments.get({ paymentId });
    const payment = response.payment;

    if (!payment) {
      return null;
    }

    return {
      id: payment.id || '',
      status: payment.status || 'UNKNOWN',
      amountCents: Number(payment.amountMoney?.amount || 0),
      currency: payment.amountMoney?.currency || 'USD',
      receiptUrl: payment.receiptUrl
    };
  } catch (error: any) {
    console.error('[SQUARE] Get payment error:', error);
    throw error;
  }
}

/**
 * Refund a Square payment
 */
export async function refundSquarePayment(
  paymentId: string,
  amountCents?: number,
  reason?: string
): Promise<{ refundId: string; status: string }> {
  if (!squareClient) {
    throw new Error('Square client not initialized');
  }

  try {
    const idempotencyKey = crypto.randomUUID();
    
    // Get the original payment to get the amount if not specified
    const paymentResponse = await squareClient.payments.get({ paymentId });
    const originalPayment = paymentResponse.payment;

    if (!originalPayment) {
      throw new Error('Original payment not found');
    }

    const refundAmount = amountCents 
      ? BigInt(amountCents) 
      : originalPayment.amountMoney?.amount || BigInt(0);

    const response = await squareClient.refunds.refundPayment({
      idempotencyKey,
      paymentId,
      amountMoney: {
        amount: refundAmount,
        currency: originalPayment.amountMoney?.currency || 'USD',
      },
      reason,
    });

    const refund = response.refund;

    if (!refund) {
      throw new Error('No refund returned from Square');
    }

    return {
      refundId: refund.id || '',
      status: refund.status || 'UNKNOWN'
    };
  } catch (error: any) {
    console.error('[SQUARE] Refund error:', error);
    if (error.errors) {
      throw new Error(`Square refund failed: ${error.errors?.map((e: any) => e.detail).join(', ')}`);
    }
    throw new Error(`Square refund failed: ${error.message}`);
  }
}

/**
 * Verify Square webhook signature
 */
export function verifySquareWebhook(
  body: string,
  signature: string,
  signatureKey: string,
  webhookUrl: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(webhookUrl + body);
    const expectedSignature = hmac.digest('base64');
    return signature === expectedSignature;
  } catch (error) {
    console.error('[SQUARE] Webhook verification error:', error);
    return false;
  }
}

/**
 * Clear Square client (for re-initialization when credentials change)
 */
export function clearSquareClient(): void {
  squareClient = null;
  squareConfig = null;
}
