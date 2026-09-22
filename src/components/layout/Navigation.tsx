import React from 'react';
import { Home, Inbox, Hourglass, Settings } from 'lucide-react';
import { NavView } from '../../types';

interface NavigationProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onNavigate,
}) => {
  const items: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'notes', label: 'Your notes', icon: Inbox },
    { id: 'hours', label: 'Hours', icon: Hourglass },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeView));
  const ActiveIcon = items[activeIndex]?.icon || Home;

  // Notch center in SVG coordinates (viewBox 0 0 400 64)
  const cx = 50 + activeIndex * 100;

  // Carved notch contour path matching NudgeCarvedBottomBar
  const carvedPath = `
    M 24,0
    L ${cx - 36},0
    C ${cx - 24},0 ${cx - 24},10 ${cx - 22},12
    C ${cx - 16},24 ${cx + 16},24 ${cx + 22},12
    C ${cx + 24},10 ${cx + 24},0 ${cx + 36},0
    L 376,0
    A 24,24 0 0 1 400,24
    L 400,40
    A 24,24 0 0 1 376,64
    L 24,64
    A 24,24 0 0 1 0,40
    L 0,24
    A 24,24 0 0 1 24,0
    Z
  `;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none safe-bottom"
      data-testid="carved-bottom-bar"
    >
      <div className="max-w-md mx-auto relative h-[68px] pointer-events-auto filter drop-shadow-md">
        {/* Carved background SVG with dynamic cradle */}
        <svg
          viewBox="0 0 400 64"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-[64px] transition-all duration-300 ease-out"
          style={{ overflow: 'visible' }}
        >
          {/* Subtle drop shadow / border fill */}
          <path
            d={carvedPath}
            className="fill-[#FCFBF9] dark:fill-[#22201D] stroke-[#EDE8DF] dark:stroke-[#3C3730] transition-colors duration-200"
            strokeWidth="1.2"
          />
        </svg>

        {/* Sliding active soft blue circle */}
        <div
          className="absolute top-[2px] w-[44px] h-[44px] rounded-full bg-[#4579F5] shadow-[0_4px_14px_rgba(69,121,245,0.4)] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 pointer-events-none"
          style={{
            left: `calc(${activeIndex * 25}% + 12.5% - 22px)`,
          }}
          data-testid="sliding-active-indicator"
        >
          <ActiveIcon className="w-[21px] h-[21px] text-white stroke-[2.2] transition-transform duration-200" />
        </div>

        {/* Interactive tab items row */}
        <div className="relative z-20 grid grid-cols-4 h-[64px]">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isSelected = item.id === activeView;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-start pt-1.5 focus:outline-none select-none group"
                data-testid={`nav-tab-${item.id}`}
                aria-label={item.label}
              >
                {/* Fixed icon slot */}
                <div className="w-[44px] h-[38px] flex items-center justify-center">
                  {!isSelected && (
                    <Icon className="w-[20px] h-[20px] text-[#756F67] dark:text-[#9F988D] stroke-[1.8] group-hover:text-[#1C1A17] dark:group-hover:text-white transition-colors" />
                  )}
                </div>

                {/* Uniform label baseline */}
                <span
                  className={`text-[10px] tracking-tight leading-tight -mt-0.5 transition-colors ${
                    isSelected
                      ? 'font-semibold text-[#4579F5]'
                      : 'font-normal text-[#756F67] dark:text-[#9F988D]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

