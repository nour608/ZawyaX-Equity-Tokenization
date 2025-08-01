import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { AppState, Notification, UserProfile } from "@/lib/types";
import { generateId } from "@/lib/utils";

// Action types
type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_USER_PROFILE"; payload: UserProfile | null }
  | { type: "SET_CHAIN"; payload: number }
  | { type: "ADD_NOTIFICATION"; payload: Omit<Notification, "id" | "timestamp" | "read"> }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" };

// Initial state
const initialState: AppState = {
  isConnected: false,
  userAddress: null,
  userProfile: null,
  currentChain: 84532, // Base Sepolia
  isLoading: false,
  error: null,
  notifications: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };

    case "SET_CHAIN":
      return { ...state, currentChain: action.payload };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [
          {
            ...action.payload,
            id: generateId(),
            timestamp: new Date(),
            read: false,
          },
          ...state.notifications,
        ],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const account = useActiveAccount();

  // Update connection state when account changes
  useEffect(() => {
    if (account) {
      
      // Load user profile from real data source
      // This should be replaced with actual profile loading logic
      const userProfile: UserProfile = {
        address: account.address as `0x${string}`,
        name: `User ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
        bio: "Web3 user",
        avatar: "/images/default-avatar.png",
        socialLinks: {
          twitter: "",
          github: "",
          linkedin: "",
        },
        reputation: 0,
        completedJobs: 0,
        totalEarnings: BigInt(0),
        skills: [],
        joinedAt: new Date(),
      };
      
      dispatch({ type: "SET_USER_PROFILE", payload: userProfile });
      
      // Add connection notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          title: "Wallet Connected",
          message: `Successfully connected to ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
          timestamp: new Date(),
          read: false,
        },
      });
    } else {
      dispatch({ type: "SET_USER_PROFILE", payload: null });
      
      if (state.isConnected) {
        // Add disconnection notification
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            type: "info",
            title: "Wallet Disconnected",
            message: "Your wallet has been disconnected",
            timestamp: new Date(),
            read: false,
          },
        });
      }
    }
  }, [account, state.isConnected]);

  // Convenience methods
  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  const setUserProfile = (profile: UserProfile | null) => {
    dispatch({ type: "SET_USER_PROFILE", payload: profile });
  };

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const markNotificationRead = (id: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: "CLEAR_NOTIFICATIONS" });
  };

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timeouts = state.notifications
      .filter((n) => !n.read)
      .map((notification) => {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);
      });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.notifications]);

  const contextValue: AppContextType = {
    state: {
      ...state,
      isConnected: !!account,
      userAddress: account?.address as `0x${string}` | null,
    },
    dispatch,
    setLoading,
    setError,
    setUserProfile,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearNotifications,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

// Individual hooks for specific parts of the state
export function useAppState() {
  const { state } = useAppContext();
  return state;
}

export function useNotifications() {
  const { state, addNotification, removeNotification, markNotificationRead, clearNotifications } = useAppContext();
  
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter((n) => !n.read).length,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearNotifications,
  };
}

export function useUserProfile() {
  const { state, setUserProfile } = useAppContext();
  
  return {
    profile: state.userProfile,
    isLoggedIn: !!state.userProfile,
    setProfile: setUserProfile,
  };
}

export function useAppLoading() {
  const { state, setLoading, setError } = useAppContext();
  
  return {
    isLoading: state.isLoading,
    error: state.error,
    setLoading,
    setError,
  };
}