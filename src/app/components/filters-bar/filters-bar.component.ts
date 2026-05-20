import { Component, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InvoiceFilters } from '../../models/invoice.model';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="filters-container">
      <!-- Client filter -->
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>اسم العميل</mat-label>
        <input matInput [(ngModel)]="clientFilter" placeholder="ابحث باسم العميل" (keyup.enter)="applyFilters()" />
        <mat-icon matSuffix>person_search</mat-icon>
      </mat-form-field>

      <!-- Month filter -->
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>الشهر (YYYY-MM)</mat-label>
        <input matInput [(ngModel)]="monthFilter" type="month" (change)="applyFilters()" />
        <mat-icon matSuffix>calendar_month</mat-icon>
      </mat-form-field>

      <!-- Week filter -->
      <mat-form-field appearance="outline" class="filter-field filter-field-sm">
        <mat-label>الأسبوع</mat-label>
        <mat-select [(ngModel)]="weekFilter" (selectionChange)="applyFilters()">
          <mat-option [value]="null">الكل</mat-option>
          <mat-option [value]="1">الأسبوع الأول (1-7)</mat-option>
          <mat-option [value]="2">الأسبوع الثاني (8-14)</mat-option>
          <mat-option [value]="3">الأسبوع الثالث (15-21)</mat-option>
          <mat-option [value]="4">الأسبوع الرابع (22-31)</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Buttons -->
      <button mat-raised-button color="primary" (click)="applyFilters()" class="action-btn">
        <mat-icon>filter_list</mat-icon>
        تطبيق
      </button>

      <button mat-stroked-button (click)="clearFilters()" class="action-btn">
        <mat-icon>clear</mat-icon>
        مسح الفلاتر
      </button>
    </div>
  `,
  styles: [`
    .filters-container {
      direction: rtl;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .filter-field {
      min-width: 180px;
    }
    .filter-field-sm {
      min-width: 160px;
    }
    .action-btn {
      height: 56px;
    }
    mat-form-field {
      direction: rtl;
    }
    @media (max-width: 600px) {
      .filter-field, .filter-field-sm { min-width: 100%; flex: 1 1 100%; }
      .action-btn { flex: 1 1 100%; }
      .filters-container { padding: 12px; }
    }
  `]
})
export class FiltersBarComponent {
  filtersChanged = output<InvoiceFilters>();

  clientFilter = '';
  monthFilter = '';
  weekFilter: number | null = null;

  applyFilters() {
    const filters: InvoiceFilters = {};
    if (this.clientFilter.trim()) filters.client = this.clientFilter.trim();
    if (this.monthFilter) filters.month = this.monthFilter;
    if (this.weekFilter) filters.week = this.weekFilter;
    this.filtersChanged.emit(filters);
  }

  clearFilters() {
    this.clientFilter = '';
    this.monthFilter = '';
    this.weekFilter = null;
    this.filtersChanged.emit({});
  }
}
