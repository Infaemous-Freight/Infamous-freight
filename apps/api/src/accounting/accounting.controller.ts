import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { QuickBooksService } from './quickbooks.service';
import { XeroService } from './xero.service';

@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly qb: QuickBooksService,
    private readonly xero: XeroService,
  ) {}

  // QuickBooks
  @Get('qb/oauth-url')
  async getQBOAuthUrl(@Query() query: { clientId: string; redirectUri: string; state: string }) {
    return { url: this.qb.getOAuthUrl(query.clientId, query.redirectUri, query.state) };
  }

  @Post('qb/connect')
  async connectQB(@Body() body: { carrierId: string; code: string; clientId: string; clientSecret: string; redirectUri: string; realmId: string }) {
    const tokens = await this.qb.exchangeCode(body.code, body.clientId, body.clientSecret, body.redirectUri);
    await this.qb.saveConnection(body.carrierId, {
      carrierId: body.carrierId,
      realmId: body.realmId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      companyName: '',
    });
    return { success: true };
  }

  @Post('qb/sync-invoice')
  async syncQBInvoice(@Body() body: { carrierId: string; invoice: any }) {
    return this.qb.syncInvoice(body.carrierId, body.invoice);
  }

  @Get('qb/accounts/:carrierId')
  async getQBAccounts(@Param('carrierId') carrierId: string) {
    return this.qb.getAccounts(carrierId);
  }

  @Get('qb/pnl/:carrierId')
  async getQBPnl(@Param('carrierId') carrierId: string, @Query() query: { year: string; month: string }) {
    return this.qb.getMonthlyPnl(carrierId, parseInt(query.year), parseInt(query.month));
  }

  // Xero
  @Get('xero/oauth-url')
  async getXeroOAuthUrl(@Query() query: { clientId: string; redirectUri: string; state: string }) {
    return { url: this.xero.getOAuthUrl(query.clientId, query.redirectUri, query.state) };
  }

  @Post('xero/connect')
  async connectXero(@Body() body: { carrierId: string; code: string; clientId: string; clientSecret: string; redirectUri: string; tenantId: string }) {
    const tokens = await this.xero.exchangeCode(body.code, body.clientId, body.clientSecret, body.redirectUri);
    await this.xero.saveConnection(body.carrierId, {
      carrierId: body.carrierId,
      tenantId: body.tenantId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 1800 * 1000),
      tenantName: '',
    });
    return { success: true };
  }
}
