import React from "react";

export const Textarea = ({ className = "", ...props }) => {
  return (
    <textarea
      className={`block w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  );
};
