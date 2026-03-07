import React from 'react';
import { Message } from '../../continuum-client-processor-lib/src/model';

interface SystemMessageProps {
  message: Message;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-center my-6">
      <div className="px-4 py-1.5 bg-gray-200/60 rounded-full">
        <p className="text-xs text-gray-600 font-medium">{message.content}</p>
      </div>
    </div>
  );
};

export default SystemMessage;
