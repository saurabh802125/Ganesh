
import { useToast } from "@/components/ui/use-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  watchlist: string[];
}

interface AuthResponse {
  token: string;
}

const API_URL = 'http://localhost:5000/api';

export const AuthService = {
  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      // Store the token
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Store the token
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async addToWatchlist(symbol: string): Promise<string[]> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to add to watchlist');
    }

    try {
      const response = await fetch(`${API_URL}/users/watchlist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ symbol }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to add to watchlist');
      }

      return data;
    } catch (error) {
      console.error('Add to watchlist error:', error);
      throw error;
    }
  },

  async removeFromWatchlist(symbol: string): Promise<string[]> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to remove from watchlist');
    }

    try {
      const response = await fetch(`${API_URL}/users/watchlist/${symbol}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to remove from watchlist');
      }

      return data;
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      throw error;
    }
  },

  async getWatchlist(): Promise<string[]> {
    const token = this.getToken();
    
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`${API_URL}/users/watchlist`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Get watchlist error:', error);
      return [];
    }
  }
};
