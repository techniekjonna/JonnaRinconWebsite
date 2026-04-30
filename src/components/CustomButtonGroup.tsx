import React from 'react';
import { CustomButton } from '../lib/firebase/services/settingsService';
import { openCustomButtonUrl, getButtonColorClasses } from '../lib/utils/customButtonUtils';

interface CustomButtonGroupProps {
  button1?: CustomButton;
  button2?: CustomButton;
  variant?: 'compact' | 'full';
  className?: string;
  showTrackCount?: boolean;
}

const CustomButtonGroup: React.FC<CustomButtonGroupProps> = ({
  button1,
  button2,
  variant = 'full',
  className = '',
  showTrackCount = false,
}) => {
  const buttons = [button1, button2].filter((btn) => btn !== undefined) as CustomButton[];

  if (buttons.length === 0) {
    return null;
  }

  const isCompact = variant === 'compact';
  const baseClasses = isCompact
    ? 'text-sm px-3 py-1.5'
    : 'text-base px-4 py-2';

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={() => openCustomButtonUrl(button.url)}
          className={`${getButtonColorClasses(button.color)} text-white font-medium rounded-lg transition-all hover:shadow-lg transform hover:-translate-y-0.5 ${baseClasses}`}
        >
          {button.label}
          {showTrackCount && button.trackIds && button.trackIds.length > 0 && (
            <span className="ml-1">({button.trackIds.length} tracks)</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default CustomButtonGroup;
