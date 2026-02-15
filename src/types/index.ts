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
  driverRated?: boolean;
  customerRated?: boolean;
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
    averageRating?: number;
    totalRatings?: number;
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
    averageRating?: number;
    totalRatings?: number;
  }>;
  assignedDriver?: {
    driverId: string;
    name: string;
    mobile: string;
    lorryType: string;
    maxCapacity: number;
    assignedAt: string;
    averageRating?: number;
    totalRatings?: number;
  };
}

export interface DriverApplicant {
  driverId: string;
  name: string;
  phone: string;
  mobile?: string;
  status: string;
  lorryType?: string;
  maxCapacity?: string | number;
  appliedAt?: string;
  averageRating?: number;
  totalRatings?: number;
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



