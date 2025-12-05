import React, { memo } from 'react';
import { Streamdown } from 'streamdown';

interface StreamdownRendererProps {
  content: string;
}

// We rely on Streamdown's built-in Mermaid support.
const StreamdownRenderer: React.FC<StreamdownRendererProps> = memo(({ content }) => {
  return (
    <div className="prose prose-invert max-w-none w-full flex flex-col items-center">
      {/* 
         Streamdown renders div elements. 
         We target the generated mermaid blocks via CSS in index.html or global styles if needed, 
         but here we ensure the wrapper centers its children.
      */}
      <div className="w-full">
        <Streamdown>
          {content}
        </Streamdown>
      </div>
    </div>
  );
});

export default StreamdownRenderer;