import "./IconX.css"

interface IconXProps {
  className?: string
}

export function IconX({ className = "" }: IconXProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`icon-x ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="X"
    >
      <line
        x1="20"
        y1="20"
        x2="80"
        y2="80"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="20"
        x2="20"
        y2="80"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  )
}
