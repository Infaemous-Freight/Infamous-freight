import { stripe } from './stripe.client.js';
import { prisma } from '../lib/prisma.js';

export async function createPaymentIntentForInvoice(orgId: string, invoiceId: string) {
  if (!stripe) throw new Error('Stripe not configured');

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: { load: true }
  });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status === 'PAID') throw new Error('Invoice already paid');

  // Idempotency: one PI per invoice (store providerRef on PaymentTransaction in PENDING state)
  const existing = await prisma.paymentTransaction.findFirst({
    where: { orgId, invoiceId, status: 'PENDING', provider: 'STRIPE' }
  });

  if (existing?.providerRef) {
    return { paymentIntentId: existing.providerRef, clientSecret: null, reused: true };
  }

  const pi = await stripe.paymentIntents.create(
    {
      amount: invoice.totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orgId,
        invoiceId,
        invoiceNumber: invoice.number,
        loadId: invoice.loadId
      }
    },
    { idempotencyKey: `inv_${invoiceId}` }
  );

  await prisma.paymentTransaction.create({
    data: {
      orgId,
      invoiceId,
      provider: 'STRIPE',
      providerRef: pi.id,
      amountCents: invoice.totalCents,
      status: 'PENDING'
    }
  });

  return { paymentIntentId: pi.id, clientSecret: pi.client_secret, reused: false };
}

export async function handleStripeWebhookEvent(event: any) {
  // We key off metadata for routing.
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const invoiceId = pi?.metadata?.invoiceId;
    const orgId = pi?.metadata?.orgId;

    if (!invoiceId || !orgId) return;

    // Idempotent mark paid:
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, orgId } });
    if (!invoice) return;
    if (invoice.status === 'PAID') return;

    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });

    await prisma.paymentTransaction.updateMany({
      where: { orgId, invoiceId, provider: 'STRIPE', providerRef: pi.id },
      data: { status: 'SUCCEEDED' }
    });

    await prisma.load.update({ where: { id: invoice.loadId }, data: { status: 'PAID' } });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: 'STRIPE_PAYMENT_SUCCEEDED',
        entity: 'Invoice',
        entityId: invoiceId,
        metaJson: JSON.stringify({ paymentIntentId: pi.id })
      }
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    const invoiceId = pi?.metadata?.invoiceId;
    const orgId = pi?.metadata?.orgId;
    if (!invoiceId || !orgId) return;

    await prisma.paymentTransaction.updateMany({
      where: { orgId, invoiceId, provider: 'STRIPE', providerRef: pi.id },
      data: { status: 'FAILED' }
    });
  }
}
