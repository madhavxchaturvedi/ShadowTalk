import { useState } from 'react';

const ReactionPicker = ({ onReact, onClose }) => {
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '💯', '✨', '💪'];

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        style={{ background: 'transparent' }}
      />
      
      {/* Picker */}
      <div className="reaction-picker">
        <div className="reaction-picker-header">
          <span>Pick a reaction</span>
        </div>
        <div className="reaction-picker-grid">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="reaction-emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReactionPicker;
