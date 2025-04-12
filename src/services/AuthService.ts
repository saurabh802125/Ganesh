interface User {
  _id: string;
  name: string;
  email: string;
  watchlist: string[];
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
  };
}

interface AuthResponse {
  token: string;
  user: User;
}

interface PortfolioEntry {
  stock: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
}

interface Portfolio {
  name: string;
  stocks: PortfolioEntry[];
  createdAt: Date;
}

const API_URL = 'http://localhost:5000/api';

export const AuthService = {
  // User Registration
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Trigger auth change event
      this.triggerAuthChangeEvent();

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // User Login
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Trigger auth change event
      this.triggerAuthChangeEvent();

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout
  logout(): void {
    // Remove token and user info
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Trigger auth change event
    this.triggerAuthChangeEvent();
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    
    if (!token) return null;

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

      const user: User = await response.json();
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  },

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    
    // Optional: Add token expiration check
    if (!token) return false;

    // TODO: Implement proper token expiration check
    return true;
  },

  // Add stock to watchlist
  async addToWatchlist(symbol: string): Promise<string[]> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to add to watchlist');
    }

    try {
      const response = await fetch(`${API_URL}/stocks/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to add to watchlist');
      }

      const watchlist: string[] = await response.json();
      
      // Update local user data
      const user = this.getLocalUser();
      if (user) {
        user.watchlist = watchlist;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Trigger watchlist change event
      this.triggerWatchlistChangeEvent();

      return watchlist;
    } catch (error) {
      console.error('Add to watchlist error:', error);
      throw error;
    }
  },

  // Remove stock from watchlist
  async removeFromWatchlist(symbol: string): Promise<string[]> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to remove from watchlist');
    }

    try {
      const response = await fetch(`${API_URL}/stocks/watchlist/${symbol}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to remove from watchlist');
      }

      const watchlist: string[] = await response.json();
      
      // Update local user data
      const user = this.getLocalUser();
      if (user) {
        user.watchlist = watchlist;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Trigger watchlist change event
      this.triggerWatchlistChangeEvent();

      return watchlist;
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      throw error;
    }
  },

  // Get user's watchlist
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
  },

  // Get local user from storage
  getLocalUser(): User | null {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },

  // Update user preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to update preferences');
    }

    try {
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update preferences');
      }

      const updatedUser: User = await response.json();
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  },

  // Trigger authentication change event
  triggerAuthChangeEvent() {
    const event = new CustomEvent('auth-change');
    window.dispatchEvent(event);
  },

  // Trigger watchlist change event
  triggerWatchlistChangeEvent() {
    const event = new CustomEvent('watchlist-changed');
    window.dispatchEvent(event);
  },

  // Create or update portfolio
  async createOrUpdatePortfolio(
    portfolioName: string, 
    stockSymbol: string, 
    quantity: number, 
    purchasePrice: number
  ): Promise<Portfolio[]> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to manage portfolios');
    }

    try {
      const response = await fetch(`${API_URL}/users/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          portfolioName,
          stockSymbol,
          quantity,
          purchasePrice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update portfolio');
      }

      const portfolios: Portfolio[] = await response.json();
      
      // Update local user data
      const user = this.getLocalUser();
      if (user) {
        // Update just the portfolios field
        user.portfolios = portfolios;
        localStorage.setItem('user', JSON.stringify(user));
      }

      return portfolios;
    } catch (error) {
      console.error('Update portfolio error:', error);
      throw error;
    }
  },

  // Password reset request
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  // Confirm password reset
  async confirmPasswordReset(
    token: string, 
    newPassword: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/reset-password/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  }
};

// Optional: Add event listeners for auth changes
window.addEventListener('auth-change', () => {
  // You can add additional logic here if needed
  console.log('Authentication state changed');
});