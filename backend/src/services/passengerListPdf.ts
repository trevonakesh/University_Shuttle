// Printable list of the students travelling on one attendance poll.
import PDFDocument from 'pdfkit';

export interface Passenger {
  name: string;
  pickupPoint: string | null;
  phone: string | null;
}

export interface PassengerList {
  date: string;
  question: string;
  optionLabel: string;
  driverName: string;
  routeName: string | null;
  busRegNumber: string | null;
  passengers: Passenger[];
}

const INK = '#10203a';
const MUTED = '#7a8699';
const GREEN = '#0e7c66';
const AMBER = '#e8912f';
const LINE = '#dfe6ee';
const MARGIN = 40;
const PADDING = 7;
const COLUMNS = [
  { label: '#', width: 28 },
  { label: 'Student', width: 175 },
  { label: 'Pickup point', width: 160 },
  { label: 'Phone', width: 94 },
  { label: 'Boarded', width: 58 }
];
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

// Grouped by stop so the list reads in the order the bus collects people.
const byStop = (a: Passenger, b: Passenger): number => {
  if (!a.pickupPoint !== !b.pickupPoint) return a.pickupPoint ? -1 : 1;
  return (a.pickupPoint ?? '').localeCompare(b.pickupPoint ?? '') || a.name.localeCompare(b.name);
};

export const buildPassengerListPdf = (list: PassengerList): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: { Title: `Passenger list ${list.date}`, Author: 'UniShuttle' }
    });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageBottom = doc.page.height - MARGIN;

    const drawTableHeader = () => {
      const top = doc.y;
      doc.rect(MARGIN, top, TABLE_WIDTH, 24).fill(GREEN);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      let x = MARGIN;
      for (const col of COLUMNS) {
        doc.text(col.label, x + PADDING, top + 8, { width: col.width - PADDING * 2, lineBreak: false });
        x += col.width;
      }
      doc.x = MARGIN;
      doc.y = top + 24;
    };

    // Header
    doc.save().translate(MARGIN, MARGIN).scale(0.42).translate(-12, -16);
    doc.path('M20 44V60a15 15 0 0 0 30 0V46a15 15 0 0 1 30 0V72')
      .lineWidth(14).lineCap('round').lineJoin('round').stroke(GREEN);
    doc.circle(20, 26, 8.5).fill(AMBER);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text('Passenger List', MARGIN + 44, MARGIN + 1);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('UniShuttle', MARGIN + 44);

    doc.x = MARGIN;
    doc.y = MARGIN + 46;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(list.question, { width: TABLE_WIDTH });
    doc.moveDown(0.3);
    const bus = [list.routeName, list.busRegNumber].filter(Boolean).join('  |  ');
    doc.font('Helvetica').fontSize(10).fillColor(INK).text(`Travel date: ${list.date}`);
    doc.text(`Driver: ${list.driverName}${bus ? `  |  ${bus}` : ''}`, { width: TABLE_WIDTH });
    doc.font('Helvetica-Bold').fillColor(GREEN)
      .text(`${list.optionLabel}: ${list.passengers.length} student${list.passengers.length === 1 ? '' : 's'}`, { width: TABLE_WIDTH });
    doc.moveDown(0.8);

    drawTableHeader();

    // Rows
    doc.font('Helvetica').fontSize(10);
    [...list.passengers].sort(byStop).forEach((p, index) => {
      const cells = [String(index + 1), p.name, p.pickupPoint || '-', p.phone || '-'];
      const height = PADDING * 2 + Math.max(
        ...cells.map((text, i) => doc.heightOfString(text, { width: COLUMNS[i].width - PADDING * 2 }))
      );

      if (doc.y + height > pageBottom) {
        doc.addPage();
        drawTableHeader();
        doc.font('Helvetica').fontSize(10);
      }

      const top = doc.y;
      if (index % 2 === 1) doc.rect(MARGIN, top, TABLE_WIDTH, height).fill('#f6f9fb');
      doc.fillColor(INK);
      let x = MARGIN;
      cells.forEach((text, i) => {
        doc.text(text, x + PADDING, top + PADDING, { width: COLUMNS[i].width - PADDING * 2 });
        x += COLUMNS[i].width;
      });
      doc.lineWidth(0.8).rect(x + 23, top + height / 2 - 6, 12, 12).stroke(MUTED);
      doc.moveTo(MARGIN, top + height).lineTo(MARGIN + TABLE_WIDTH, top + height).lineWidth(0.5).stroke(LINE);
      doc.x = MARGIN;
      doc.y = top + height;
    });

    const generated = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });
    if (doc.y + 24 > pageBottom) doc.addPage();
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(`Generated ${generated}. Students can change their answer until the trip, so download again for the latest list.`, MARGIN, doc.y, { width: TABLE_WIDTH });

    doc.end();
  });
