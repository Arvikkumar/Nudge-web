import React, { useEffect, useRef } from 'react';

interface MinimalAnalogClockProps {
  className?: string;
  size?: number;
}

export const MinimalAnalogClock: React.FC<MinimalAnalogClockProps> = ({
  className = '',
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = new Date();
      const ms = now.getMilliseconds();
      const sec = now.getSeconds() + ms / 1000;
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;

      const secAngle = sec * 6 * (Math.PI / 180);
      const minAngle = min * 6 * (Math.PI / 180);
      const hrAngle = hr * 30 * (Math.PI / 180);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || size;
      const height = canvas.clientHeight || size;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const scale = width / 200;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Blue Progress Ring (Radius = 85 units, stroke = 1.4 units, #3B82F6 @ 0.54 opacity)
      const sweep = (min / 60) * (2 * Math.PI);
      if (sweep > 0.001) {
        ctx.beginPath();
        ctx.arc(cx, cy, 85 * scale, -Math.PI / 2, -Math.PI / 2 + sweep, false);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.54)';
        ctx.lineWidth = 1.4 * scale;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 2. 12 Tick Marks (Outer = 72 units, Inner = 64 units, stroke = 1.3 units, #8E8E93 @ 0.57 opacity)
      ctx.strokeStyle = 'rgba(142, 142, 147, 0.57)';
      ctx.lineWidth = 1.3 * scale;
      ctx.lineCap = 'round';

      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg - 90) * (Math.PI / 180);
        const cosVal = Math.cos(rad);
        const sinVal = Math.sin(rad);

        const x1 = cx + 64 * scale * cosVal;
        const y1 = cy + 64 * scale * sinVal;
        const x2 = cx + 72 * scale * cosVal;
        const y2 = cy + 72 * scale * sinVal;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 3. Hour Hand (Length = 50 units, stroke = 1.8 units, #8E8E93 @ 0.65 opacity)
      const hrRad = hrAngle - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 50 * scale * Math.cos(hrRad), cy + 50 * scale * Math.sin(hrRad));
      ctx.strokeStyle = 'rgba(142, 142, 147, 0.65)';
      ctx.lineWidth = 1.8 * scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 4. Minute Hand (Length = 70 units, stroke = 1.2 units, #8E8E93 @ 0.60 opacity)
      const minRad = minAngle - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 70 * scale * Math.cos(minRad), cy + 70 * scale * Math.sin(minRad));
      ctx.strokeStyle = 'rgba(142, 142, 147, 0.60)';
      ctx.lineWidth = 1.2 * scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 5. Second Hand with Counter-Tail (Tip = 71 units, Tail = 11 units, stroke = 0.85 units, #3B82F6 @ 0.65 opacity)
      const secRad = secAngle - Math.PI / 2;
      const cosSec = Math.cos(secRad);
      const sinSec = Math.sin(secRad);

      const tailX = cx - 11 * scale * cosSec;
      const tailY = cy - 11 * scale * sinSec;
      const tipX = cx + 71 * scale * cosSec;
      const tipY = cy + 71 * scale * sinSec;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.65)';
      ctx.lineWidth = 0.85 * scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 6. Center Pivot Dot (Radius = 2.2 units, #3B82F6 @ 0.70 opacity)
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2 * scale, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.70)';
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      data-testid="minimal_analog_clock"
      aria-label="Real-time analog clock"
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="block"
      />
    </div>
  );
};
