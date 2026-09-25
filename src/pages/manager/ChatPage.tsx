import React from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import ChatInboxContent from '../../components/chat/ChatInboxContent';

const ManagerChat: React.FC = () => (
  <ManagerLayout>
    <ChatInboxContent role="manager" />
  </ManagerLayout>
);

export default ManagerChat;
