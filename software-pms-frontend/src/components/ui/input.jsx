// components/ui/input.jsx
import React from "react";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={`
      flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
      placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring 
      focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
      ${className}
    `}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
