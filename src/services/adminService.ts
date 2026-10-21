import { AdminUser } from '../types/attendance';

const STORAGE_KEY = 'pagueplay_admin_users_v1';
const CURRENT_ADMIN_KEY = 'pagueplay_current_admin_user_v1';

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'adm-master',
    name: 'Administrador Master',
    cargo: 'Controle Geral de Ausências',
    email: 'admin@pagueplay.com.br',
    pin: '1234',
    setor: 'Todos os Setores',
    createdAt: '2026-01-01',
    isMaster: true,
  },
  {
    id: 'adm-bruno',
    name: 'Bruno Dalbello',
    cargo: 'Gestão Operacional & Pessoas',
    email: 'brunodalbello25@gmail.com',
    pin: '5678',
    setor: 'Todos os Setores',
    createdAt: '2026-09-01',
    isMaster: false,
  },
];

export function getAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADMINS));
      return DEFAULT_ADMINS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure master admin is always present
      const hasMaster = parsed.some((u) => u.isMaster || u.id === 'adm-master');
      if (!hasMaster) {
        parsed.unshift(DEFAULT_ADMINS[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_ADMINS;
  } catch (err) {
    console.error('Erro ao ler lista de administradores:', err);
    return DEFAULT_ADMINS;
  }
}

export function saveAdminUser(user: Omit<AdminUser, 'id' | 'createdAt'> & { id?: string }): AdminUser {
  const users = getAdminUsers();
  const existingIdx = user.id ? users.findIndex((u) => u.id === user.id) : -1;

  if (existingIdx >= 0) {
    const updated: AdminUser = {
      ...users[existingIdx],
      name: user.name.trim(),
      cargo: user.cargo.trim() || 'Administrador',
      email: user.email?.trim() || '',
      pin: user.pin.trim(),
      setor: user.setor || 'Todos os Setores',
    };
    users[existingIdx] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return updated;
  } else {
    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: user.name.trim(),
      cargo: user.cargo.trim() || 'Administrador',
      email: user.email?.trim() || '',
      pin: user.pin.trim(),
      setor: user.setor || 'Todos os Setores',
      createdAt: new Date().toISOString().slice(0, 10),
      isMaster: false,
    };
    users.push(newAdmin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newAdmin;
  }
}

export function deleteAdminUser(id: string): boolean {
  const users = getAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target || target.isMaster) {
    return false; // cannot delete master
  }
  const filtered = users.filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function verifyAdminPin(enteredPin: string, selectedUserId?: string): AdminUser | null {
  const users = getAdminUsers();
  const cleanPin = enteredPin.trim();

  if (selectedUserId) {
    const user = users.find((u) => u.id === selectedUserId);
    if (user && user.pin === cleanPin) {
      return user;
    }
  }

  // Check if matches any valid admin PIN
  const matched = users.find((u) => u.pin === cleanPin);
  return matched || null;
}

export function getCurrentAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_ADMIN_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return null;
}

export function setCurrentAdmin(user: AdminUser | null): void {
  if (user) {
    localStorage.setItem(CURRENT_ADMIN_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_ADMIN_KEY);
  }
}
