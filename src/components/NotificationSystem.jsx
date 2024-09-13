import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ user_id: '', type: '', content: '' });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchNotifications();
    }
  }, [currentUserUUID]);

  const fetchNotifications = async () => {
    try {
      let { data, error } = await supabase
        .from('notifications')
        .select(`
          id, 
          user_id, 
          type, 
          content, 
          is_read, 
          created_at,
          user:users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      toast.error('Error fetching notifications: ' + error.message);
    }
  };

  const createNotification = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([newNotification]);
      if (error) throw error;
      toast.success('Notification created successfully!');
      fetchNotifications();
      setNewNotification({ user_id: '', type: '', content: '' });
    } catch (error) {
      toast.error('Error creating notification: ' + error.message);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Error marking notification as read: ' + error.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      toast.error('Error deleting notification: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Notification System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createNotification} className="space-y-4">
              <Input
                type="text"
                placeholder="User ID"
                value={newNotification.user_id}
                onChange={(e) => setNewNotification({ ...newNotification, user_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Type"
                value={newNotification.type}
                onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                required
              />
              <Textarea
                placeholder="Content"
                value={newNotification.content}
                onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                required
              />
              <Button type="submit">Create Notification</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className={`p-4 rounded-md ${notification.is_read ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                  <p><strong>User:</strong> {notification.user?.name || notification.user_id}</p>
                  <p><strong>Type:</strong> {notification.type}</p>
                  <p><strong>Created:</strong> {new Date(notification.created_at).toLocaleString()}</p>
                  <p className="mt-2">{notification.content}</p>
                  <div className="mt-2 space-x-2">
                    {!notification.is_read && (
                      <Button onClick={() => markAsRead(notification.id)} variant="outline" size="sm">
                        Mark as Read
                      </Button>
                    )}
                    <Button onClick={() => deleteNotification(notification.id)} variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationSystem;