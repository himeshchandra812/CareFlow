import { User } from '../types/index.js';

const TOKEN_KEY = 'careflow_auth_token';
const USER_KEY = 'careflow_current_user';

export const authService = {
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(user: User, token: string) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid email or password');
    }
    const data = await res.json();
    this.setSession(data.user, data.token);
    return data;
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'patient' | 'doctor' | 'staff' | 'hospital_admin';
    accessibilityMode?: boolean;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const resData = await res.json();
    this.setSession(resData.user, resData.token);
    return resData;
  },

  async checkSession(): Promise<User | null> {
    const token = this.getToken();
    const user = this.getCurrentUser();
    if (!token || !user) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'x-user-id': user._id,
          'x-user-role': user.role
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.setSession(data.user, token);
        return data.user;
      }
    } catch {}
    return user; // fallback to stored user if offline/memory
  },

  demoLogin(role: 'patient' | 'doctor' | 'staff' | 'hospital_admin'): User {
    let demoUser: User;
    if (role === 'doctor') {
      demoUser = {
        _id: 'user_doctor_1',
        name: 'Dr. Anil Sharma',
        email: 'doctor.demo@careflow.app',
        phone: '+919822233344',
        role: 'doctor',
        specialization: 'Senior Cardiologist',
        departmentId: 'dept_cardiology',
        departmentName: 'Cardiology',
        hospitalId: 'hosp_careflow_01',
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else if (role === 'staff') {
      demoUser = {
        _id: 'user_staff_1',
        name: 'EMT Staff Operator',
        email: 'staff.demo@careflow.app',
        phone: '+919844455566',
        role: 'staff',
        hospitalId: 'hosp_careflow_01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else if (role === 'hospital_admin') {
      demoUser = {
        _id: 'user_admin_1',
        name: 'Hospital Admin Director',
        email: 'admin.demo@careflow.app',
        phone: '+919855566677',
        role: 'hospital_admin',
        hospitalId: 'hosp_careflow_01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      demoUser = {
        _id: 'user_patient_1',
        name: 'Rajesh Kumar',
        email: 'patient.demo@careflow.app',
        phone: '+919876543210',
        role: 'patient',
        accessibilityMode: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    this.setSession(demoUser, `demo_token_${demoUser._id}`);
    return demoUser;
  }
};
