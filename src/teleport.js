
async function fetchLatestRules() {
  const response = await fetch('/00_LATEST_CHECKPOINT_READ_FIRST.md');
  if (!response.ok) {
    console.error('Failed to fetch latest rules:', response.statusText);
    return 'Error loading rules.';
  }
  const data = await response.json();
  return data.rule || 'No rule found.';
}

async function fetchLatestCheckpoint() {
  const response = await fetch('/00_LATEST_CHECKPOINT_READ_FIRST.md');
  if (!response.ok) {
    console.error('Failed to fetch latest checkpoint:', response.statusText);
    return 'Error loading checkpoint.';
  }
  const data = await response.text();
  return data;
}
