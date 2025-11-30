import React from 'react';

interface SectionProps {
  title: string;
  points?: string[];
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  centered?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  points,
  children,
  className = '',
  titleClassName = '',
  contentClassName = '',
  centered = true,
}) => {
  return (
    <div className={`mb-6 max-w-full ${className}`}>
      {/* Section Title */}
      <h3
        className={`text-lg font-bold text-gray-900 mb-3 ${
          centered ? 'text-center' : ''
        } ${titleClassName}`}
      >
        {title}
      </h3>

      {/* Section Content */}
      <div className={`max-w-full ${contentClassName}`}>
        {points && points.length > 0 ? (
          <ul className={`space-y-2 ${centered ? 'text-center list-none' : 'list-disc pl-6'}`}>
            {points.map((point, index) => (
              <li key={index} className="text-sm text-gray-700">
                {centered && '• '}
                {point}
              </li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Section;
