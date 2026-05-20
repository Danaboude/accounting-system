import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { InvoiceService } from '../../services/invoice.service';
import { Invoice, InvoiceFilters, InvoiceStats } from '../../models/invoice.model';
import { StatsCardsComponent } from '../../components/stats-cards/stats-cards.component';
import { FiltersBarComponent } from '../../components/filters-bar/filters-bar.component';
import { InvoiceFormComponent } from '../../components/invoice-form/invoice-form.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    StatsCardsComponent,
    FiltersBarComponent,
  ],
  template: `
    <div class="page-wrapper" dir="rtl">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="header-title">
            <mat-icon class="header-icon">receipt_long</mat-icon>
            <div>
              <h1>نظام إدارة الفواتير</h1>
              <p class="header-sub">Arabic Accounting System</p>
            </div>
          </div>
          <div class="header-actions">
            <button mat-raised-button (click)="downloadTemplate()" class="btn-teal" matTooltip="تحميل نموذج Excel">
              <mat-icon>download</mat-icon>
              تحميل النموذج
            </button>
            <button mat-raised-button (click)="triggerImport()" class="btn-orange" matTooltip="استيراد من Excel">
              <mat-icon>upload_file</mat-icon>
              استيراد Excel
            </button>
            <button mat-raised-button (click)="exportExcel()" class="btn-green" matTooltip="تصدير إلى Excel">
              <mat-icon>table_view</mat-icon>
              تصدير Excel
            </button>
            <button mat-raised-button (click)="printPDF()" class="btn-blue" matTooltip="طباعة PDF">
              <mat-icon>print</mat-icon>
              طباعة PDF
            </button>
            <button mat-raised-button color="primary" (click)="openAddDialog()" class="btn-add">
              <mat-icon>add</mat-icon>
              إضافة فاتورة
            </button>
            <input #fileInput type="file" accept=".xlsx,.xls" style="display:none" (change)="onFileSelected($event)" />
          </div>
        </div>
      </header>

      <div class="page-body">
        <!-- Stats -->
        <app-stats-cards [stats]="stats()" />

        <!-- Filters -->
        <app-filters-bar (filtersChanged)="onFiltersChanged($event)" />

        <!-- Table Card -->
        <div class="table-card">
          <!-- Table toolbar -->
          <div class="table-toolbar">
            <span class="table-count">
              <mat-icon>list</mat-icon>
              {{ invoices().length }} فاتورة
            </span>
            @if (loading()) {
              <mat-spinner diameter="24"></mat-spinner>
            }
          </div>

          <mat-divider></mat-divider>

          <!-- Loading overlay -->
          @if (loading() && invoices().length === 0) {
            <div class="loading-state">
              <mat-spinner diameter="48"></mat-spinner>
              <p>جاري التحميل...</p>
            </div>
          }

          <!-- Empty state -->
          @if (!loading() && invoices().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>لا توجد فواتير</p>
              <button mat-raised-button color="primary" (click)="openAddDialog()">
                <mat-icon>add</mat-icon>
                إضافة فاتورة جديدة
              </button>
            </div>
          }

          <!-- Table -->
          @if (invoices().length > 0) {
            <div class="table-wrapper">
              <table mat-table [dataSource]="dataSource" class="invoices-table">

                <!-- رقم الفاتورة -->
                <ng-container matColumnDef="invoice_number">
                  <th mat-header-cell *matHeaderCellDef class="col-num">رقم الفاتورة</th>
                  <td mat-cell *matCellDef="let row" class="col-num">
                    <span class="invoice-num-badge">{{ row.invoice_number }}</span>
                  </td>
                </ng-container>

                <!-- اسم العميل -->
                <ng-container matColumnDef="client_name">
                  <th mat-header-cell *matHeaderCellDef>اسم العميل</th>
                  <td mat-cell *matCellDef="let row" class="client-cell">{{ row.client_name }}</td>
                </ng-container>

                <!-- إجمالي الفاتورة -->
                <ng-container matColumnDef="total_amount">
                  <th mat-header-cell *matHeaderCellDef class="col-amount">اجمالي الفاتورة</th>
                  <td mat-cell *matCellDef="let row" class="col-amount amount-cell">
                    {{ row.total_amount | number:'1.2-2' }}
                  </td>
                </ng-container>

                <!-- المقبوضات -->
                <ng-container matColumnDef="paid_amount">
                  <th mat-header-cell *matHeaderCellDef class="col-amount">المقبوضات</th>
                  <td mat-cell *matCellDef="let row" class="col-amount amount-cell paid-cell">
                    {{ row.paid_amount | number:'1.2-2' }}
                  </td>
                </ng-container>

                <!-- الديون -->
                <ng-container matColumnDef="debt">
                  <th mat-header-cell *matHeaderCellDef class="col-amount">الديون</th>
                  <td mat-cell *matCellDef="let row" class="col-amount"
                    [class.debt-positive]="row.debt > 0"
                    [class.debt-zero]="row.debt <= 0">
                    {{ row.debt | number:'1.2-2' }}
                  </td>
                </ng-container>

                <!-- التاريخ -->
                <ng-container matColumnDef="invoice_date">
                  <th mat-header-cell *matHeaderCellDef class="col-date">التاريخ</th>
                  <td mat-cell *matCellDef="let row" class="col-date">
                    {{ row.invoice_date | date:'yyyy/MM/dd' }}
                  </td>
                </ng-container>

                <!-- إجراءات -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="col-actions">إجراءات</th>
                  <td mat-cell *matCellDef="let row" class="col-actions">
                    <button mat-icon-button color="primary" (click)="openEditDialog(row)" matTooltip="تعديل">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteInvoice(row)" matTooltip="حذف">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="invoice-row"></tr>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      background: #f0f4f8;
      direction: rtl;
    }

    /* Header */
    .app-header {
      background: linear-gradient(135deg, #006100 0%, #00820f 100%);
      color: white;
      padding: 0;
      box-shadow: 0 2px 12px rgba(0,97,0,0.3);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      font-size: 2.5rem !important;
      width: 2.5rem !important;
      height: 2.5rem !important;
      opacity: 0.9;
    }
    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    .header-sub {
      font-size: 0.78rem;
      opacity: 0.75;
      margin: 2px 0 0;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Button colors */
    .btn-teal { background: #0097a7 !important; color: white !important; }
    .btn-orange { background: #f57c00 !important; color: white !important; }
    .btn-green { background: #2e7d32 !important; color: white !important; }
    .btn-blue { background: #1565c0 !important; color: white !important; }
    .btn-add { background: #43a047 !important; color: white !important; }

    /* Page body */
    .page-body {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Table card */
    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
    }
    .table-count {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      color: #006100;
      font-weight: 600;
    }

    /* States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
      color: #888;
    }
    .empty-state mat-icon {
      font-size: 4rem !important;
      width: 4rem !important;
      height: 4rem !important;
      opacity: 0.3;
    }

    /* Table */
    .table-wrapper {
      overflow-x: auto;
    }
    .invoices-table {
      width: 100%;
      direction: rtl;
    }

    /* Columns */
    .col-num { width: 100px; text-align: center; }
    .col-amount { width: 140px; text-align: left; }
    .col-date { width: 120px; }
    .col-actions { width: 100px; text-align: center; }

    /* Cells */
    .invoice-num-badge {
      background: #e8f5e9;
      color: #006100;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .client-cell {
      font-weight: 500;
    }
    .amount-cell {
      font-family: monospace;
      font-size: 0.95rem;
    }
    .paid-cell {
      color: #2e7d32;
      font-weight: 500;
    }
    .debt-positive {
      background-color: #ffebee !important;
      color: #c62828 !important;
      font-weight: 700;
      text-align: left;
    }
    .debt-zero {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
      font-weight: 500;
      text-align: left;
    }

    /* Header row */
    :host ::ng-deep .mat-mdc-header-row {
      background-color: #006100 !important;
    }
    :host ::ng-deep .mat-mdc-header-cell {
      color: white !important;
      font-weight: 700 !important;
      font-size: 0.95rem !important;
      font-family: 'Segoe UI', Tahoma, sans-serif !important;
    }
    :host ::ng-deep .invoice-row:hover {
      background-color: #f1f8e9 !important;
      transition: background-color 0.15s ease;
    }
    :host ::ng-deep .mat-mdc-row:nth-child(even) {
      background-color: #fafafa;
    }
  `]
})
export class InvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  invoices = signal<Invoice[]>([]);
  stats = signal<InvoiceStats | null>(null);
  loading = signal(false);
  currentFilters = signal<InvoiceFilters>({});

  displayedColumns = ['invoice_number', 'client_name', 'total_amount', 'paid_amount', 'debt', 'invoice_date', 'actions'];

  get dataSource() {
    return new MatTableDataSource(this.invoices());
  }

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices(filters?: InvoiceFilters) {
    this.loading.set(true);
    this.invoiceService.getInvoices(filters ?? this.currentFilters()).subscribe({
      next: (response) => {
        this.invoices.set(response.invoices);
        this.stats.set(response.stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('خطأ في تحميل البيانات: ' + err.message, 'إغلاق', { duration: 5000 });
      }
    });
  }

  onFiltersChanged(filters: InvoiceFilters) {
    this.currentFilters.set(filters);
    this.loadInvoices(filters);
  }

  openAddDialog() {
    const nextNum = (this.stats()?.totalCount ?? 0) > 0
      ? Math.max(...this.invoices().map(i => i.invoice_number)) + 1
      : 1;

    const ref = this.dialog.open(InvoiceFormComponent, {
      width: '500px',
      data: { nextInvoiceNumber: nextNum },
      direction: 'rtl',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.invoiceService.createInvoice(result).subscribe({
          next: () => {
            this.snackBar.open('تمت إضافة الفاتورة بنجاح', 'إغلاق', { duration: 3000 });
            this.loadInvoices();
          },
          error: (err) => {
            this.snackBar.open('خطأ في الإضافة: ' + err.message, 'إغلاق', { duration: 5000 });
          }
        });
      }
    });
  }

  openEditDialog(invoice: Invoice) {
    const ref = this.dialog.open(InvoiceFormComponent, {
      width: '500px',
      data: { invoice },
      direction: 'rtl',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.invoiceService.updateInvoice(invoice.id, result).subscribe({
          next: () => {
            this.snackBar.open('تم تحديث الفاتورة بنجاح', 'إغلاق', { duration: 3000 });
            this.loadInvoices();
          },
          error: (err) => {
            this.snackBar.open('خطأ في التحديث: ' + err.message, 'إغلاق', { duration: 5000 });
          }
        });
      }
    });
  }

  deleteInvoice(invoice: Invoice) {
    const confirmed = confirm(`هل أنت متأكد من حذف الفاتورة رقم ${invoice.invoice_number} للعميل "${invoice.client_name}"؟`);
    if (!confirmed) return;

    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        this.snackBar.open('تم حذف الفاتورة بنجاح', 'إغلاق', { duration: 3000 });
        this.loadInvoices();
      },
      error: (err) => {
        this.snackBar.open('خطأ في الحذف: ' + err.message, 'إغلاق', { duration: 5000 });
      }
    });
  }

  // ============ EXCEL EXPORT ============
  exportExcel() {
    import('xlsx').then((XLSX) => {
      const data = this.invoices().map(inv => ({
        'رقم الفاتورة': inv.invoice_number,
        'اسم العميل': inv.client_name,
        'اجمالي الفاتورة': inv.total_amount,
        'المقبوضات': inv.paid_amount,
        'الديون': inv.debt,
        'التاريخ': inv.invoice_date,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');

      // Style header
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cell]) continue;
        ws[cell].s = {
          fill: { fgColor: { rgb: 'C6EFCE' } },
          font: { color: { rgb: '006100' }, bold: true },
          alignment: { horizontal: 'center' }
        };
      }

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }
      ];

      XLSX.writeFile(wb, `فواتير_${new Date().toISOString().split('T')[0]}.xlsx`);
      this.snackBar.open('تم تصدير الملف بنجاح', 'إغلاق', { duration: 3000 });
    });
  }

  // ============ TEMPLATE DOWNLOAD ============
  downloadTemplate() {
    import('xlsx').then((XLSX) => {
      const headers = [['رقم الفاتورة', 'اسم العميل', 'اجمالي الفاتورة', 'المقبوضات', 'التاريخ']];
      const exampleRow = ['', 'مثال: محمد علي', '1000.00', '500.00', new Date().toISOString().split('T')[0]];
      const ws = XLSX.utils.aoa_to_sheet([headers[0], exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'نموذج');
      ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
      XLSX.writeFile(wb, 'نموذج_استيراد_فواتير.xlsx');
      this.snackBar.open('تم تحميل النموذج بنجاح', 'إغلاق', { duration: 3000 });
    });
  }

  // ============ IMPORT ============
  triggerImport() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loading.set(true);
    this.invoiceService.importExcel(file).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.snackBar.open(`${result.message}`, 'إغلاق', { duration: 5000 });
        this.loadInvoices();
        input.value = '';
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('خطأ في الاستيراد: ' + err.message, 'إغلاق', { duration: 5000 });
        input.value = '';
      }
    });
  }

  // ============ PDF PRINT ============
  printPDF() {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Invoices Report', 148, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString('ar-EG')}`, 148, 22, { align: 'center' });

        // Stats
        const s = this.stats();
        if (s) {
          doc.setFontSize(9);
          doc.text(
            `Total Invoices: ${s.totalCount}  |  Total Amount: ${s.totalAmount.toFixed(2)}  |  Total Paid: ${s.totalPaid.toFixed(2)}  |  Total Debt: ${s.totalDebt.toFixed(2)}`,
            148, 29, { align: 'center' }
          );
        }

        const rows = this.invoices().map(inv => [
          inv.invoice_number.toString(),
          inv.client_name,
          inv.total_amount.toFixed(2),
          inv.paid_amount.toFixed(2),
          inv.debt.toFixed(2),
          inv.invoice_date,
        ]);

        (doc as any).autoTable({
          head: [['Invoice #', 'Client Name', 'Total Amount', 'Paid Amount', 'Debt', 'Date']],
          body: rows,
          startY: 34,
          styles: { fontSize: 9, halign: 'center' },
          headStyles: { fillColor: [0, 97, 0], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 248, 240] },
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
              const debt = parseFloat(data.cell.raw);
              if (debt > 0) {
                data.cell.styles.fillColor = [255, 235, 238];
                data.cell.styles.textColor = [198, 40, 40];
              } else {
                data.cell.styles.fillColor = [232, 245, 233];
                data.cell.styles.textColor = [46, 125, 50];
              }
            }
          },
        });

        doc.save(`invoices_${new Date().toISOString().split('T')[0]}.pdf`);
        this.snackBar.open('تم تصدير PDF بنجاح', 'إغلاق', { duration: 3000 });
      });
    });
  }
}
