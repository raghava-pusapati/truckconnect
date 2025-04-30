import { User, Load, Customer, Driver } from '../types';

const compressImage = async (base64: string): Promise<string> => {
  
  const img = new Image();
  img.src = base64;
  
  await new Promise(resolve => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let width = img.width;
  let height = img.height;
  const maxSize = 800;

  if (width > height && width > maxSize) {
    height = (height * maxSize) / width;
    width = maxSize;
  } else if (height > maxSize) {
    width = (width * maxSize) / height;
    height = maxSize;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.5);
};

export const storage = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem('users') || '[]');
  },

  saveUser: async (user: Customer | Driver) => {
    const users = storage.getUsers();
    
    if (user.role === 'driver') {
      (user as Driver).status = 'pending';
      
      
      const documents = user.documents;
      const compressedDocuments = {
        license: await compressImage(documents.license),
        rc: await compressImage(documents.rc),
        fitness: await compressImage(documents.fitness),
        insurance: await compressImage(documents.insurance)
      };
      
      (user as Driver).documents = compressedDocuments;
    }
    
    users.push(user);
    
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please use smaller image files or clear some space.');
      }
      throw error;
    }
  },

  updateDriverStatus: (driverId: string, status: 'accepted' | 'rejected', rejectionReason?: string) => {
    const users = storage.getUsers();
    const index = users.findIndex(user => user.id === driverId);
    if (index !== -1) {
      const driver = users[index] as Driver;
      driver.status = status;
      if (status === 'rejected' && rejectionReason) {
        driver.rejectionReason = rejectionReason;
      }
      localStorage.setItem('users', JSON.stringify(users));
    }
  },

  getLoads: (): Load[] => {
    return JSON.parse(localStorage.getItem('loads') || '[]');
  },

  saveLoad: (load: Load) => {
    const loads = storage.getLoads();
    loads.push(load);
    localStorage.setItem('loads', JSON.stringify(loads));
  },

  updateLoad: (updatedLoad: Load) => {
    const loads = storage.getLoads();
    const index = loads.findIndex(load => load.id === updatedLoad.id);
    if (index !== -1) {
      loads[index] = updatedLoad;
      
      
      if (updatedLoad.assignedDriver) {
        loads.forEach((load, i) => {
          if (i !== index && load.applicants.includes(updatedLoad.assignedDriver!)) {
            load.applicants = load.applicants.filter(id => id !== updatedLoad.assignedDriver);
          }
        });
      }
      
      localStorage.setItem('loads', JSON.stringify(loads));
    }
  },

  completeLoad: (loadId: string) => {
    const loads = storage.getLoads();
    const index = loads.findIndex(load => load.id === loadId);
    if (index !== -1) {
      loads[index].status = 'completed';
      loads[index].completedAt = new Date().toISOString();
      localStorage.setItem('loads', JSON.stringify(loads));
    }
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
};