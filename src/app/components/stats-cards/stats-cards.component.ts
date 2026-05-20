import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { InvoiceStats } from '../../models/invoice.model';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <mat-card class="stats-card">
        <mat-card-content>
          <div class="flex items-center justify-between">
            <div>
              <p class="stats-label">عدد الفواتير</p>
              <p class="stats-value text-blue-700">{{ stats()?.totalCount ?? 0 }}</p>
            </div>
            <mat-icon class="stats-icon text-blue-400">receipt_long</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card">
        <mat-card-content>
          <div class="flex items-center justify-between">
            <div>
              <p class="stats-label">إجمالي المبيعات</p>
              <p class="stats-value text-green-700">{{ (stats()?.totalAmount ?? 0) | number:'1.2-2' }}</p>
            </div>
            <mat-icon class="stats-icon text-green-400">attach_money</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card">
        <mat-card-content>
          <div class="flex items-center justify-between">
            <div>
              <p class="stats-label">إجمالي المقبوضات</p>
              <p class="stats-value text-emerald-700">{{ (stats()?.totalPaid ?? 0) | number:'1.2-2' }}</p>
            </div>
            <mat-icon class="stats-icon text-emerald-400">payments</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card">
        <mat-card-content>
          <div class="flex items-center justify-between">
            <div>
              <p class="stats-label">إجمالي الديون</p>
              <p class="stats-value" [class.text-red-700]="(stats()?.totalDebt ?? 0) > 0" [class.text-green-700]="(stats()?.totalDebt ?? 0) === 0">
                {{ (stats()?.totalDebt ?? 0) | number:'1.2-2' }}
              </p>
            </div>
            <mat-icon class="stats-icon" [class.text-red-400]="(stats()?.totalDebt ?? 0) > 0" [class.text-green-400]="(stats()?.totalDebt ?? 0) === 0">account_balance_wallet</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-card {
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    }
    .stats-label {
      font-size: 0.78rem;
      color: #666;
      margin-bottom: 4px;
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    .stats-value {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }
    .stats-icon {
      font-size: 2.5rem !important;
      width: 2.5rem !important;
      height: 2.5rem !important;
      opacity: 0.6;
    }
  `]
})
export class StatsCardsComponent {
  stats = input<InvoiceStats | null>(null);
}
