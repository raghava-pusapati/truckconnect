export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  address: string;
  lorryType: string;
  maxCapacity: number;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  documents?: {
    license: string;
    rc: string;
    fitness: string;
    insurance: string;
    medical: string;
    allIndiaPermit?: string;
  };
}

export interface Load {
  id: string;
  customerId: string;
  source: string;
  destination: string;
  loadType: string;
  quantity: number;
  estimatedFare: number;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  customerDetails?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  applicants?: Array<{
    driverId: string;
    name: string;
    mobile: string;
    lorryType: string;
    maxCapacity: number;
    appliedAt: string;
  }>;
  assignedDriver?: {
    driverId: string;
    name: string;
    mobile: string;
    lorryType: string;
    maxCapacity: number;
    assignedAt: string;
  };
}

export interface DriverApplicant {
  driverId: string;
  name: string;
  phone: string;
  status: string;
  bid?: number;
  documents?: {
    license?: string;
    rc?: string;
    fitness?: string;
    insurance?: string;
    medical?: string;
    allIndiaPermit?: string;
  };
} 

