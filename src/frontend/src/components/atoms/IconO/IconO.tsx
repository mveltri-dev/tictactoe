import "./IconO.css"

interface IconOProps {
  className?: string
}

export function IconO({ className = "" }: IconOProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`icon-o ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="O"
    >
      <circle
        cx="50"
        cy="50"
        r="30"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  )
}
