// Drawn product art - added 2026-09-20 for the 22 September local checks
// (seed data brief). Every tile is plain inline SVG computed from data the
// page already has (category, name, id) - nothing is fetched, nothing is a
// photograph, and `imageUrl` itself is never rendered (the two backing
// services still carry that field, unused by either app). This supersedes
// DESIGN.md's earlier "gradient placeholder, no product art" call - see the
// note added there the same day - because a flat, identical gradient card
// cannot tell 10 products in 4 categories apart, and the room seeing the local
// needs to.

import type { Product } from '../api/catalog/Product';

type TileProduct = Pick<Product, 'id' | 'name' | 'category'>;

interface CategoryArt {
  from: string;
  to: string;
  Icon: (props: { color: string }) => JSX.Element;
}

function ChipIcon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round">
      <rect x="72" y="72" width="56" height="56" rx="10" />
      <circle cx="100" cy="100" r="9" fill={color} stroke="none" />
      {[80, 100, 120].map((y) => (
        <g key={y}>
          <line x1="72" y1={y} x2="54" y2={y} />
          <line x1="128" y1={y} x2="146" y2={y} />
        </g>
      ))}
      {[80, 100, 120].map((x) => (
        <g key={x}>
          <line x1={x} y1="72" x2={x} y2="54" />
          <line x1={x} y1="128" x2={x} y2="146" />
        </g>
      ))}
    </g>
  );
}

function ChairIcon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M62 138 L62 92 Q62 80 74 80 L126 80 Q138 80 138 92 L138 138" />
      <line x1="62" y1="112" x2="138" y2="112" />
      <line x1="62" y1="138" x2="62" y2="156" />
      <line x1="138" y1="138" x2="138" y2="156" />
    </g>
  );
}

function LeafIcon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M52 142 L86 88 L106 116 L128 82 L154 142 Z" />
      <circle cx="128" cy="64" r="11" fill={color} stroke="none" />
    </g>
  );
}

function ShirtIcon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M74 68 L96 56 Q100 66 104 56 L126 68 L146 90 L128 102 L128 148 L72 148 L72 102 L54 90 Z" />
    </g>
  );
}

const CATEGORY_ART: Record<string, CategoryArt> = {
  Electronics: { from: '#1c2c4a', to: '#3d63ad', Icon: ChipIcon },
  Furniture: { from: '#3e2c0f', to: '#a5701d', Icon: ChairIcon },
  'Sports & Outdoors': { from: '#0f3327', to: '#1c8a5f', Icon: LeafIcon },
  Clothing: { from: '#2c2049', to: '#6c48ad', Icon: ShirtIcon }
};

const FALLBACK_ART: CategoryArt = { from: '#242938', to: '#4a5170', Icon: ChipIcon };

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  // Prefer words that start with a letter, so a name like "27-inch 4K
  // Monitor" reads "M" rather than the digits "27" and "4K" - a monogram
  // should never look like it is quoting the SKU.
  const letterLedWords = words.filter((word) => /^[a-zA-Z]/.test(word));
  const source = letterLedWords.length > 0 ? letterLedWords : words;
  const letters = source.slice(0, 2).map((word) => word.match(/[a-zA-Z]/)?.[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export function ProductTile({ product, className }: { product: TileProduct; className?: string }) {
  const art = CATEGORY_ART[product.category] ?? FALLBACK_ART;
  const gradientId = `tile-grad-${product.id}`;
  const { Icon } = art;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`${product.name} (${product.category})`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={art.from} />
          <stop offset="100%" stopColor={art.to} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gradientId})`} />
      <g opacity={0.16} stroke="#ffffff" strokeWidth={1}>
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="0" y1={y} x2="200" y2={y} />
        ))}
      </g>
      <Icon color="rgba(255,255,255,0.82)" />
      <text
        x="180"
        y="184"
        textAnchor="end"
        fontSize="26"
        fontWeight={700}
        fontFamily="var(--font-sans, sans-serif)"
        fill="rgba(255,255,255,0.34)"
      >
        {initialsOf(product.name)}
      </text>
    </svg>
  );
}
