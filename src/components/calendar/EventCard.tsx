import React from 'react';
import { NudgeEvent, EVENT_CATEGORY_STYLES } from '../../utils/nudgeEvents';
import { Sparkles, Calendar, MapPin } from 'lucide-react';

interface EventCardProps {
  event: NudgeEvent;
  formattedDateStr?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, formattedDateStr }) => {
  const style = EVENT_CATEGORY_STYLES[event.category] || EVENT_CATEGORY_STYLES['International Observance'];

  return (
    <div
      className={`rounded-2xl p-4 border transition-all shadow-xs ${style.bgLight} ${style.bgDark} border-black/5 dark:border-white/10`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${style.badgeBgLight} ${style.badgeTextLight} ${style.badgeBgDark} ${style.badgeTextDark}`}
            >
              {event.category}
            </span>
            {event.traditionOrRegion && (
              <span className="flex items-center gap-1 text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark font-medium">
                <MapPin className="w-3 h-3 opacity-70" />
                {event.traditionOrRegion}
              </span>
            )}
          </div>
          <h3 className={`text-base font-semibold ${style.textLight} ${style.textDark}`}>
            {event.name}
          </h3>
        </div>

        {formattedDateStr && (
          <span className="text-xs font-semibold text-nudge-text-muted dark:text-nudge-text-muted-dark whitespace-nowrap bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
            {formattedDateStr}
          </span>
        )}
      </div>

      {event.description && (
        <p className={`text-xs mt-2 leading-relaxed opacity-90 ${style.textLight} ${style.textDark}`}>
          {event.description}
        </p>
      )}
    </div>
  );
};
