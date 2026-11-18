// Phase E acceptance tests: reputation is purely derived from public mission data and the
// completed-mission list — nothing here can be spoofed to unlock anything money-related.
// Run: npm run test:reputation
import { reputationByDistrict, overallReputation, rankFor, tierReadyIn } from '../src/shared/reputation';
import type { PublicMission } from '../src/shared/types/content';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}`);
  if (!ok) failures++;
};

const mission = (id: string, tier: number, district: string, remote = false): PublicMission => ({
  id, kind: 'story', tier: tier as PublicMission['tier'], skill: 'SQL', title: id, summary: '', pay: 0, xp: 0, passMark: 75,
  client: { name: '', business: '', brief: [], thanks: '' }, location: { district, remote }, starterSql: '', tables: [], hints: [], findings: [],
});

function main() {
  console.log('Rank thresholds');
  check(rankFor(0) === 'Cadet Analyst', 'score 0 is a Cadet Analyst');
  check(rankFor(19) === 'Cadet Analyst', 'score 19 is still a Cadet Analyst');
  check(rankFor(20) === 'Trainee Analyst', 'score 20 becomes a Trainee Analyst');
  check(rankFor(100) === 'Partner', 'score 100 is a Partner');
  check(rankFor(85) === 'Partner', 'score 85 (the threshold) is already a Partner');

  console.log('Reputation by district');
  const missions = [mission('m1', 1, 'market'), mission('m2', 1, 'market'), mission('m3', 2, 'gardens'), mission('remote1', 1, 'market', true)];
  check(reputationByDistrict(missions, []).length === 0, 'no completed missions means no reputation anywhere');
  const oneDone = reputationByDistrict(missions, ['m1']);
  check(oneDone.length === 1 && oneDone[0].district === 'market' && oneDone[0].score === 15, 'one tier-1 job in a district gives 15 points there');
  const twoDone = reputationByDistrict(missions, ['m1', 'm2']);
  check(twoDone[0].score === 30, 'two tier-1 jobs in the same district add up');
  check(reputationByDistrict(missions, ['remote1']).length === 0, "a completed remote gig doesn't count toward any district (it has no district)");
  const capped = reputationByDistrict([mission('a', 5, 'market'), mission('b', 5, 'market'), mission('c', 5, 'market')], ['a', 'b', 'c']);
  check(capped[0].score === 100, 'reputation is capped at 100 even with a lot of high-tier work');
  const mixed = reputationByDistrict(missions, ['m1', 'm3']);
  check(mixed.length === 2, 'reputation is tracked separately per district');
  check(mixed.find((r) => r.district === 'gardens')!.score === 25, 'a tier-2 job is worth more reputation than a tier-1 one');

  console.log('Overall score (HUD title)');
  check(overallReputation(missions, []).rank === 'Cadet Analyst', 'a brand-new player is a Cadet Analyst');
  check(overallReputation(missions, ['m1', 'm2', 'm3']).score === Math.round((30 + 25) / 2), 'the overall score averages the district scores');

  console.log('Tier gating (soft: which jobs feel ready)');
  check(tierReadyIn(1, 'market', missions, []), 'tier 1 jobs are always open, even with no reputation');
  check(!tierReadyIn(3, 'gardens', missions, []), 'a tier 3 job in a district you have no standing in is not ready yet');
  check(tierReadyIn(3, 'gardens', missions, ['m3']), 'enough tier-2 reputation in a district opens its tier-3 jobs');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll reputation checks passed');
  process.exit(failures ? 1 : 0);
}

main();
