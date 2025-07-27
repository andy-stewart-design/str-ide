export default function AnimatedVisualizer() {
  const lineProps = {
    stroke: "currentColor",
    ["stroke-width"]: 2,
    ["stroke-linecap"]: "round",
  } as const;

  const animateProps = {
    keyTimes: "0;0.5;1",
    keySplines: "0.25 0.1 0.25 1; 0.25 0.1 0.25 1",
    calcMode: "spline",
    dur: "1.25s",
    repeatCount: "indefinite",
  } as const;

  return (
    <svg viewBox="0 0 20 20" width={20} height={20}>
      <line x1="5" y1="6" x2="5" y2="14" {...lineProps}>
        <animate id="p1" attributeName="y1" values="6;10;6" {...animateProps} />
        <animate
          attributeName="y2"
          values="14;10;14"
          begin="p1.begin"
          {...animateProps}
        />
      </line>
      <line x1="10" y1="3" x2="10" y2="17" {...lineProps}>
        <animate
          attributeName="y1"
          values="3;10;3"
          begin="p1.begin-1s"
          {...animateProps}
        />
        <animate
          attributeName="y2"
          values="17;10;17"
          begin="p1.begin-1s"
          {...animateProps}
        />
      </line>
      <line x1="15" y1="6" x2="15" y2="14" {...lineProps}>
        <animate
          attributeName="y1"
          values="6;10;6"
          begin="p1.begin-2s"
          {...animateProps}
        />
        <animate
          attributeName="y2"
          values="14;10;14"
          begin="p1.begin-2s"
          {...animateProps}
        />
      </line>
    </svg>
  );
}

<svg
  width="20"
  height="20"
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M5 6V14" stroke="black" stroke-width="2" stroke-linecap="round" />
  <path d="M10 3V17" stroke="black" stroke-width="2" stroke-linecap="round" />
  <path d="M15 6V14" stroke="black" stroke-width="2" stroke-linecap="round" />
</svg>;
