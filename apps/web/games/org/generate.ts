import { createRng, hashSeed, type Difficulty, type Rng } from "@boardatwork/game-core";

/**
 * Fixed office-flavoured vocabulary (SPEC §2.6: "you can hard-code a single
 * fixed vocabulary ... no content pack file needed"). Only the true
 * assignment and the sampled clue set vary by seed.
 */
export const PEOPLE: readonly string[] = ["Priya", "Chen", "Marcus", "Sofia", "Devon"];
/** Department names; the *role* a person leads. Grid columns/clue text say "{role} lead". */
export const ROLE_NAMES: readonly string[] = ["Design", "Sales", "Finance", "Engineering", "Support"];
export const TEAM_NAMES: readonly string[] = ["Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6"];

const N = PEOPLE.length;

/** A full three-way assignment: `role[personIdx]` / `team[personIdx]` -> index into `ROLE_NAMES` / `TEAM_NAMES`. */
export interface OrgAssignment {
  readonly role: readonly number[];
  readonly team: readonly number[];
}

export interface OrgClue {
  readonly id: string;
  readonly text: string;
  check(candidate: OrgAssignment): boolean;
}

export interface OrgPuzzle {
  seed: number;
  difficulty: Difficulty;
  people: readonly string[];
  roles: readonly string[];
  teams: readonly string[];
  /** The true assignment. `render`/`GameView` must never read this directly (SPEC §2.6) — only `engine.ts`'s check/hint do. */
  solution: OrgAssignment;
  clues: readonly OrgClue[];
}

const MAX_CLUES = 7;
const MIN_CLUES = 5;

function roleLead(r: number): string {
  return `${ROLE_NAMES[r] as string} lead`;
}

function otherIndices(exclude: number): number[] {
  return Array.from({ length: N }, (_, i) => i).filter((i) => i !== exclude);
}

/**
 * A pool candidate, carrying (alongside the public `OrgClue` shape) how it
 * constrains the role permutation and/or the team permutation on its own.
 * Every template here constrains one axis, or both independently (a
 * conjunction of one role-fact and one team-fact for the same person) —
 * never a fact that can only be checked by cross-referencing a *candidate*
 * role assignment against a *candidate* team assignment together. That
 * keeps every uniqueness check below a cheap O(120)-per-axis filter instead
 * of a full 14,400-pair scan (see `countSolutions`).
 */
interface PoolClue extends OrgClue {
  roleFilter?: (rolePerm: readonly number[]) => boolean;
  teamFilter?: (teamPerm: readonly number[]) => boolean;
}

/**
 * The clue-template library (SPEC §2.6: "6-8 distinct template shapes"):
 * direct facts (role, team, and the combined "both" fact needed to reach
 * uniqueness within budget — see `selectClueSet`), negative facts (role,
 * team), and a comparative fact ("X and the Y lead are not the same
 * person") — six shapes, each instantiated many ways below. Every instance
 * produced here is, by construction, true of `sol` (SPEC step 3).
 */
function buildCluePool(sol: OrgAssignment): PoolClue[] {
  const pool: PoolClue[] = [];

  PEOPLE.forEach((person, p) => {
    const trueRole = sol.role[p] as number;
    const trueTeam = sol.team[p] as number;

    pool.push({
      id: `role-${String(p)}`,
      text: `${person} is the ${roleLead(trueRole)}.`,
      check: (c) => c.role[p] === trueRole,
      roleFilter: (role) => role[p] === trueRole,
    });
    pool.push({
      id: `team-${String(p)}`,
      text: `${person} is on ${TEAM_NAMES[trueTeam] as string}.`,
      check: (c) => c.team[p] === trueTeam,
      teamFilter: (team) => team[p] === trueTeam,
    });
    // Compound direct fact: pins both of this person's axes at once. Needed
    // to reach uniqueness within SPEC's 7-clue cap at all: role and team
    // are two *independent* 5-element bijections, so single-axis facts
    // (direct/negative/comparative, all capped at revealing one axis for
    // one person) need facts about 4 distinct people *per axis* to pin it
    // by elimination — 8 single-axis facts in the worst case, over budget.
    // A compound fact lets one clue count toward both axes' 4-person quota
    // at once.
    pool.push({
      id: `both-${String(p)}`,
      text: `${person} runs ${ROLE_NAMES[trueRole] as string} out of ${TEAM_NAMES[trueTeam] as string}.`,
      check: (c) => c.role[p] === trueRole && c.team[p] === trueTeam,
      roleFilter: (role) => role[p] === trueRole,
      teamFilter: (team) => team[p] === trueTeam,
    });
    otherIndices(trueRole).forEach((r) => {
      pool.push({
        id: `negrole-${String(p)}-${String(r)}`,
        text: `${person} is not the ${roleLead(r)}.`,
        check: (c) => c.role[p] !== r,
        roleFilter: (role) => role[p] !== r,
      });
      pool.push({
        id: `notsame-${String(p)}-${String(r)}`,
        text: `${person} and the ${roleLead(r)} are not the same person.`,
        check: (c) => c.role[p] !== r,
        roleFilter: (role) => role[p] !== r,
      });
    });
    otherIndices(trueTeam).forEach((t) => {
      pool.push({
        id: `negteam-${String(p)}-${String(t)}`,
        text: `${person} is not on ${TEAM_NAMES[t] as string}.`,
        check: (c) => c.team[p] !== t,
        teamFilter: (team) => team[p] !== t,
      });
    });
  });

  return pool;
}

/** Every permutation of `[0..N)`, precomputed once — the per-axis candidate space for uniqueness checks (SPEC §2.6: 5! = 120 per axis, 5!x5! = 14,400 combined). */
function permutationsOfN(): number[][] {
  const out: number[][] = [];
  const arr = Array.from({ length: N }, (_, i) => i);
  function permute(k: number): void {
    if (k === arr.length) {
      out.push(arr.slice());
      return;
    }
    for (let i = k; i < arr.length; i += 1) {
      [arr[k], arr[i]] = [arr[i] as number, arr[k] as number];
      permute(k + 1);
      [arr[k], arr[i]] = [arr[i] as number, arr[k] as number];
    }
  }
  permute(0);
  return out;
}

const ALL_PERMS: readonly (readonly number[])[] = permutationsOfN();

/**
 * Counts candidate (role, team) bijection pairs satisfying every clue.
 * Every template in `buildCluePool` constrains its role half and/or team
 * half independently, so the combined count is just the product of two
 * independently-filtered lists of <=120 permutations each — no need to
 * walk the full 14,400-pair grid.
 */
function countSolutions(clues: readonly PoolClue[]): number {
  const roleCount = ALL_PERMS.filter((role) => clues.every((c) => !c.roleFilter || c.roleFilter(role))).length;
  const teamCount = ALL_PERMS.filter((team) => clues.every((c) => !c.teamFilter || c.teamFilter(team))).length;
  return roleCount * teamCount;
}

/**
 * SPEC §2.6 step 3: repeatedly sample a clue and add it, checking
 * uniqueness after each addition; stop once unique or at `MAX_CLUES`.
 *
 * "Sample" here is a randomised *greedy* pick — each round, the pool (in an
 * `rng`-shuffled order, so ties across otherwise-equal candidates vary by
 * seed) is scored by how far it would narrow the current role/team
 * candidate lists, and the best-scoring clue is taken. A uniform-random
 * pick (tried first) is not reliable within 7 clues here: role and team
 * are two *independent* 5-element bijections, so pinning each one by
 * elimination needs facts about 4 distinct people *per axis* — 8
 * single-axis facts in the worst case, over SPEC's budget. Greedy reliably
 * finds the compound "both" clues (and other high-information picks) that
 * let one clue count toward both axes' quota. If some pathological pool
 * still can't reach uniqueness by `MAX_CLUES`, that's a template-library
 * bug (SPEC §2.6 step 3) — guarded rather than ever shipping a non-unique
 * puzzle.
 */
function selectClueSet(pool: readonly PoolClue[], rng: Rng): PoolClue[] {
  let roleList: readonly (readonly number[])[] = ALL_PERMS;
  let teamList: readonly (readonly number[])[] = ALL_PERMS;
  let remaining = rng.shuffle(pool);
  const chosen: PoolClue[] = [];

  while (chosen.length < MAX_CLUES) {
    let bestIndex = -1;
    let bestScore = Infinity;
    let bestRoleList = roleList;
    let bestTeamList = teamList;
    for (let i = 0; i < remaining.length; i += 1) {
      const clue = remaining[i] as PoolClue;
      const rl = clue.roleFilter ? roleList.filter(clue.roleFilter) : roleList;
      const tl = clue.teamFilter ? teamList.filter(clue.teamFilter) : teamList;
      const score = rl.length * tl.length;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
        bestRoleList = rl;
        bestTeamList = tl;
        if (bestScore <= 1) {
          break;
        }
      }
    }
    if (bestIndex === -1) {
      break;
    }
    chosen.push(remaining[bestIndex] as PoolClue);
    roleList = bestRoleList;
    teamList = bestTeamList;
    remaining = remaining.filter((_, i) => i !== bestIndex);
    if (bestScore === 1) {
      return chosen;
    }
  }
  throw new Error("org generate: could not reach a unique clue set within the template library");
}

/** SPEC §2.6 step 4: prune redundant clues, keeping a floor of `MIN_CLUES`. */
function pruneClueSet(clues: readonly PoolClue[]): PoolClue[] {
  let current = clues.slice();
  let changed = true;
  while (changed && current.length > MIN_CLUES) {
    changed = false;
    for (let i = 0; i < current.length; i += 1) {
      if (current.length <= MIN_CLUES) {
        break;
      }
      const trial = current.filter((_, idx) => idx !== i);
      if (countSolutions(trial) === 1) {
        current = trial;
        changed = true;
        break;
      }
    }
  }
  return current;
}

export function dailySeed(dateKey: string): number {
  return hashSeed("org", dateKey);
}

export function practiceSeed(counter: number): number {
  return hashSeed("org", "practice", counter);
}

export function generate(seed: number, difficulty: Difficulty): OrgPuzzle {
  const rng = createRng(seed);
  const role = rng.shuffle([0, 1, 2, 3, 4]);
  const team = rng.shuffle([0, 1, 2, 3, 4]);
  const solution: OrgAssignment = { role, team };
  const pool = buildCluePool(solution);
  const chosen = selectClueSet(pool, rng);
  const clues = pruneClueSet(chosen);
  return {
    seed,
    difficulty,
    people: PEOPLE,
    roles: ROLE_NAMES,
    teams: TEAM_NAMES,
    solution,
    // Drop the internal roleFilter/teamFilter fields — outside this module
    // a clue is exactly `{ id, text, check }` (the public `OrgClue` shape).
    clues: clues.map(({ id, text, check }) => ({ id, text, check })),
  };
}
