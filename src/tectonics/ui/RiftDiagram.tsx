type RiftDiagramProps = {
  step: number
}

export function RiftDiagram({ step }: RiftDiagramProps) {
  const clampedStep = Math.max(0, Math.min(2, step))

  return (
    <div className={`rift-diagram rift-diagram--step-${clampedStep}`} aria-hidden="true">
      <svg className="rift-diagram__svg" viewBox="0 0 960 620" role="img">
        <defs>
          <linearGradient id="magmaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff2f1f" />
            <stop offset="48%" stopColor="#ff7a18" />
            <stop offset="100%" stopColor="#ffd044" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
          </filter>
          <marker id="whiteArrow" markerWidth="16" markerHeight="16" refX="13" refY="8" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L16,8 L0,16 Z" fill="#fff" />
          </marker>
          <marker id="blackArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 Z" fill="#1d1c1c" />
          </marker>
        </defs>

        <rect width="960" height="620" fill="#f6f7f5" />

        <g className="rift-diagram__magma" filter="url(#softShadow)">
          <path
            d="M10 565 C120 500 215 457 335 455 C430 455 500 505 578 482 C670 455 748 408 950 360 L950 610 L10 610 Z"
            fill="url(#magmaGradient)"
          />
          <path
            className="rift-diagram__convection rift-diagram__convection--left"
            d="M170 543 C275 485 355 485 436 553"
          />
          <path
            className="rift-diagram__convection rift-diagram__convection--right"
            d="M472 553 C535 455 635 475 704 535"
          />
          <text x="505" y="580" className="rift-diagram__magma-label">
            Magma
          </text>
        </g>

        <g className="rift-diagram__blocks" filter="url(#softShadow)">
          <g className="rift-diagram__block rift-diagram__block--left-outer">
            <polygon points="0,220 172,146 278,164 155,234" fill="#c7836f" />
            <polygon points="0,220 155,234 155,548 0,610" fill="#77777e" />
            <polygon points="155,234 278,164 278,456 155,548" fill="#4a484e" />
            <path d="M54 204 C88 188 118 184 151 190" className="rift-diagram__surface-line" />
            <path d="M92 183 L130 172 L170 176" className="rift-diagram__surface-line" />
          </g>

          <g className="rift-diagram__block rift-diagram__block--left-inner">
            <polygon points="198,157 342,116 432,140 314,190" fill="#c88773" />
            <polygon points="198,157 314,190 314,515 198,555" fill="#875b57" />
            <polygon points="314,190 432,140 432,458 314,515" fill="#5d4f55" />
            <path d="M260 147 C290 135 320 132 350 138" className="rift-diagram__surface-line" />
            <path d="M275 182 C302 171 325 169 350 175" className="rift-diagram__surface-line" />
          </g>

          <g className="rift-diagram__block rift-diagram__block--center">
            <polygon points="390,175 505,142 620,176 515,222" fill="#c68470" />
            <polygon points="390,175 515,222 515,455 390,504" fill="#96635b" />
            <polygon points="515,222 620,176 620,500 515,455" fill="#6b5559" />
          </g>

          <g className="rift-diagram__block rift-diagram__block--right-inner">
            <polygon points="579,154 702,106 804,126 700,188" fill="#c88773" />
            <polygon points="579,154 700,188 700,510 579,462" fill="#8b5f59" />
            <polygon points="700,188 804,126 804,468 700,510" fill="#554f55" />
            <path d="M655 143 C684 131 718 130 752 138" className="rift-diagram__surface-line" />
            <path d="M670 177 C700 165 725 165 753 172" className="rift-diagram__surface-line" />
          </g>

          <g className="rift-diagram__block rift-diagram__block--right-outer">
            <polygon points="754,170 858,116 956,138 900,214" fill="#c88773" />
            <polygon points="754,170 900,214 900,555 754,510" fill="#77777e" />
            <polygon points="900,214 956,138 956,475 900,555" fill="#56565c" />
            <path d="M815 160 C842 145 875 143 900 152" className="rift-diagram__surface-line" />
            <path d="M830 196 C858 181 888 181 912 190" className="rift-diagram__surface-line" />
          </g>
        </g>

        <g className="rift-diagram__faults">
          <path d="M295 190 L255 525" />
          <path d="M421 180 L400 494" />
          <path d="M596 188 L582 470" />
          <path d="M728 190 L760 500" />
        </g>

        <g className="rift-diagram__lava">
          <path className="rift-diagram__lava-conduit" d="M505 510 C510 430 515 350 505 260 C500 222 520 205 536 178" />
          <path className="rift-diagram__lava-conduit rift-diagram__lava-conduit--side" d="M455 520 C463 430 463 365 450 300 C440 255 462 232 485 198" />
          <path className="rift-diagram__lava-flow" d="M420 188 C450 160 495 184 495 220 C495 250 480 272 494 298 C515 335 490 372 452 362 C420 354 425 315 438 292 C455 262 408 246 420 188 Z" />
          <path className="rift-diagram__lava-flow rift-diagram__lava-flow--right" d="M530 188 C566 176 604 204 592 246 C584 275 555 290 575 322 C594 352 570 387 534 380 C498 373 509 331 526 305 C546 274 503 252 530 188 Z" />
        </g>

        <g className="rift-diagram__arrows">
          <path className="rift-diagram__side-arrow rift-diagram__side-arrow--left" d="M220 405 L82 405" markerEnd="url(#whiteArrow)" />
          <path className="rift-diagram__side-arrow rift-diagram__side-arrow--right" d="M740 405 L885 405" markerEnd="url(#whiteArrow)" />
          <path className="rift-diagram__down-arrow rift-diagram__down-arrow--left" d="M292 355 L292 440" markerEnd="url(#blackArrow)" />
          <path className="rift-diagram__down-arrow rift-diagram__down-arrow--center-left" d="M416 340 L416 430" markerEnd="url(#blackArrow)" />
          <path className="rift-diagram__down-arrow rift-diagram__down-arrow--center-right" d="M596 340 L596 430" markerEnd="url(#blackArrow)" />
          <path className="rift-diagram__down-arrow rift-diagram__down-arrow--right" d="M720 355 L720 440" markerEnd="url(#blackArrow)" />
        </g>

        <g className="rift-diagram__labels">
          <text x="742" y="92">Fault</text>
          <text x="358" y="91">Lava flow</text>
          <text x="604" y="70">Lava conduit</text>
          <text x="678" y="407">Continental crust</text>
          <text x="210" y="470" transform="rotate(72 210 470)">Fault</text>
          <text x="784" y="474" transform="rotate(-72 784 474)">Fault</text>
          <line x1="710" y1="96" x2="724" y2="190" />
          <line x1="414" y1="100" x2="448" y2="190" />
          <line x1="630" y1="78" x2="530" y2="202" />
        </g>
      </svg>
    </div>
  )
}
