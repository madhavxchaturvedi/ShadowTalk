import { useState } from 'react';

const ReactionPicker = ({ onReact, onClose }) => {
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '💯'];

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-2 shadow-lg z-50">
      <div className="flex gap-1">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onReact(emoji);
              onClose();
            }}
            className="text-2xl hover:scale-125 transition-transform p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionPicker;
