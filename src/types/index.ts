export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: 'customer' | 'driver' | 'admin';
}

export interface Customer extends User {
  role: 'customer';
}

export interface Driver extends User {
  role: 'driver';
  address: string;
  lorryType: string;
  maxCapacity: number;
  documents: {
    license: string;
    rc: string;
    fitness: string;
    insurance: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Load {
  id: string;
  customerId: string;
  source: string;
  destination: string;
  estimatedFare: number;
  loadType: string;
  quantity: number;
  status: 'pending' | 'assigned' | 'completed';
  applicants: string[]; // Array of driver IDs
  assignedDriver?: string;
  createdAt: string;
  completedAt?: string;
}