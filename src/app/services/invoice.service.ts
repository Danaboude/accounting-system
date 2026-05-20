import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, InvoiceFilters, InvoiceFormData, InvoicesResponse } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private baseUrl = '/api/invoices';

  getInvoices(filters?: InvoiceFilters): Observable<InvoicesResponse> {
    let params = new HttpParams();
    if (filters?.client) params = params.set('client', filters.client);
    if (filters?.month) params = params.set('month', filters.month);
    if (filters?.week) params = params.set('week', filters.week.toString());
    return this.http.get<InvoicesResponse>(this.baseUrl, { params });
  }

  createInvoice(data: InvoiceFormData): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, data);
  }

  updateInvoice(id: number, data: Partial<InvoiceFormData>): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.baseUrl}/${id}`, data);
  }

  deleteInvoice(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  runMigration(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>('/api/migrate');
  }

  importExcel(file: File): Observable<{ inserted: number; errors: string[]; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ inserted: number; errors: string[]; message: string }>(
      '/api/import',
      formData
    );
  }
}
