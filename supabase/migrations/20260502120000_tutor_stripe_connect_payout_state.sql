alter table public.tutor_profiles
  add column stripe_account_id text,
  add column payout_account_country text,
  add column payout_onboarding_started_at timestamptz,
  add column payout_onboarding_completed_at timestamptz,
  add column payout_requirements_summary jsonb,
  add column payout_status_synced_at timestamptz,
  add constraint tutor_profiles_stripe_account_id_not_blank_chk check (
    stripe_account_id is null or btrim(stripe_account_id) <> ''
  ),
  add constraint tutor_profiles_stripe_account_id_format_chk check (
    stripe_account_id is null or stripe_account_id ~ '^acct_[A-Za-z0-9]+$'
  ),
  add constraint tutor_profiles_stripe_account_id_key unique (stripe_account_id),
  add constraint tutor_profiles_payout_account_country_chk check (
    payout_account_country is null or payout_account_country ~ '^[A-Z]{2}$'
  ),
  add constraint tutor_profiles_payout_requirements_summary_object_chk check (
    payout_requirements_summary is null or jsonb_typeof(payout_requirements_summary) = 'object'
  );

create index tutor_profiles_stripe_account_id_idx
  on public.tutor_profiles (stripe_account_id)
  where stripe_account_id is not null;
