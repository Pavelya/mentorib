import { InlineNotice } from "@/components/ui";
import { getTimezoneExplanation } from "@/lib/datetime";

type TimezoneNoticeProps = {
  timezone: string;
};

export function TimezoneNotice({ timezone }: TimezoneNoticeProps) {
  return (
    <InlineNotice title="Local time" tone="info">
      <p>{getTimezoneExplanation(timezone)}</p>
    </InlineNotice>
  );
}

