/**
 * Delete old GitHub Pages deployment records, keeping the newest N (default 10).
 *
 * Removes all but the newest N `github-pages` deployments, and all but the newest N finished
 * workflow runs (with their artifacts). Needs the `gh` CLI, logged in with access to the repo.
 *
 * Usage: pnpm prune-pages [N]
 */

import { execFileSync } from 'node:child_process';

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
const ids = output => output.split('\n').filter(Boolean);

const keep = Number(process.argv[2] ?? 10);
if (!Number.isInteger(keep) || keep < 1) {
    // The newest deployment is the live site, so at least one must stay.
    throw new Error(`Expected a whole number of records to keep, at least 1; got ${process.argv[2]}`);
}

const repo = gh('repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner');

// Both listings come newest first, so the first ids are the ones to keep.
const deployments = ids(gh('api', '--paginate',
    `repos/${repo}/deployments?environment=github-pages&per_page=100`, '--jq', '.[].id'));
for (const id of deployments.slice(keep)) {
    // GitHub refuses to delete a deployment until it is inactive.
    gh('api', '-X', 'POST', `repos/${repo}/deployments/${id}/statuses`, '-f', 'state=inactive');
    gh('api', '-X', 'DELETE', `repos/${repo}/deployments/${id}`);
}

const runs = ids(gh('api', '--paginate', `repos/${repo}/actions/runs?per_page=100`,
    '--jq', '.workflow_runs[] | select(.status == "completed") | .id'));
for (const id of runs.slice(keep)) {
    gh('api', '-X', 'DELETE', `repos/${repo}/actions/runs/${id}`);
}

console.log(`Deleted ${Math.max(deployments.length - keep, 0)} deployments and ${Math.max(runs.length - keep, 0)} workflow runs from ${repo}`);
