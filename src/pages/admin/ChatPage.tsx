import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ChatInboxContent from '../../components/chat/ChatInboxContent';

export const AdminChatContent: React.FC = () => <ChatInboxContent role="admin" />;

const AdminChat: React.FC = () => (
  <AdminLayout>
    <AdminChatContent />
  </AdminLayout>
);

export default AdminChat;
