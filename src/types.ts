export interface Batch {
  id: string;
  buyer: string;
  style: string;
  color: string;
  apm_name: string;
  senior_executive: string;
  quantity: number;
  special_notes: string;
  created_at: string;
}

export interface Scan {
  id: number;
  batch_id: string;
  status: string;
  location: string;
  worker_name: string;
  timestamp: string;
  style?: string;
  buyer?: string;
}
