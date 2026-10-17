// npm run desk:check — the same manuscript check `npm run dev` runs, without starting a server.
import { formatDeskReport, scanDesk, writeDeskLog } from '../src/blog/desk.ts';

const scan = scanDesk();
process.stdout.write(formatDeskReport(scan));
console.log(`로그: ${writeDeskLog(scan)}`);
