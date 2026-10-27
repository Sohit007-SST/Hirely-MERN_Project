// NotFoundArt: an original illustration for the 404 page - a gig card that has come loose from a board,
// a dashed path and a small question mark. Drawn with SVG shapes and coloured only through CSS tokens.
export default function NotFoundArt() {
  return (
    <svg className="rest-404-art" viewBox="0 0 240 160" width="240" height="160" aria-hidden="true" focusable="false">
      {/* board */}
      <rect className="rest-404-art__board" x="20" y="24" width="140" height="112" rx="10" />
      <rect className="rest-404-art__line" x="36" y="44" width="72" height="8" rx="4" />
      <rect className="rest-404-art__line" x="36" y="60" width="104" height="6" rx="3" />
      {/* empty slot where the card used to be */}
      <rect className="rest-404-art__slot" x="36" y="80" width="104" height="40" rx="6" />
      {/* dashed path the card took */}
      <path className="rest-404-art__path" d="M140 100 C 170 100, 176 70, 196 58" />
      {/* the loose card, tilted */}
      <g transform="rotate(14 196 52)">
        <rect className="rest-404-art__card" x="164" y="30" width="64" height="44" rx="6" />
        <rect className="rest-404-art__line" x="174" y="40" width="34" height="6" rx="3" />
        <rect className="rest-404-art__money" x="174" y="54" width="26" height="12" rx="3" />
      </g>
      {/* question mark bubble */}
      <circle className="rest-404-art__bubble" cx="206" cy="124" r="16" />
      <text className="rest-404-art__q" x="206" y="130" textAnchor="middle">?</text>
    </svg>
  );
}
