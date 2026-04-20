import { Module } from '@nestjs/common';
import { QuickBooksService } from './quickbooks.service';
import { XeroService } from './xero.service';
import { AccountingController } from './accounting.controller';

@Module({
  providers: [QuickBooksService, XeroService],
  controllers: [AccountingController],
  exports: [QuickBooksService, XeroService],
})
export class AccountingModule {}
