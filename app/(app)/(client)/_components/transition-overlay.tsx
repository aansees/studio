import { transitionOverlayColors } from "./home-config";

export function TransitionOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100000]">
      {transitionOverlayColors.map((background, index) => (
        <div
          key={background}
          data-transition-overlay
          className="absolute inset-0 origin-top"
          style={{
            background,
            zIndex: 5 - index,
          }}
        />
      ))}
    </div>
  );
}
