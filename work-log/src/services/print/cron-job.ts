import cron from "node-cron";
import prisma from "@/lib/prisma";

/**
 * 10:00 AM daily print job
 * 
 * This cron job runs every day at 10:00 AM and generates print-ready data
 * for all therapists who have worksheets for the current date.
 * 
 * In production, this would:
 * 1. Generate PDF files for each therapist
 * 2. Save them to a print queue
 * 3. Auto-print to connected printers
 * 
 * For MVP, this logs the data that would be printed.
 * The actual printing is done through the browser's print dialog
 * via the /print page.
 */
export function startPrintCronJob() {
  // Run every day at 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("[Print Cron] Running daily print job at 10:00 AM");

    try {
      const today = new Date().toISOString().split("T")[0];

      const worksheets = await prisma.workSheet.findMany({
        where: { date: today, status: { not: "deleted" } },
        include: {
          therapist: { select: { id: true, name: true } },
          entries: {
            orderBy: { rowNumber: "asc" },
          },
        },
        orderBy: { therapistId: "asc" },
      });

      if (worksheets.length === 0) {
        console.log("[Print Cron] No worksheets found for today");
        return;
      }

      // Group by therapist
      const grouped: Record<string, typeof worksheets> = {};
      for (const ws of worksheets) {
        const key = ws.therapist.name;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(ws);
      }

      console.log(`[Print Cron] Generated print data for ${Object.keys(grouped).length} therapists:`);
      for (const [name, wss] of Object.entries(grouped)) {
        const entryCount = wss.reduce((sum, ws) => sum + ws.entries.length, 0);
        console.log(`  - ${name}: ${entryCount} entries`);
      }

      // In production, this would:
      // 1. Generate PDF files using pdf-lib or similar
      // 2. Save to print-output/ directory
      // 3. Send to printer via system print command
      // 4. Or queue for manual printing from the print management page

      console.log("[Print Cron] Print job completed");
    } catch (error) {
      console.error("[Print Cron] Error:", error);
    }
  });
}