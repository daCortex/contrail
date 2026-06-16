// Lightweight line-icon set (currentColor). Replaces emoji throughout the UI
// for a cleaner, more premium look. 24×24 grid, 1.6 stroke.

type P = { className?: string; size?: number; strokeWidth?: number };

function S({ className, size = 18, strokeWidth = 1.6, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const PlaneIcon = (p: P) => (
  <S {...p}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  </S>
);

export const TakeoffIcon = (p: P) => (
  <S {...p}>
    <path d="M2 22h20" />
    <path d="M6.4 17.4 4 17l-2-4 1.1-.5a2 2 0 0 1 1.8 0l.2.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.5a2 2 0 0 1 2.1.3l4 3a2 2 0 0 0 2.1.2l4.2-2.1a2.4 2.4 0 0 1 1.7-.2L21 7a1.4 1.4 0 0 1 .9 2l-.4.8c-.2.5-.6.8-1.1 1.1L7.6 17.2a2 2 0 0 1-1.2.2Z" />
  </S>
);

export const LandingIcon = (p: P) => (
  <S {...p}>
    <path d="M2 22h20" />
    <path d="M3.8 10.8 2 9l1-4.4 1.2.6a2 2 0 0 1 1 1.1l.7 1.8 4.8 1.3 4.4-6.6a2 2 0 0 1 2.6-.6l.7.4a1.4 1.4 0 0 1 .4 2l-5.6 8.1a2 2 0 0 1-1.4.8L4.2 14.8a2 2 0 0 1-1.6-1.2Z" transform="rotate(0)" />
  </S>
);

export const GlobeIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
  </S>
);

export const ClockIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);

export const RouteIcon = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8 18h6a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h2.5" strokeDasharray="0.1 3" />
  </S>
);

export const PinIcon = (p: P) => (
  <S {...p}>
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </S>
);

export const LeafIcon = (p: P) => (
  <S {...p}>
    <path d="M11 20a8 8 0 0 1-7-3c0-7 5-13 16-13 0 9-4 16-9 16Z" />
    <path d="M5 20c3-4 6-6 10-7" />
  </S>
);

export const FuelIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0C7 9.5 9 7 12 3Z" />
  </S>
);

export const TrophyIcon = (p: P) => (
  <S {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5C21 9 19 10 17 10" />
    <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 9 5 10 7 10" />
    <path d="M10 14h4M9 20h6M12 14v6" />
  </S>
);

export const TargetIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </S>
);

export const CalendarIcon = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </S>
);

export const LayersIcon = (p: P) => (
  <S {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </S>
);

export const StarIcon = (p: P) => (
  <S {...p}>
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3Z" />
  </S>
);

export const SparkIcon = (p: P) => (
  <S {...p}>
    <path d="M12 4v16M4 12h16" opacity="0" />
    <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
  </S>
);

export const FlagIcon = (p: P) => (
  <S {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-1.5 3L16 10H5" />
  </S>
);

export const RulerIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(45 12 12)" />
    <path d="M9 9l1.5 1.5M12 12l1.5 1.5M6 12l1.5 1.5" />
  </S>
);

export const MoonIcon = (p: P) => (
  <S {...p}>
    <path d="M21 12.8A8 8 0 1 1 11.2 3a6.3 6.3 0 0 0 9.8 9.8Z" />
  </S>
);

export const GaugeIcon = (p: P) => (
  <S {...p}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="m13 13-2.5 2.5" />
  </S>
);

export const PlusIcon = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const PencilIcon = (p: P) => (
  <S {...p}>
    <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z" />
    <path d="M14 7l3 3" />
  </S>
);

export const TrashIcon = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </S>
);

export const SearchIcon = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </S>
);

export const CloseIcon = (p: P) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);

export const ArrowRightIcon = (p: P) => (
  <S {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);

export const BoltIcon = (p: P) => (
  <S {...p}>
    <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
  </S>
);
