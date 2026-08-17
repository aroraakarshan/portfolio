interface Slot {
  time: string;
  available: boolean;
}

interface DayData {
  date: Date;
  slots: Slot[];
}

// ── State ──
let selectedDate: Date | null = null;
let selectedSlot: string | null = null;
const allDays: DayData[] = [];

// ── Generate 14 days of mock data ──
function generateMockData(): DayData[] {
  const days: DayData[] = [];
  const now = new Date();
  const timeOptions = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM',
  ];

  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    // Randomly mark some slots as booked for visual demo
    const slots: Slot[] = timeOptions.map((time) => ({
      time,
      available: Math.random() > 0.25, // 75% available
    }));

    days.push({ date, slots });
  }
  return days;
}

// ── Format helpers ──
function formatDayAbbr(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function formatDayNum(date: Date): string {
  return date.getDate().toString();
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Render ──
function renderDateBar(container: HTMLElement): void {
  container.innerHTML = '';

  allDays.forEach((day) => {
    const btn = document.createElement('button');
    btn.className = 'bk-date-chip';
    btn.setAttribute('aria-label', day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    const abbr = document.createElement('span');
    abbr.className = 'bk-date-chip-day';
    abbr.textContent = formatDayAbbr(day.date);

    const num = document.createElement('span');
    num.className = 'bk-date-chip-num';
    num.textContent = formatDayNum(day.date);

    btn.appendChild(abbr);
    btn.appendChild(num);

    if (isToday(day.date)) {
      btn.classList.add('bk-date-chip--today');
    }

    if (selectedDate && isSameDate(day.date, selectedDate)) {
      btn.classList.add('bk-date-chip--selected');
    }

    btn.addEventListener('click', () => selectDate(day.date, btn));
    container.appendChild(btn);
  });

  // Scroll selected into view
  const selected = container.querySelector('.bk-date-chip--selected') as HTMLElement | null;
  if (selected) {
    selected.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

function renderTimeSlots(container: HTMLElement): void {
  container.innerHTML = '';

  if (!selectedDate) {
    container.innerHTML =
      '<p class="bk-empty-msg">Select a date to see available time slots.</p>';
    return;
  }

  const dayData = allDays.find((d) => isSameDate(d.date, selectedDate!));
  if (!dayData) return;

  const availableCount = dayData.slots.filter((s) => s.available).length;

  // Slot count
  const countEl = document.createElement('p');
  countEl.className = 'bk-slot-count';
  countEl.textContent = `${availableCount} slot${availableCount !== 1 ? 's' : ''} available`;
  container.appendChild(countEl);

  // Slot grid
  const grid = document.createElement('div');
  grid.className = 'bk-slot-grid';

  dayData.slots.forEach((slot) => {
    const btn = document.createElement('button');
    btn.className = 'bk-slot-chip';
    btn.textContent = slot.time;
    btn.setAttribute('aria-label', slot.time);

    if (!slot.available) {
      btn.classList.add('bk-slot-chip--booked');
      btn.disabled = true;
      btn.setAttribute('aria-label', `${slot.time} — booked`);
    }

    if (selectedSlot === slot.time && slot.available) {
      btn.classList.add('bk-slot-chip--selected');
    }

    if (slot.available) {
      btn.addEventListener('click', () => selectSlot(slot.time, btn));
    }

    grid.appendChild(btn);
  });

  container.appendChild(grid);
}

function renderSummary(container: HTMLElement): void {
  container.innerHTML = '';

  if (selectedDate && selectedSlot) {
    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div class="bk-summary">
        <div class="bk-summary-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${dateStr}</span>
        </div>
        <div class="bk-summary-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <span>${selectedSlot} IST</span>
        </div>
        <a href="${bookingLink}" target="_blank" rel="noopener" class="bk-book-btn">
          Confirm Booking →
        </a>
      </div>
    `;
    container.innerHTML = html;
  }
}

let bookingLink = 'https://topmate.io/akarshanarora';

function selectDate(date: Date, chipEl: HTMLElement): void {
  selectedDate = date;
  selectedSlot = null;

  // Update chip styles
  document.querySelectorAll('.bk-date-chip').forEach((el) => el.classList.remove('bk-date-chip--selected'));
  chipEl.classList.add('bk-date-chip--selected');

  // Re-render dependent sections
  const timeContainer = document.getElementById('bk-time-slots');
  if (timeContainer) renderTimeSlots(timeContainer);

  const summaryContainer = document.getElementById('bk-summary');
  if (summaryContainer) renderSummary(summaryContainer);
}

function selectSlot(time: string, chipEl: HTMLElement): void {
  selectedSlot = time;

  // Update slot styles
  document.querySelectorAll('.bk-slot-chip--selected').forEach((el) => el.classList.remove('bk-slot-chip--selected'));
  chipEl.classList.add('bk-slot-chip--selected');

  const summaryContainer = document.getElementById('bk-summary');
  if (summaryContainer) renderSummary(summaryContainer);
}

// ── Init ──
export function initBookingWidget(link?: string): void {
  if (link) bookingLink = link;

  allDays.length = 0;
  allDays.push(...generateMockData());

  // Default: select first available date
  selectedDate = allDays[0]?.date ?? null;
  selectedSlot = null;

  const dateBar = document.getElementById('bk-date-bar');
  const timeSlots = document.getElementById('bk-time-slots');
  const summary = document.getElementById('bk-summary');

  if (dateBar) renderDateBar(dateBar);
  if (timeSlots) renderTimeSlots(timeSlots);
  if (summary) renderSummary(summary);

  // Select first date visually
  if (selectedDate && dateBar) {
    const firstChip = dateBar.querySelector('.bk-date-chip') as HTMLElement | null;
    if (firstChip) firstChip.classList.add('bk-date-chip--selected');
  }
}
