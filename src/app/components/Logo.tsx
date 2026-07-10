interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hand */}
      <path
        d="M20 28C20 28 16 26 14 24C12 22 10 18 10 16C10 14 11 12 13 12C15 12 16 14 16 14V8C16 6 17 4 19 4C21 4 22 6 22 8V6C22 4 23 2 25 2C27 2 28 4 28 6V8C28 8 29 6 31 6C33 6 34 8 34 10V18C34 18 35 16 37 16C39 16 40 18 40 20C40 22 38 26 36 28C34 30 30 32 28 34L24 38C24 38 22 40 20 40C18 40 16 38 16 36L16 32C16 30 18 28 20 28Z"
        fill="#0891b2"
        className="fill-cyan-600"
      />
      <path
        d="M20 28C20 28 16 26 14 24C12 22 10 18 10 16C10 14 11 12 13 12C15 12 16 14 16 14V8C16 6 17 4 19 4C21 4 22 6 22 8V6C22 4 23 2 25 2C27 2 28 4 28 6V8C28 8 29 6 31 6C33 6 34 8 34 10V18C34 18 35 16 37 16C39 16 40 18 40 20C40 22 38 26 36 28C34 30 30 32 28 34L24 38C24 38 22 40 20 40C18 40 16 38 16 36L16 32C16 30 18 28 20 28Z"
        stroke="#06b6d4"
        strokeWidth="1"
        fill="none"
        className="stroke-cyan-500"
      />
      
      {/* Blood Drop */}
      <path
        d="M24 10C24 10 20 14 20 17C20 19.2091 21.7909 21 24 21C26.2091 21 28 19.2091 28 17C28 14 24 10 24 10Z"
        fill="#ef4444"
        className="fill-red-500"
      />
      <path
        d="M24 10C24 10 20 14 20 17C20 19.2091 21.7909 21 24 21C26.2091 21 28 19.2091 28 17C28 14 24 10 24 10Z"
        stroke="#dc2626"
        strokeWidth="1.5"
        fill="none"
        className="stroke-red-600"
      />
      
      {/* Highlight on drop */}
      <ellipse
        cx="25"
        cy="16"
        rx="1.5"
        ry="2"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
}
