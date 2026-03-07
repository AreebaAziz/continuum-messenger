import React from 'react';
import { Message } from '../../continuum-client-processor-lib/src/model';

interface SystemMessageProps {
  message: Message;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-center my-4">
      <div className="px-4 py-2 bg-gray-200 rounded-full">
        <p className="text-sm text-gray-600 italic">{message.content}</p>
      </div>
    </div>
  );
};

export default SystemMessage;
