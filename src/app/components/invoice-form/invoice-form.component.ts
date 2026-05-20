import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Invoice } from '../../models/invoice.model';

export interface InvoiceDialogData {
  invoice?: Invoice;
  nextInvoiceNumber?: number;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div dir="rtl">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>{{ data?.invoice ? 'edit' : 'add_circle' }}</mat-icon>
        {{ data?.invoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="form" class="form-grid">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>رقم الفاتورة</mat-label>
            <input matInput type="number" formControlName="invoice_number" readonly />
            <mat-icon matSuffix>tag</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>اسم العميل</mat-label>
            <input matInput formControlName="client_name" placeholder="أدخل اسم العميل" />
            <mat-icon matSuffix>person</mat-icon>
            @if (form.get('client_name')?.hasError('required') && form.get('client_name')?.touched) {
              <mat-error>اسم العميل مطلوب</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>إجمالي الفاتورة</mat-label>
            <input matInput type="number" formControlName="total_amount" placeholder="0.00" step="0.01" min="0" />
            <mat-icon matSuffix>attach_money</mat-icon>
            @if (form.get('total_amount')?.hasError('required') && form.get('total_amount')?.touched) {
              <mat-error>إجمالي الفاتورة مطلوب</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>المقبوضات</mat-label>
            <input matInput type="number" formControlName="paid_amount" placeholder="0.00" step="0.01" min="0" />
            <mat-icon matSuffix>payments</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>الدين المتبقي</mat-label>
            <input matInput [value]="computedDebt | number:'1.2-2'" readonly />
            <mat-icon matSuffix>account_balance_wallet</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>التاريخ</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="invoice_date" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if (form.get('invoice_date')?.hasError('required') && form.get('invoice_date')?.touched) {
              <mat-error>التاريخ مطلوب</mat-error>
            }
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button (click)="cancel()">
          <mat-icon>close</mat-icon>
          إلغاء
        </button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
          <mat-icon>save</mat-icon>
          {{ data?.invoice ? 'تحديث' : 'حفظ' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #111;
      font-size: 1.3rem;
      padding: 16px 24px 0;
      direction: rtl;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 380px;
      direction: rtl;
    }
    .full-width {
      width: 100%;
    }
    .dialog-actions {
      padding: 16px 24px;
      gap: 8px;
      direction: rtl;
    }
    mat-dialog-content {
      direction: rtl;
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InvoiceFormComponent>);
  data: InvoiceDialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;

  get computedDebt(): number {
    const total = parseFloat(this.form?.get('total_amount')?.value) || 0;
    const paid = parseFloat(this.form?.get('paid_amount')?.value) || 0;
    return total - paid;
  }

  ngOnInit() {
    const invoice = this.data?.invoice;
    const today = new Date();

    this.form = this.fb.group({
      invoice_number: [{ value: invoice?.invoice_number ?? (this.data?.nextInvoiceNumber ?? 1), disabled: true }],
      client_name: [invoice?.client_name ?? '', [Validators.required]],
      total_amount: [invoice?.total_amount ?? 0, [Validators.required, Validators.min(0)]],
      paid_amount: [invoice?.paid_amount ?? 0, [Validators.min(0)]],
      invoice_date: [invoice?.invoice_date ? new Date(invoice.invoice_date) : today, [Validators.required]],
    });
  }

  save() {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    // Format date
    const dateVal = value.invoice_date;
    let dateStr: string;
    if (dateVal instanceof Date) {
      dateStr = dateVal.toISOString().split('T')[0];
    } else {
      dateStr = dateVal;
    }
    this.dialogRef.close({
      client_name: value.client_name,
      total_amount: parseFloat(value.total_amount) || 0,
      paid_amount: parseFloat(value.paid_amount) || 0,
      invoice_date: dateStr,
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
