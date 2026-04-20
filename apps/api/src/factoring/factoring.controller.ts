import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FactoringService, FactoringSetup } from './factoring.service';

@Controller('factoring')
export class FactoringController {
  constructor(private readonly factoringService: FactoringService) {}

  @Post('setup')
  async setup(@Body() setup: FactoringSetup) {
    return this.factoringService.setupFactoring(setup);
  }

  @Get('setup/:carrierId')
  async getSetup(@Param('carrierId') carrierId: string) {
    return this.factoringService.getSetup(carrierId);
  }

  @Post('factor-invoice')
  async factorInvoice(@Body() body: { carrierId: string; invoiceId: string; loadId: string; brokerName: string; invoiceAmount: number }) {
    return this.factoringService.factorInvoice(body.carrierId, {
      invoiceId: body.invoiceId,
      loadId: body.loadId,
      brokerName: body.brokerName,
      invoiceAmount: body.invoiceAmount,
    });
  }

  @Post(':invoiceId/submit')
  async submit(@Param('invoiceId') invoiceId: string) {
    const invoice = await this.factoringService.getFactoredInvoice(invoiceId);
    const setup = await this.factoringService.getSetup('default');
    if (!invoice || !setup) throw new Error('Invoice or setup not found');
    await this.factoringService.submitToFactor(invoice, setup);
    return { success: true };
  }

  @Post(':invoiceId/mark-funded')
  async markFunded(@Param('invoiceId') invoiceId: string, @Body('reference') reference: string) {
    await this.factoringService.markAsFunded(invoiceId, reference);
    return { success: true };
  }

  @Post(':invoiceId/mark-paid')
  async markPaid(@Param('invoiceId') invoiceId: string) {
    await this.factoringService.markAsPaid(invoiceId);
    return { success: true };
  }

  @Get('invoices/:carrierId')
  async getInvoices(@Param('carrierId') carrierId: string) {
    return this.factoringService.getFactoredInvoices(carrierId);
  }

  @Post('compare')
  async compare(@Body('amount') amount: number) {
    return this.factoringService.compareFactors(amount);
  }
}
