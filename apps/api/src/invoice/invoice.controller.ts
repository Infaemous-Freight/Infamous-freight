import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InvoiceService, CreateInvoiceDto, InvoiceStatus } from './invoice.service';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.createInvoice(dto);
  }

  @Get()
  async list(@Query('carrierId') carrierId: string, @Query('status') status?: InvoiceStatus) {
    return this.invoiceService.listInvoices(carrierId, status);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.invoiceService.getInvoice(id);
  }

  @Post(':id/mark-sent')
  async markSent(@Param('id') id: string) {
    return this.invoiceService.markAsSent(id);
  }

  @Post(':id/mark-paid')
  async markPaid(@Param('id') id: string) {
    return this.invoiceService.markAsPaid(id);
  }

  @Post(':id/send-reminder')
  async sendReminder(@Param('id') id: string) {
    return this.invoiceService.sendReminder(id);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string) {
    return this.invoiceService.generatePdf(id);
  }
}
