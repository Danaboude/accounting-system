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
    <div class="stats-grid">
      <mat-card class="stats-card">
        <mat-card-content>
          <div class="card-inner">
            <div>
              <p class="stats-label">عدد الفواتير</p>
              <p class="stats-value">{{ stats()?.totalCount ?? 0 }}</p>
            </div>
            <mat-icon class="stats-icon">receipt_long</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card">
        <mat-card-content>
          <div class="card-inner">
            <div>
              <p class="stats-label">إجمالي المبيعات</p>
              <p class="stats-value">{{ (stats()?.totalAmount ?? 0) | number:'1.2-2' }}</p>
            </div>
            <mat-icon class="stats-icon">attach_money</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card">
        <mat-card-content>
          <div class="card-inner">
            <div>
              <p class="stats-label">إجمالي المقبوضات</p>
              <p class="stats-value">{{ (stats()?.totalPaid ?? 0) | number:'1.2-2' }}</p>
            </div>
            <mat-icon class="stats-icon">payments</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stats-card" [class.debt-card]="(stats()?.totalDebt ?? 0) > 0">
        <mat-card-content>
          <div class="card-inner">
            <div>
              <p class="stats-label">إجمالي الديون</p>
              <p class="stats-value" [class.debt-value]="(stats()?.totalDebt ?? 0) > 0">
                {{ (stats()?.totalDebt ?? 0) | number:'1.2-2' }}
              </p>
            </div>
            <mat-icon class="stats-icon" [class.debt-icon]="(stats()?.totalDebt ?? 0) > 0">account_balance_wallet</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .stats-card {
      border-radius: 8px !important;
      border: 1px solid #e0e0e0 !important;
      box-shadow: none !important;
    }
    .card-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stats-label {
      font-size: 0.78rem;
      color: #666;
      margin: 0 0 6px 0;
    }
    .stats-value {
      font-size: 1.45rem;
      font-weight: 700;
      color: #111;
      line-height: 1;
      margin: 0;
    }
    .stats-icon {
      font-size: 2.2rem !important;
      width: 2.2rem !important;
      height: 2.2rem !important;
      color: #999;
    }
    .debt-card { border-color: #ffcdd2 !important; background: #fff8f8 !important; }
    .debt-value { color: #c62828 !important; }
    .debt-icon  { color: #e57373 !important; }
  `]
})
export class StatsCardsComponent {
  stats = input<InvoiceStats | null>(null);
}
