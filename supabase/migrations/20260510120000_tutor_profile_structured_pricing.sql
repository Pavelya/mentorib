alter table public.tutor_profiles
  add column trial_price_minor integer,
  add column hourly_rate_minor integer,
  add column currency_code text not null default 'USD',
  add constraint tutor_profiles_trial_price_minor_nonnegative_chk check (
    trial_price_minor is null or trial_price_minor >= 0
  ),
  add constraint tutor_profiles_hourly_rate_minor_positive_chk check (
    hourly_rate_minor is null or hourly_rate_minor > 0
  ),
  add constraint tutor_profiles_currency_code_format_chk check (
    currency_code ~ '^[A-Z]{3}$'
  );

comment on column public.tutor_profiles.trial_price_minor is
  'Trial-lesson price in minor currency units (e.g. cents). Null when no trial price has been set.';

comment on column public.tutor_profiles.hourly_rate_minor is
  'Standard hourly lesson rate in minor currency units. Tightened to required by P2-PROFILE-001; required for listing-readiness Gate 2 in this task.';

comment on column public.tutor_profiles.currency_code is
  'ISO 4217 three-letter currency code for the structured price columns. Defaults to USD; multi-currency display switching is out of scope.';

create index tutor_profiles_hourly_rate_minor_idx
  on public.tutor_profiles (hourly_rate_minor)
  where hourly_rate_minor is not null;

create index tutor_profiles_trial_price_minor_idx
  on public.tutor_profiles (trial_price_minor)
  where trial_price_minor is not null;
