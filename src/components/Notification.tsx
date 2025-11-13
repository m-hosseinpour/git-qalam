import { Component, createSignal, onMount, onCleanup } from 'solid-js';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

const notificationState = {
  subscribers: [] as ((notifications: Notification[]) => void)[],
  notifications: [] as Notification[],

  subscribe: (callback: (notifications: Notification[]) => void) => {
    notificationState.subscribers.push(callback);
    return () => {
      notificationState.subscribers = notificationState.subscribers.filter(sub => sub !== callback);
    };
  },

  add: (notification: Notification) => {
    notificationState.notifications.push(notification);
    notificationState.notify();
  },

  remove: (id: string) => {
    notificationState.notifications = notificationState.notifications.filter(n => n.id !== id);
    notificationState.notify();
  },

  notify: () => {
    notificationState.subscribers.forEach(callback => callback(notificationState.notifications));
  }
};

export const NotificationService = {
  show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: Notification = { id, message, type, duration };

    notificationState.add(notification);

    if (duration > 0) {
      setTimeout(() => {
        NotificationService.hide(id);
      }, duration);
    }

    return id;
  },

  hide: (id: string) => {
    notificationState.remove(id);
  }
};

export const NotificationProvider: Component = () => {
  const [notificationList, setNotificationList] = createSignal<Notification[]>([]);

  onMount(() => {
    const unsubscribe = notificationState.subscribe((notifications) => {
      setNotificationList(notifications);
    });

    onCleanup(unsubscribe);
  });

  return (
    <div class="notification-container">
      {notificationList().map((notification) => (
        <div
          class={`notification notification-${notification.type}`}
        >
          <span class="notification-message">{notification.message}</span>
          <button
            class="notification-close"
            onClick={() => NotificationService.hide(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationProvider;