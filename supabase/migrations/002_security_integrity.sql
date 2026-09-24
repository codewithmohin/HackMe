-- Keep authorization and multi-step workflows inside PostgreSQL.
create or replace function public.register_for_hackathon(p_hackathon_id uuid, p_join_code text)
returns public.hackathon_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.hackathons;
  participant public.hackathon_participants;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into h from public.hackathons where id = p_hackathon_id for update;
  if h.id is null or h.join_code <> upper(trim(p_join_code)) then raise exception 'Invalid hackathon code'; end if;
  if now() < h.registration_start or now() > h.registration_end then raise exception 'Registration is closed'; end if;
  if h.max_participants is not null and (select count(*) from public.hackathon_participants where hackathon_id = h.id) >= h.max_participants then
    raise exception 'Hackathon is full';
  end if;
  insert into public.hackathon_participants(hackathon_id, user_id, status)
  values (h.id, auth.uid(), 'REGISTERED')
  on conflict (hackathon_id, user_id) do update set status = 'REGISTERED'
  returning * into participant;
  return participant;
end
$$;

create or replace function public.create_hackathon(p_payload jsonb)
returns public.hackathons
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.hackathons;
  item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.hackathons(
    host_id, name, description, theme, category, registration_start, registration_end,
    hacking_start, hacking_end, submission_deadline, judging_start, judging_end,
    winner_announcement_at, max_team_size, max_participants, eligibility, rules
  )
  values (
    auth.uid(), p_payload->>'name', p_payload->>'description', p_payload->>'theme',
    p_payload->>'category', (p_payload->>'registration_start')::timestamptz,
    (p_payload->>'registration_end')::timestamptz, (p_payload->>'hacking_start')::timestamptz,
    (p_payload->>'hacking_end')::timestamptz, (p_payload->>'submission_deadline')::timestamptz,
    (p_payload->>'judging_start')::timestamptz, (p_payload->>'judging_end')::timestamptz,
    (p_payload->>'winner_announcement_at')::timestamptz, (p_payload->>'max_team_size')::int,
    (p_payload->>'max_participants')::int, nullif(p_payload->>'eligibility',''), p_payload->>'rules'
  ) returning * into h;

  for item in select * from jsonb_array_elements(p_payload->'prizes') loop
    insert into public.prizes(hackathon_id, title, position, amount, currency, description)
    values (h.id, item->>'title', (item->>'position')::int, (item->>'amount')::numeric, 'INR', nullif(item->>'description',''));
  end loop;
  for item in select * from jsonb_array_elements(p_payload->'timeline_events') loop
    insert into public.timeline_events(hackathon_id, type, title, start_at, end_at)
    values (h.id, item->>'type', item->>'title', (item->>'start_at')::timestamptz, (item->>'end_at')::timestamptz);
  end loop;
  for item in select * from jsonb_array_elements(p_payload->'criteria') loop
    insert into public.judging_criteria(hackathon_id, name, max_score)
    values (h.id, item->>'name', (item->>'max_score')::int);
  end loop;
  insert into public.judges(hackathon_id, user_id) values (h.id, auth.uid());
  return h;
end
$$;

create or replace function public.submit_project(
  p_team_id uuid, p_project_name text, p_short_description text, p_description text,
  p_github_url text, p_demo_url text, p_video_url text, p_tech_stack text[]
) returns public.submissions
language plpgsql security definer set search_path = public
as $$
declare s public.submissions; hid uuid; deadline timestamptz;
begin
  select t.hackathon_id, h.submission_deadline into hid, deadline
  from public.teams t join public.hackathons h on h.id = t.hackathon_id
  where t.id = p_team_id
    and public.is_hackathon_participant(t.hackathon_id)
    and exists (select 1 from public.team_members tm where tm.team_id=t.id and tm.user_id=auth.uid());
  if hid is null then raise exception 'You are not an active participant on this team'; end if;
  if now() > deadline then raise exception 'Submission deadline has passed'; end if;
  if exists(select 1 from public.submissions where team_id=p_team_id) then raise exception 'A submission already exists for this team'; end if;
  insert into public.submissions(team_id, project_name, short_description, description, github_url, demo_url, video_url, tech_stack, status, submitted_at)
  values(p_team_id, trim(p_project_name), trim(p_short_description), nullif(trim(p_description),''), trim(p_github_url),
    nullif(trim(p_demo_url),''), nullif(trim(p_video_url),''), p_tech_stack, 'SUBMITTED', now())
  returning * into s;
  return s;
end
$$;

create or replace function public.get_public_leaderboard(p_hackathon_id uuid)
returns table(submission_id uuid, hackathon_id uuid, team_name text, project_name text, total_score numeric)
language sql stable security definer set search_path = public
as $$
  select s.id, t.hackathon_id, t.name, s.project_name,
    coalesce(sum(sc.innovation + sc.impact + sc.technical + sc.presentation), 0)::numeric
  from public.submissions s
  join public.teams t on t.id=s.team_id
  join public.hackathons h on h.id=t.hackathon_id
  left join public.scores sc on sc.submission_id=s.id
  where t.hackathon_id=p_hackathon_id and now() >= h.winner_announcement_at
  group by s.id, t.hackathon_id, t.name, s.project_name
$$;
revoke all on public.leaderboard from anon, authenticated;

-- Replace broad reads/writes with participant, host, and judge scoped policies.
drop policy if exists participant_self_insert on public.hackathon_participants;
drop policy if exists participant_read on public.hackathon_participants;
create policy participant_read on public.hackathon_participants for select to authenticated
using (user_id = auth.uid() or public.is_hackathon_host(hackathon_id));
create policy participant_self_insert on public.hackathon_participants for insert to authenticated with check (false);

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated
using (public.is_hackathon_host(hackathon_id) or public.is_hackathon_participant(hackathon_id));
drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members for select to authenticated
using (public.is_hackathon_host((select hackathon_id from public.teams where id=team_id))
  or public.is_hackathon_participant((select hackathon_id from public.teams where id=team_id)));

drop policy if exists submissions_read on public.submissions;
create policy submissions_read on public.submissions for select to authenticated
using (public.is_hackathon_host((select hackathon_id from public.teams where id=team_id))
  or public.is_hackathon_participant((select hackathon_id from public.teams where id=team_id))
  or exists (select 1 from public.judges j where j.hackathon_id=(select hackathon_id from public.teams where id=team_id) and j.user_id=auth.uid()));

drop policy if exists judges_read on public.judges;
create policy judges_read on public.judges for select to authenticated
using (user_id=auth.uid() or public.is_hackathon_host(hackathon_id));
drop policy if exists criteria_read on public.judging_criteria;
create policy criteria_read on public.judging_criteria for select to authenticated
using (public.is_hackathon_host(hackathon_id) or public.is_hackathon_participant(hackathon_id)
  or exists (select 1 from public.judges where hackathon_id=judging_criteria.hackathon_id and user_id=auth.uid()));

drop policy if exists scores_read on public.scores;
drop policy if exists scores_self_insert on public.scores;
drop policy if exists scores_self_update on public.scores;
create policy scores_read on public.scores for select to authenticated
using (exists (
  select 1 from public.submissions s join public.teams t on t.id=s.team_id
  where s.id=scores.submission_id and (public.is_hackathon_host(t.hackathon_id)
    or exists (select 1 from public.judges j where j.hackathon_id=t.hackathon_id and j.user_id=auth.uid()))
));
create policy scores_self_insert on public.scores for insert to authenticated
with check (judge_id=auth.uid() and exists (
  select 1 from public.submissions s join public.teams t on t.id=s.team_id
  join public.judges j on j.hackathon_id=t.hackathon_id and j.user_id=auth.uid()
  where s.id=submission_id
));
create policy scores_self_update on public.scores for update to authenticated using (judge_id=auth.uid()) with check (judge_id=auth.uid());

drop policy if exists winners_read on public.winners;
create policy winners_read on public.winners for select to authenticated
using (now() >= (select winner_announcement_at from public.hackathons where id=hackathon_id)
  or public.is_hackathon_host(hackathon_id));
drop policy if exists winners_host_write on public.winners;
create policy winners_host_write on public.winners for all to authenticated
using (public.is_hackathon_host(hackathon_id))
with check (public.is_hackathon_host(hackathon_id) and exists (
  select 1 from public.submissions s join public.teams t on t.id=s.team_id
  where s.id=winners.submission_id and t.hackathon_id=winners.hackathon_id
));
