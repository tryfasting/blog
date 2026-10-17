// npm run desk:check — the same manuscript check `npm run dev` runs, without starting a server.
//   npm run desk:check                         human-readable report, also written to logs/desk-check.log
//   npm run desk:check -- --json               the whole scan as JSON
//   npm run desk:check -- --file <path> --json one manuscript (used by the publish tool)
import { checkDeskFile, formatDeskReport, scanDesk, writeDeskLog } from '../src/blog/desk.ts';

const args = process.argv.slice(2);
const json = args.includes('--json');
const fileIndex = args.indexOf('--file');
const file = fileIndex >= 0 ? args[fileIndex + 1] : undefined;

if (file) {
  const result = checkDeskFile(file);
  console.log(json ? JSON.stringify(result) : `${result.status}: ${result.path}\n${result.problems.map((p) => `  ${p}`).join('\n')}`);
} else {
  const scan = scanDesk();
  const logPath = writeDeskLog(scan);
  if (json) {
    console.log(JSON.stringify(scan));
  } else {
    process.stdout.write(formatDeskReport(scan));
    console.log(`로그: ${logPath}`);
  }
}
