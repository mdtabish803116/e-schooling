import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { InvoiceStatusEnum } from '../../enums/enums';

@Entity({ name: 'invoices', schema: 'e_schooling' })
export class Invoice {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'school_subscription_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolSubscription' })
  schoolSubscriptionId: string;

  @Column({ name: 'invoice_number', type: 'varchar', nullable: true, comment: 'Invoice number' })
  invoiceNumber: string;

  @Column({ name: 'subtotal', type: 'decimal', nullable: true, comment: 'Subtotal amount' })
  subtotal: number;

  @Column({ name: 'tax', type: 'decimal', nullable: true, comment: 'Tax amount' })
  tax: number;

  @Column({ name: 'total', type: 'decimal', nullable: true, comment: 'Total amount' })
  total: number;

  @Column({ name: 'due_date', type: 'date', nullable: true, comment: 'Due date' })
  dueDate: string;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'paid | unpaid | overdue' })
  status: InvoiceStatusEnum;

  @Column({ name: 'invoice_pdf_url', type: 'varchar', nullable: true, comment: 'Invoice PDF URL' })
  invoicePdfUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
