import React from "react";
import { useNotifications } from "@/contexts/AppContext";
import { 
  Toast, 
  ToastClose, 
  ToastDescription, 
  ToastTitle,
  ToastProvider,
  ToastViewport 
} from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/**
 * Global notification toast component
 */
export function NotificationToasts() {
  const { notifications, removeNotification, markNotificationRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <>
      {notifications.slice(0, 5).map((notification) => (
        <Toast
          key={notification.id}
          variant={notification.type === 'error' ? 'destructive' : 'default'}
          onOpenChange={(open) => {
            if (!open) {
              removeNotification(notification.id);
            }
          }}
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1">
              <ToastTitle>{notification.title}</ToastTitle>
              <ToastDescription>{notification.message}</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}

/**
 * Hook to trigger toast notifications easily
 */
export function useToast() {
  const { addNotification } = useNotifications();

  const toast = {
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message: message || '' }),
    
    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message: message || '' }),
    
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message: message || '' }),
    
    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message: message || '' }),
  };

  return { toast };
}