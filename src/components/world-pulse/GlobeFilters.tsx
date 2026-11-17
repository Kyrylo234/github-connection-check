import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SentimentDot } from "@/components/world-pulse/SentimentBadge";
import { SignalSlider } from "@/components/world-pulse/SignalSlider";
import { formatTimeRange, MAX_TIME_RANGE_MINUTES, minutesToSliderPosition, sliderPositionToMinutes, TIME_RANGE_SLIDER_MAX } from "@/lib/time-range";
import type { SentimentFilter, TimeRange } from "@/types/news";

interface GlobeFiltersProps {
  sentiment: SentimentFilter;
  timeRange: TimeRange;
  minimumSeverity: number;
  onSentimentChange: (value: SentimentFilter) => void;
  onTimeRangeChange: (value: TimeRange) => void;
  onSeverityChange: (value: number) => void;
}

export function GlobeFilters({ sentiment, timeRange, minimumSeverity, onSentimentChange, onTimeRangeChange, onSeverityChange }: GlobeFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Number(sentiment !== "all") + Number(timeRange < MAX_TIME_RANGE_MINUTES) + Number(minimumSeverity > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="briefing-console relative z-30 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-1.5 sm:flex-nowrap sm:px-5">
      <div className="flex shrink-0 items-center justify-start">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-none font-system text-xs text-signal" aria-label={open ? "Collapse filters" : "Expand filters"} title={open ? "Collapse filters" : "Expand filters"}>
            {open ? <X aria-hidden="true" /> : <SlidersHorizontal aria-hidden="true" />}
            Filters
            {activeCount > 0 && <span className="flex size-5 items-center justify-center border border-signal/30 text-[10px]">{activeCount}</span>}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="w-full min-w-0 sm:w-auto sm:max-w-[620px] sm:flex-1">
        <div className="grid grid-cols-2 items-start gap-3 border-t border-border pt-2 sm:grid-cols-[1fr_1fr_1.3fr] sm:border-t-0 sm:pt-0">
          <div className="space-y-1">
            <p className="font-system text-[10px] uppercase text-muted-foreground">Sentiment</p>
            <Select value={sentiment} onValueChange={(value) => onSentimentChange(value as SentimentFilter)}>
              <SelectTrigger aria-label="Filter by sentiment" className="h-8 w-full min-w-0 rounded-none border-border bg-background/40 font-system text-xs shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sentiments</SelectItem>
                <SelectItem value="positive"><span className="flex items-center gap-2"><SentimentDot score={0.5} /> Positive</span></SelectItem>
                <SelectItem value="neutral"><span className="flex items-center gap-2"><SentimentDot score={0} /> Neutral</span></SelectItem>
                <SelectItem value="negative"><span className="flex items-center gap-2"><SentimentDot score={-0.5} /> Negative</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SignalSlider
            label="Time range"
            displayValue={formatTimeRange(timeRange)}
            ariaValueText={`Last ${formatTimeRange(timeRange)}`}
            min={0}
            max={TIME_RANGE_SLIDER_MAX}
            step={1}
            value={minutesToSliderPosition(timeRange)}
            marks={["10m", "30d"]}
            onValueChange={(position) => onTimeRangeChange(sliderPositionToMinutes(position))}
          />
          <SignalSlider
            className="col-span-2 sm:col-span-1"
            label="Minimum severity"
            displayValue={`${Math.round(minimumSeverity * 100)}%`}
            ariaValueText={`${Math.round(minimumSeverity * 100)} percent`}
            min={0}
            max={100}
            step={5}
            value={Math.round(minimumSeverity * 100)}
            marks={["0%", "100%"]}
            onValueChange={(value) => onSeverityChange(value / 100)}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
