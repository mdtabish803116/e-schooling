import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeesService } from '../../../../services/fees/fees.service';
import { CurrentAcademicSession } from '../../../../shared/decorators/current-academic-session.decorator';

@ApiTags('Fees Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @ApiOperation({ summary: 'Get entire fee workspace data' })
  @Get('fees/workspace')
  async getFeeWorkspace(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeWorkspace(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Get all fee structures' })
  @Get('fees/structures')
  async getFeeStructures(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeStructures(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Create a fee structure' })
  @Post('fees/structures')
  async createFeeStructure(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.createFeeStructure(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Update a fee structure' })
  @Patch('fees/structures/:id')
  async updateFeeStructure(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: any,
  ) {
    return this.feesService.updateFeeStructure(schoolId, id, payload);
  }

  @ApiOperation({ summary: 'Delete a fee structure' })
  @Delete('fees/structures/:id')
  async deleteFeeStructure(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.feesService.deleteFeeStructure(schoolId, id);
  }

  @ApiOperation({ summary: 'Get fee categories / heads' })
  @Get('fees/categories')
  async getFeeCategories(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeCategories(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Create a fee category / head' })
  @Post('fees/categories')
  async createFeeCategory(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.createFeeCategory(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Assign fee structure to student' })
  @Post('fees/assign')
  async assignFeesToStudents(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.assignFeesToStudents(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Get student fee invoice ledger history' })
  @Get('students/:studentId/fees')
  async getStudentFeeDetails(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    const workspace = await this.feesService.getFeeWorkspace(
      schoolId,
      sessionFromHeader || undefined,
    );
    const invoices = workspace.invoices.filter(
      (inv: any) => inv.studentId === studentId,
    );
    return invoices.map((inv: any) => ({
      id: `sf-${inv.id}`,
      studentId: inv.studentId,
      studentName: inv.studentName,
      studentCode: inv.studentCode,
      className: inv.className,
      structureId: inv.structureId,
      invoiceId: inv.id,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      concessionAmount: inv.concessionAmount,
      scholarshipAmount: inv.scholarshipAmount,
      fineAmount: inv.fineAmount,
      outstandingAmount: inv.outstandingAmount,
      status: inv.status,
      nextDueDate: inv.dueDate,
    }));
  }

  @ApiOperation({ summary: 'Get student outstanding dues' })
  @Get('students/:studentId/dues')
  async getOutstandingDues(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    const workspace = await this.feesService.getFeeWorkspace(
      schoolId,
      sessionFromHeader || undefined,
    );
    const invoices = workspace.invoices.filter(
      (inv: any) => inv.studentId === studentId && inv.outstandingAmount > 0,
    );
    return invoices.map((inv: any) => ({
      id: `sf-${inv.id}`,
      studentId: inv.studentId,
      studentName: inv.studentName,
      studentCode: inv.studentCode,
      className: inv.className,
      structureId: inv.structureId,
      invoiceId: inv.id,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      concessionAmount: inv.concessionAmount,
      scholarshipAmount: inv.scholarshipAmount,
      fineAmount: inv.fineAmount,
      outstandingAmount: inv.outstandingAmount,
      status: inv.status,
      nextDueDate: inv.dueDate,
    }));
  }

  @ApiOperation({ summary: 'Collect student payment' })
  @Post('payments')
  async collectPayment(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.collectPayment(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Initiate online payment order creation' })
  @Post('payments/online')
  async initiateOnlinePayment(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.initiateOnlinePayment(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Get payment details' })
  @Get('payments/:paymentId')
  async getPaymentDetails(
    @Param('schoolId') schoolId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.feesService.getPaymentDetails(schoolId, paymentId);
  }

  @ApiOperation({ summary: 'Generate manual receipt for payment' })
  @Post('receipts/generate')
  async generateReceipt(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body('paymentId') paymentId: string,
  ) {
    const workspace = await this.feesService.getFeeWorkspace(
      schoolId,
      sessionFromHeader || undefined,
    );
    const match = workspace.receipts.find(
      (r: any) => r.paymentId === paymentId,
    );
    return (
      match || {
        id: 'mock',
        receiptNumber: 'RCPT-ERR',
        studentName: '',
        amount: 0,
        issuedAt: new Date().toISOString(),
      }
    );
  }

  @ApiOperation({ summary: 'Get receipt details' })
  @Get('receipts/:receiptId')
  async getReceipt(
    @Param('schoolId') schoolId: string,
    @Param('receiptId') receiptId: string,
  ) {
    const workspace = await this.feesService.getFeeWorkspace(schoolId);
    const match = workspace.receipts.find(
      (r: any) => r.id === receiptId || r.receiptNumber === receiptId,
    );
    return match || null;
  }

  @ApiOperation({ summary: 'Create refund record' })
  @Post('refunds')
  async createRefund(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.createRefund(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Apply discount/concession' })
  @Post('concessions')
  async applyConcession(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.applyConcession(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Apply scholarship' })
  @Post('scholarships')
  async applyScholarship(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.applyScholarship(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }

  @ApiOperation({ summary: 'Get standard late fee rules' })
  @Get('fees/late-rules')
  async getLateFeeRules(@Param('schoolId') schoolId: string) {
    return [
      {
        id: 'rule-standard',
        name: 'Standard fine rule',
        graceDays: 5,
        amountPerDay: 50,
        maxAmount: 1000,
        isActive: true,
      },
    ];
  }

  @ApiOperation({ summary: 'Get reports summary' })
  @Get('fees/reports')
  async getReports(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeReports(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Get analytics summary' })
  @Get('fees/analytics')
  async getAnalytics(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeAnalytics(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Send due reminders' })
  @Post('fees/reminders')
  async sendReminders(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.sendDueReminders(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Get fee system settings' })
  @Get('fees/settings')
  async getFeeSettings(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
  ) {
    return this.feesService.getFeeSettings(
      schoolId,
      sessionFromHeader || undefined,
    );
  }

  @ApiOperation({ summary: 'Update fee system settings' })
  @Patch('fees/settings')
  async updateFeeSettings(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Body() payload: any,
  ) {
    return this.feesService.updateFeeSettings(
      schoolId,
      sessionFromHeader || undefined,
      payload,
    );
  }
}
