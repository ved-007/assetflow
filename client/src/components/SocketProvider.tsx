import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    socket.connect();

    const handleNewNotification = (notification: any) => {
      toast.info(notification.title, { description: notification.message });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.disconnect();
    };
  }, [user, queryClient]);

  return <>{children}</>;
}
