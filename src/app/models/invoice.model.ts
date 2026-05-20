export interface Invoice {
  id: number;
  invoice_number: number;
  client_name: string;
  total_amount: number;
  paid_amount: number;
  debt: number;
  invoice_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceStats {
  totalCount: number;
  totalAmount: number;
  totalPaid: number;
  totalDebt: number;
}

export interface ClientSummary {
  client_name: string;
  total_amount: number;
  paid_amount: number;
  debt: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  stats: InvoiceStats;
  clientSummary: ClientSummary[];
}

export interface InvoiceFilters {
  client?: string;
  month?: string;
  week?: number;
}

export interface InvoiceFormData {
  client_name: string;
  total_amount: number;
  paid_amount: number;
  invoice_date: string;
}
