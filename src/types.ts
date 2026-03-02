export interface Batch {
  id: string;
  buyer: string;
  style: string;
  color: string;
  apm_name: string;
  senior_executive: string;
  quantity: number;
  batch_type: string;
  special_notes: string;
  created_at: string;
}

export interface Scan {
  id: number;
  batch_id: string;
  status: string;
  location: string;
  worker_name: string;
  machine_no?: string;
  ok_qty?: number;
  issued_qty?: number;
  rejected_qty?: number;
  shift?: 'Day' | 'Night';
  timestamp: string;
  style?: string;
  buyer?: string;
}
