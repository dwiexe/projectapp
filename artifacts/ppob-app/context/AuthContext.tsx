import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { userApi } from "@/services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "@ppob_user";
const USERS_KEY = "@ppob_users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const getUsers = async (): Promise<Record<string, User & { password: string }>> => {
    const stored = await AsyncStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  };

  const saveUsers = async (users: Record<string, User & { password: string }>) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const login = useCallback(async (email: string, password: string) => {
    // 1. TEMBAK LANGSUNG KE SERVER VPS DULU!
    try {
      await userApi.login(email, password);
    } catch (error) {
      throw new Error("Gagal terhubung ke server VPS atau kredensial salah");
    }

    // 2. Kalau VPS lolos, cek memori lokal HP
    const users = await getUsers();
    let userData = Object.values(users).find((u) => u.email === email);

    // 3. Kalau akun hilang dari memori HP (karena Clear Data), kita buatkan "bayangannya" lagi
    if (!userData) {
      userData = {
        id: Date.now().toString(), // ID Darurat sementara
        name: email.split("@")[0], // Ambil nama dari email
        email: email,
        phone: "-",
        balance: 0,
        password: password,
      };
      users[userData.id] = userData;
      await saveUsers(users); // Simpan kembali ke HP
    }

    const { password: _, ...userWithoutPassword } = userData;
    setUser(userWithoutPassword);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
  }, []);

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string) => {
      const users = await getUsers();
      const exists = Object.values(users).find((u) => u.email === email);
      if (exists) throw new Error("Email sudah terdaftar");

      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        balance: 1000,
        password,
      };

      users[newUser.id] = newUser;
      await saveUsers(users);

      const { password: _, ...withoutPw } = newUser;
      setUser(withoutPw);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPw));
      userApi.register({ id: newUser.id, name, email, phone, password, balance: 100000 });
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const users = await getUsers();
    const exists = Object.values(users).find((u) => u.email === email);
    if (!exists) throw new Error("Email tidak ditemukan");
  }, []);

  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!user) return;
      const users = await getUsers();
      if (users[user.id]) {
        users[user.id].balance = newBalance;
        await saveUsers(users);
      }
      const updated = { ...user, balance: newBalance };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      userApi.updateBalance(user.id, newBalance);
    },
    [user]
  );

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const users = await getUsers();
    const fresh = users[user.id];
    if (fresh) {
      const { password: _, ...withoutPw } = fresh;
      setUser(withoutPw);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPw));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resetPassword, updateBalance, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
