
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

export function PlayIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4.5 19 12 7 19.5V4.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PauseIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="6.5" y="4.5" width="3.6" height="15" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="13.9" y="4.5" width="3.6" height="15" rx="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MutedIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M11 5 6.5 8.8H3.5v6.4h3L11 19V5Z" fill="currentColor" stroke="currentColor" />
      <path d="m16 9.5 5 5m0-5-5 5" />
    </svg>
  );
}

export function SoundIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M11 5 6.5 8.8H3.5v6.4h3L11 19V5Z" fill="currentColor" stroke="currentColor" />
      <path d="M15.4 9.1a4 4 0 0 1 0 5.8M18 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

export function HeartIcon({ filled = false, ...props }) {
  return (
    <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.2s-7.4-4.5-7.4-9.5A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.4 3c0 5-7.4 9.5-7.4 9.5Z" />
    </svg>
  );
}

export function SendIcon(props) {
  return (
    <svg {...base} {...props} strokeWidth="1.6">
      <path d="M20.5 4.2 3.6 10.4l6.6 2.6m10.3-8.8-6 15.6-4.3-7m10.3-8.6-10.3 8.6m0 0v4.6l2.6-2.8" />
    </svg>
  );
}

export function ShareIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15.5V3.8m0 0L8.3 7.5M12 3.8l3.7 3.7" />
      <path d="M5 12.8v5.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.4" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6.5 6.5 11 11m0-11-11 11" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

export function LinkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 13.5a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3" />
      <path d="M13.5 10.5a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3" />
    </svg>
  );
}

export function WhatsAppIcon(props) {
  return (
    <svg {...base} {...props} strokeWidth="1.7">
      <path d="M20 11.7A7.9 7.9 0 0 1 8.2 18.6L4 20l1.4-4.1A7.9 7.9 0 1 1 20 11.7Z" />
      <path d="M9.2 9.1c.2 1.9 2 3.7 3.9 3.9l.9-1 1.5.8-.3 1.3c-2.6.4-5.7-2.7-6.1-6.1l1.3-.3.8 1.4Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.6 8.2h2V5.4h-2.2c-2 0-3.2 1.3-3.2 3.3v1.6H9v2.8h2.2V20h2.9v-6.9h2.2l.4-2.8h-2.6V9.1c0-.6.2-.9.5-.9Z" fill="currentColor" stroke="none" />
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4" />
    </svg>
  );
}

export function XIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 5 6 7.6L5.4 19M19 5l-6.3 6.9L19 19h-3.3L5 5h3.4" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.8v4.6m0 3.2h.01" />
    </svg>
  );
}

export function RefreshIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12a7 7 0 1 1-2.1-5" />
      <path d="M19.2 4.6v3.9h-3.9" />
    </svg>
  );
}
