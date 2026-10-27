// useStartChat: opens (finds or creates) a conversation with a user about a gig, then goes to it in Messaging.
// Returns startChat(userId, gigId?) - shows a toast if the server says no.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function useStartChat() {
  const navigate = useNavigate();
  return useCallback(
    async (userId, gigId) => {
      try {
        const { data } = await api.post('/chat/conversations', { userId, gigId });
        navigate(`/chat/${data.conversation._id}`);
      } catch (err) {
        toast.error(`Couldn't open the chat. ${err.message}`);
      }
    },
    [navigate]
  );
}
