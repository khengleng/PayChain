import { Global, Module } from '@nestjs/common';
import { AuditExportController } from './audit-export.controller';
import { AuditExportService } from './audit-export.service';
import { AuditService } from './audit.service';

@Global()
@Module({
  controllers: [AuditExportController],
  providers: [AuditService, AuditExportService],
  exports: [AuditService],
})
export class AuditModule {}
