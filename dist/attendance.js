import { ATTENDANCE_RADIUS_METERS, eventStatus } from './attendance-model.js';

const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const svg = (name) =>
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  ({
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18m-12 4h2m4 0h2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4c3 0 4 3 4 5v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"/>',
    trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 11 3 3 5-5"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  }[name] || '') +
  '</svg>';
const btn = (label, action, secondary = false, extra = '') =>
  `<button type="button" class="button ${secondary ? 'secondary' : ''}" data-att-action="${action}" ${extra}>${label}</button>`;
const badge = (status) =>
  `<span class="va-badge va-${String(status).toLowerCase().replaceAll(' ', '-')}">${esc(status)}</span>`;
const fmtDate = (w) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: w.timezone,
  }).format(new Date(w.opensAt));
const fmtTime = (w) => {
  const f = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: w.timezone,
  });
  return `${f.format(new Date(w.opensAt))} – ${f.format(new Date(w.closesAt))}`;
};
const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const locate = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error('This browser does not support location. Try another browser.'));
    navigator.geolocation.getCurrentPosition(
      resolve,
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? 'Allow browser location access to check in.'
              : e.code === 3
                ? 'Location timed out. Move near a window and try again.'
                : 'Your location is unavailable. Enable precise location and try again.',
          ),
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  });
let leafletReady;
function loadMap() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletReady)
    leafletReady = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'vendor/leaflet.js';
      script.onload = () => resolve(window.L);
      script.onerror = () => {
        leafletReady = null;
        script.remove();
        reject(new Error('The map could not load. Please try again.'));
      };
      document.head.append(script);
    });
  return leafletReady;
}

// Visible tabs report presence across the dashboard; this never requests location.
export function startAttendancePresence(session, api, onSession) {
  let pending = false;
  async function beat() {
    if (!session.enrolled || document.hidden || pending) return;
    pending = true;
    try {
      await api('POST', '/presence');
    } catch {
      /* Presence is best effort. */
    } finally {
      pending = false;
    }
  }
  onSession(beat);
  setInterval(beat, 30000);
  document.addEventListener('visibilitychange', beat);
  void beat();
}

export function attendancePage() {
  return '<div class="va-attendance" data-attendance><div class="panel loading-panel"><span class="spinner"></span><p>Opening your attendance record…</p></div></div>';
}

export function mountAttendance(root, { api, profile }) {
  if (!root) return () => {};
  const teacher = profile.role === 'instructor';
  let data = null,
    stopped = false,
    pending = false,
    busy = false,
    error = '',
    notice = '',
    selectedId = '',
    view = 'events',
    query = '',
    filter = 'all',
    offset = 0,
    checkinCode = '';
  const dialogs = new Set();
  const now = () => Date.now() + offset;
  const selected = () =>
    data?.events.find((w) => w.id === selectedId) ??
    data?.events.find((w) => eventStatus(w, now()) === 'Open') ??
    data?.events.find((w) => eventStatus(w, now()) === 'Upcoming') ??
    data?.events[0];
  function openDialog(title, body) {
    const dialog = document.createElement('dialog');
    dialog.className = 'va-dialog';
    dialog.innerHTML = `<header><div><span class="micro">VALUS / ATTENDANCE</span><h2 id="va-dialog-${dialogs.size}">${esc(title)}</h2></div><button class="icon-button" type="button" aria-label="Close dialog">${svg('close')}</button></header>${body}`;
    dialog.setAttribute('aria-labelledby', `va-dialog-${dialogs.size}`);
    dialogs.add(dialog);
    document.body.append(dialog);
    dialog.querySelector('header button').onclick = () => dialog.close();
    dialog.addEventListener(
      'close',
      () => {
        dialog.cleanup?.();
        dialogs.delete(dialog);
        dialog.remove();
      },
      { once: true },
    );
    dialog.showModal();
    return dialog;
  }
  async function refresh(quiet = false) {
    if (pending || stopped) return;
    pending = true;
    try {
      const next = await api('GET', '/attendance');
      if (stopped) return;
      data = next;
      offset = Date.parse(next.serverTime) - Date.now();
      error = '';
      paint();
    } catch (e) {
      if (!stopped) {
        error = e.message;
        if (!quiet || !data) paint();
      }
    } finally {
      pending = false;
    }
  }
  function paint() {
    if (stopped) return;
    const focused = root.querySelector('[data-att-search]') === document.activeElement;
    const cursor = focused ? document.activeElement.selectionStart : null;
    const events = data?.events ?? [],
      members = data?.members ?? [],
      online = members.filter((m) => m.online),
      students = members.filter((m) => m.role === 'student');
    const closed = events.filter((w) => !w.cancelled && Date.parse(w.closesAt) <= now());
    const expected = teacher ? closed.reduce((n, w) => n + w.expected, 0) : closed.length;
    const present = teacher
      ? closed.reduce((n, w) => n + w.present, 0)
      : closed.filter((w) => w.checkedInAt).length;
    const open = events.filter((w) => eventStatus(w, now()) === 'Open').length;
    const rate = expected ? Math.round((present / expected) * 100) + '%' : '—';
    root.innerHTML = `<div class="va-heading"><div><span class="eyebrow">${teacher ? 'CHAPTER ATTENDANCE' : 'YOUR ATTENDANCE'} / ${esc(profile.community?.name || 'Valus')}</span><h1>Every presence <em>matters.</em></h1><p>${teacher ? 'Bring your chapter together. A clear record of every event and every student.' : 'Show up, check in, and keep your chapter journey moving.'}</p></div><div class="va-actions">${btn(svg('refresh') + 'Refresh', 'refresh', true)}${teacher ? btn(svg('plus') + 'New event', 'create') : ''}</div></div>
    ${error ? `<p class="va-message va-error" role="alert">${esc(error)}</p>` : ''}${notice ? `<p class="va-message va-success" role="status">${svg('check')}${esc(notice)}</p>` : ''}
    <div class="va-stats">${[
      ['Attendance rate', rate, 'Completed events only', 'shield'],
      [
        teacher ? 'Events scheduled' : 'Events attended',
        teacher
          ? events.filter((w) => !w.cancelled).length
          : events.filter((w) => !w.cancelled && w.checkedInAt).length,
        teacher ? 'An individual code for every event' : 'Your recorded check-ins',
        'calendar',
      ],
      ['Open for check-in', open, 'Code, time, and location verified', 'clock'],
      [
        teacher ? 'Online now' : 'Upcoming events',
        teacher ? online.length : events.filter((w) => eventStatus(w, now()) === 'Upcoming').length,
        teacher ? 'Active in the last 90 seconds' : 'Your next chance to connect',
        'users',
      ],
    ]
      .map(
        ([title, value, hint, icon]) =>
          `<div class="va-stat"><span>${esc(title)}${svg(icon)}</span><strong>${value}</strong><small>${esc(hint)}</small></div>`,
      )
      .join('')}</div>
    ${
      teacher
        ? `<nav class="va-tabs" aria-label="Attendance views">${[
            ['events', 'Events', 'calendar'],
            ['analytics', 'Student analytics', 'shield'],
            ['online', 'Online now', 'users'],
          ]
            .map(
              ([id, label, icon]) =>
                `<button data-att-action="view" data-view="${id}" aria-pressed="${view === id}">${svg(icon)}${label}${id === 'online' ? `<b>${online.length}</b>` : ''}</button>`,
            )
            .join('')}</nav>`
        : ''
    }
    ${!data ? `<section class="panel va-empty">${svg('calendar')}<h2>${error ? 'Attendance could not load.' : 'Loading attendance…'}</h2><p>Use Refresh to try again.</p></section>` : view === 'online' ? onlinePanel(online) : view === 'analytics' ? analyticsPanel(students, events) : eventsPanel(events)}
    <p class="va-foot">${svg('shield')}${teacher ? 'Private to your chapter. Upcoming and cancelled events do not affect attendance rates.' : 'Your teacher sets the event’s check-in window and location.'}</p>`;
    if (focused) {
      const input = root.querySelector('[data-att-search]');
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    }
  }
  function toolbar(events = false) {
    return `<div class="va-toolbar"><label class="va-search">${svg('search')}<input data-att-search aria-label="${events ? 'Search events' : 'Search students'}" value="${esc(query)}" placeholder="${events ? 'Find an event…' : 'Search your students…'}"></label>${
      events
        ? `<select data-att-filter aria-label="Filter events">${[
            ['all', 'All days'],
            ['open', 'Open now'],
            ['upcoming', 'Upcoming'],
            ['closed', 'Closed'],
            ['cancelled', 'Cancelled'],
          ]
            .map(
              ([id, label]) =>
                `<option value="${id}" ${filter === id ? 'selected' : ''}>${label}</option>`,
            )
            .join('')}</select>`
        : ''
    }</div>`;
  }
  function eventsPanel(events) {
    const visible = events.filter(
      (w) =>
        (filter === 'all' || eventStatus(w, now()).toLowerCase() === filter) &&
        `${w.title} ${w.locationName}`.toLowerCase().includes(query.toLowerCase()),
    );
    const w = selected();
    return `<div class="va-layout"><section class="panel va-schedule"><div class="va-panel-title"><div><span class="micro">THE CHAPTER CALENDAR</span><h2>Event days <b>${events.length}</b></h2></div></div>${toolbar(true)}<div class="va-events">${visible.length ? visible.map((e) => `<button class="va-event ${w?.id === e.id ? 'is-selected' : ''}" data-att-action="select" data-id="${esc(e.id)}" aria-pressed="${w?.id === e.id}"><span class="va-date"><small>${new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: e.timezone }).format(new Date(e.opensAt))}</small><strong>${new Intl.DateTimeFormat(undefined, { day: 'numeric', timeZone: e.timezone }).format(new Date(e.opensAt))}</strong></span><span class="va-event-info"><span><strong>${esc(e.title)}</strong>${badge(e.checkedInAt && !e.cancelled ? 'Present' : eventStatus(e, now()))}</span><small>${svg('clock')}${esc(fmtTime(e))}</small><small>${svg('pin')}${esc(e.locationName)}</small>${teacher ? `<small class="va-accent">${e.present} / ${e.expected} checked in</small>` : ''}</span>${svg('arrow')}</button>`).join('') : `<div class="va-empty">${svg('calendar')}<h3>${events.length ? 'No matching events.' : 'A day worth showing up for.'}</h3><p>${events.length ? 'Try another search or filter.' : teacher ? 'Plan an event, choose a place, and welcome your chapter.' : 'Your teacher’s scheduled events will appear here.'}</p>${teacher && !events.length ? btn(svg('plus') + 'Plan an event', 'create') : ''}</div>`}</div></section><aside class="va-detail">${w ? detail(w) : `<section class="panel va-empty">${svg('pin')}<h2>A place to connect.</h2><p>Select an event to see its time, location, and attendance details.</p></section>`}<div class="va-callout">${svg('shield')}<div><strong>Right place. Right time.</strong><p>Check-in needs the event code and a precise browser location within 0.5 mile, during your teacher’s time window.</p></div></div></aside></div>`;
  }
  function detail(w) {
    const status = eventStatus(w, now());
    return `<section class="panel va-detail-panel"><div class="va-detail-head"><div><span class="micro">${teacher ? 'EVENT CONTROL' : 'YOUR CHECK-IN'}</span>${badge(status)}</div><h2>${esc(w.title)}</h2><p>${esc(fmtDate(w))}</p></div><div class="va-detail-body"><div class="va-detail-line">${svg('clock')}<div><strong>${esc(fmtTime(w))}</strong><small>${esc(w.timezone)}</small></div></div><div class="va-detail-line">${svg('pin')}<div><strong>${esc(w.locationName)}</strong><a href="https://www.openstreetmap.org/?mlat=${w.latitude}&mlon=${w.longitude}#map=16/${w.latitude}/${w.longitude}" target="_blank" rel="noreferrer">View location ↗</a></div></div>
    ${
      teacher
        ? `<div class="va-code"><span class="micro">ATTENDANCE CODE</span><strong>${esc(w.code)}</strong><button class="text-button" data-att-action="copy">${svg('copy')}Copy code</button></div><div class="va-progress-label"><span>Students checked in</span><strong>${w.present} / ${w.expected}</strong></div><progress max="${Math.max(1, w.expected)}" value="${w.present}" aria-label="Event attendance"></progress><div class="va-controls">${['Open', 'Upcoming'].includes(status) ? `${btn(svg('refresh') + 'New code', 'rotate', true)}<button class="text-button" data-att-action="cancel">Cancel event</button>` : ''}<button class="va-delete text-button" data-att-action="delete">${svg('trash')}Delete event</button></div>`
        : w.checkedInAt && !w.cancelled
          ? `<div class="va-checked">${svg('check')}<h3>You showed up.</h3><p>Attendance recorded at ${new Date(w.checkedInAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: w.timezone })}.</p></div>`
          : status === 'Open'
            ? `<form data-att-checkin><label class="field">Enter your event code<input name="code" value="${esc(checkinCode)}" minlength="8" maxlength="8" placeholder="8-character code" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label><button class="button" ${busy ? 'disabled' : ''}>${svg('pin')}${busy ? 'Checking location…' : 'Check in with location'}</button><p class="va-help">Your browser will ask for location access. Exact coordinates are used for this check and are not saved.</p></form>`
            : `<div class="va-callout">${svg('clock')}<p>${w.cancelled ? 'This event was cancelled. It does not affect your attendance.' : status === 'Upcoming' ? 'Check-in opens at the time above. Ask your teacher for the code when you arrive.' : 'The check-in window is closed. No attendance was recorded for this event.'}</p></div>`
    }</div></section>`;
  }
  function analyticsPanel(students, events) {
    const w = selected();
    return `<section class="panel va-report"><div class="va-panel-title"><div><span class="micro">THE PEOPLE BEHIND THE PROGRESS</span><h2>Student attendance</h2><p>Rates use completed events from each student’s saved roster.</p></div>${btn(svg('download') + 'Export attendance', 'export', true)}</div><div class="va-report-tools">${toolbar()}<select data-att-report aria-label="Event report">${events.map((e) => `<option value="${esc(e.id)}" ${w?.id === e.id ? 'selected' : ''}>${esc(e.title)} · ${fmtDate(e)}</option>`).join('')}</select></div><div class="va-table-scroll"><table><thead><tr><th>Student</th><th>Completed attendance</th><th>Attendance rate</th><th>Selected event</th></tr></thead><tbody>${students
      .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      .map((m) => {
        const r = data.records.find((r) => r.eventId === w?.id && r.studentId === m.id);
        const state = !w
          ? '—'
          : w.cancelled
            ? 'Cancelled'
            : !w.audienceIds?.includes(m.id)
              ? 'Not on roster'
              : r
                ? 'Present'
                : eventStatus(w, now()) === 'Closed'
                  ? 'Absent'
                  : 'Pending';
        return `<tr><td><span class="va-person"><i class="${m.online ? 'is-online' : ''}">${esc(m.name.slice(0, 1))}</i><span><strong>${esc(m.name)}</strong><small>${m.online ? 'Online now' : 'Offline'}</small></span></span></td><td>${m.attended} <span class="subtle">/ ${m.expected} events</span></td><td><span class="va-rate"><progress max="100" value="${m.rate ?? 0}" aria-label="${esc(m.name)} attendance rate"></progress><strong>${m.rate === null ? '—' : m.rate + '%'}</strong></span></td><td>${badge(state)}${r ? `<small class="va-record-time">${new Date(r.checkedInAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: w.timezone })}</small>` : ''}</td></tr>`;
      })
      .join(
        '',
      )}</tbody></table></div>${!students.length ? '<div class="va-empty"><h3>No students yet.</h3><p>Students appear here when they join your chapter.</p></div>' : ''}</section>`;
  }
  function onlinePanel(members) {
    return `<section class="panel"><div class="va-panel-title"><div><span class="micro">YOUR CHAPTER, TOGETHER</span><h2><i class="va-live-dot"></i> Online now <b>${members.length}</b></h2><p>Members active in a visible Valus tab within 90 seconds. Updates every 30 seconds.</p></div></div><div class="va-online-grid">${members.map((m) => `<div class="va-online-person"><span class="va-person"><i class="is-online">${esc(m.name.slice(0, 1))}</i><span><strong>${esc(m.name)}</strong><small>${m.role === 'instructor' ? 'Teacher' : 'Student'}</small></span></span>${badge('Online')}</div>`).join('')}</div>${!members.length ? '<div class="va-empty"><h3>A quiet moment.</h3><p>Your chapter members will appear here when they are active.</p></div>' : ''}</section>`;
  }
  async function mutate(action) {
    const w = selected();
    if (!w || busy) return;
    busy = true;
    error = '';
    notice = '';
    try {
      await api(
        action === 'delete' ? 'DELETE' : 'PATCH',
        '/attendance/' + encodeURIComponent(w.id),
        action === 'delete' ? undefined : { action },
      );
      await refresh();
      notice =
        action === 'delete'
          ? 'Event deleted from the schedule and attendance reports.'
          : action === 'cancel'
            ? 'Event cancelled. It will not affect attendance rates.'
            : 'New code generated. Share it with students at the event.';
      paint();
    } catch (e) {
      error = e.message;
      paint();
    } finally {
      busy = false;
    }
  }
  function confirmAction(action) {
    const w = selected();
    if (!w) return;
    const deleting = action === 'delete';
    const dialog = openDialog(
      deleting ? 'Delete this event?' : 'Cancel this event?',
      `<p><strong>${esc(w.title)}</strong></p><p>${deleting ? 'This permanently removes the event and all its attendance records from schedules, analytics, and exports for everyone in your chapter.' : 'Check-in will close. The event stays on the calendar and is excluded from attendance rates.'}</p><div class="va-dialog-actions">${btn('Keep event', 'keep', true)}${btn(deleting ? 'Yes, delete event' : 'Yes, cancel event', 'confirm')}</div>`,
    );
    dialog.querySelector('[data-att-action="keep"]').onclick = () => dialog.close();
    dialog.querySelector('[data-att-action="confirm"]').onclick = async (e) => {
      e.currentTarget.disabled = true;
      dialog.close();
      await mutate(action);
    };
  }
  function exportCsv() {
    const rows = [['Student', 'Event', 'Date', 'Status', 'Checked in at']];
    for (const w of data.events)
      for (const m of data.members.filter((m) => m.role === 'student')) {
        if (!w.audienceIds?.includes(m.id)) continue;
        const r = data.records.find((r) => r.eventId === w.id && r.studentId === m.id);
        rows.push([
          m.name,
          w.title,
          fmtDate(w),
          w.cancelled
            ? 'Cancelled'
            : r
              ? 'Present'
              : eventStatus(w, now()) === 'Closed'
                ? 'Absent'
                : 'Pending',
          r?.checkedInAt ?? '',
        ]);
      }
    const safe = (v) =>
      '"' +
      String(v)
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows.map((r) => r.map(safe).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8;',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'valus-event-attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  function createForm() {
    let location = null;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dialog = openDialog(
      'A day to show up.',
      `<form data-att-create><p>Every event gets its own code, time window, and location.</p><label class="field">Event name<input name="title" maxlength="100" placeholder="e.g. Chapter skills practice" required></label><div class="va-form-pair"><label class="field">Check-in opens<input type="datetime-local" name="opensAt" value="${localDate(new Date(Date.now() + 3600000))}" required></label><label class="field">Check-in closes<input type="datetime-local" name="closesAt" value="${localDate(new Date(Date.now() + 7200000))}" required></label></div><p class="va-help">Times use ${esc(zone)}. Check-in windows can last up to 24 hours.</p><div class="field">Event location<button type="button" class="va-location-picker">${svg('pin')}<span><strong>Choose a location</strong><small>Search an address or place a pin on the map</small></span>${svg('arrow')}</button></div><div class="va-callout">${svg('shield')}<p>Students need the code and a precise browser location within <strong>0.5 mile</strong> of your pin during the check-in window.</p></div><p class="va-help">The current chapter roster is saved for this event. Cancelled events do not affect attendance rates.</p><p class="va-form-error" role="alert" hidden></p><div class="va-dialog-actions"><button type="button" class="button secondary" data-att-dismiss>Cancel</button><button class="button" type="submit">${svg('plus')}Create event</button></div></form>`,
    );
    dialog.querySelector('[data-att-dismiss]').onclick = () => dialog.close();
    const picker = dialog.querySelector('.va-location-picker');
    picker.onclick = () =>
      mapDialog(location, (value) => {
        location = value;
        picker.querySelector('strong').textContent = value.name;
        picker.querySelector('small').textContent =
          `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`;
      });
    dialog.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.currentTarget,
        errorEl = form.querySelector('.va-form-error'),
        submit = form.querySelector('[type="submit"]');
      errorEl.hidden = true;
      if (!location) {
        errorEl.textContent = 'Choose an event location first.';
        errorEl.hidden = false;
        return;
      }
      submit.disabled = true;
      try {
        const values = new FormData(form);
        const result = await api('POST', '/attendance', {
          title: values.get('title'),
          opensAt: new Date(values.get('opensAt')).toISOString(),
          closesAt: new Date(values.get('closesAt')).toISOString(),
          timezone: zone,
          locationName: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        selectedId = result.id;
        dialog.close();
        await refresh();
        notice = 'Event created. Your attendance code is ready to share.';
        paint();
      } catch (e) {
        errorEl.textContent = e.message;
        errorEl.hidden = false;
        submit.disabled = false;
      }
    };
  }
  async function mapDialog(initial, onSelect) {
    let location = initial,
      map,
      ring,
      marker;
    const dialog = openDialog(
      'Put your event on the map.',
      `<form class="va-address-search"><label>${svg('search')}<input name="q" aria-label="Search event address" placeholder="Search a school, building, or address" minlength="3" maxlength="200" required></label><button class="button" type="submit">Search</button></form><p class="va-form-error" role="alert" hidden></p><ul class="va-map-results"></ul><div class="va-map" aria-label="Select a point on the event map"></div><div class="va-map-caption"><span>Click to place a pin. The circle shows the 0.5-mile check-in area.</span><button type="button" class="text-button" data-att-locate>${svg('pin')}Use my location</button></div><label class="field">Location name<input data-att-location-name maxlength="500" ${initial ? '' : 'disabled'} value="${esc(initial?.name ?? '')}" placeholder="Choose a point on the map"></label><div class="va-dialog-actions"><small>Address search powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a></small><button type="button" class="button" data-att-use-location ${initial ? '' : 'disabled'}>Use this location${svg('pin')}</button></div>`,
    );
    const errorEl = dialog.querySelector('.va-form-error');
    const showError = (e) => {
      errorEl.textContent = e.message;
      errorEl.hidden = false;
    };
    const choose = (value) => {
      location = value;
      const input = dialog.querySelector('[data-att-location-name]');
      input.value = value.name;
      input.disabled = false;
      dialog.querySelector('[data-att-use-location]').disabled = false;
      dialog.querySelector('.va-map-results').innerHTML = '';
      if (map) {
        const point = [value.latitude, value.longitude];
        ring.setLatLng(point).setStyle({ opacity: 1, fillOpacity: 0.13 });
        marker.setLatLng(point).setStyle({ opacity: 1, fillOpacity: 1 });
        map.setView(point, Math.max(map.getZoom(), 14));
      }
    };
    dialog.cleanup = () => map?.remove();
    try {
      const L = await loadMap();
      if (!dialog.isConnected) return;
      const center = initial ? [initial.latitude, initial.longitude] : [39.5, -98.35];
      const accent = getComputedStyle(dialog).getPropertyValue('--red').trim() || '#c51e3e';
      map = L.map(dialog.querySelector('.va-map')).setView(center, initial ? 14 : 4);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      ring = L.circle(center, {
        radius: ATTENDANCE_RADIUS_METERS,
        color: accent,
        opacity: initial ? 1 : 0,
        fillOpacity: initial ? 0.13 : 0,
        weight: 2,
      }).addTo(map);
      marker = L.circleMarker(center, {
        radius: 7,
        color: '#fff',
        fillColor: accent,
        fillOpacity: initial ? 1 : 0,
        opacity: initial ? 1 : 0,
        weight: 3,
      }).addTo(map);
      map.on('click', (e) =>
        choose({
          name: `Event location (${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)})`,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }),
      );
      map.invalidateSize();
    } catch (e) {
      showError(e);
    }
    dialog.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      const button = e.currentTarget.querySelector('button');
      button.disabled = true;
      try {
        const result = await api(
          'GET',
          '/attendance/locations?q=' + encodeURIComponent(new FormData(e.currentTarget).get('q')),
        );
        if (!dialog.isConnected) return;
        const list = dialog.querySelector('.va-map-results');
        list.innerHTML = result.results
          .map(
            (r, i) =>
              `<li><button type="button" data-result="${i}">${svg('pin')}${esc(r.name)}</button></li>`,
          )
          .join('');
        list.onclick = (e) => {
          const b = e.target.closest('[data-result]');
          if (b) choose(result.results[Number(b.dataset.result)]);
        };
        if (!result.results.length)
          showError(new Error('No addresses found. Try the full school address.'));
      } catch (e) {
        showError(e);
      } finally {
        button.disabled = false;
      }
    };
    dialog.querySelector('[data-att-locate]').onclick = async (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      try {
        const p = await locate();
        if (dialog.isConnected)
          choose({
            name: 'Event at my current location',
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
          });
      } catch (e) {
        showError(e);
      } finally {
        b.disabled = false;
      }
    };
    dialog.querySelector('[data-att-use-location]').onclick = () => {
      if (!location) return;
      const name = dialog.querySelector('[data-att-location-name]').value.trim();
      if (!name) {
        showError(new Error('Enter a location name.'));
        return;
      }
      onSelect({ ...location, name });
      dialog.close();
    };
  }
  async function click(e) {
    const button = e.target.closest('[data-att-action]');
    if (!button || button.disabled || busy) return;
    const action = button.dataset.attAction;
    if (action === 'select') {
      selectedId = button.dataset.id;
      checkinCode = '';
      error = '';
      notice = '';
      paint();
    }
    if (action === 'view') {
      view = button.dataset.view;
      query = '';
      paint();
    }
    if (action === 'refresh') await refresh();
    if (action === 'create' && teacher) createForm();
    if ((action === 'delete' || action === 'cancel') && teacher) confirmAction(action);
    if (action === 'rotate' && teacher) await mutate('rotate');
    if (action === 'export' && teacher) exportCsv();
    if (action === 'copy' && teacher) {
      try {
        await navigator.clipboard.writeText(selected()?.code ?? '');
        notice = 'Code copied. Share it with students at the event.';
      } catch {
        error = 'Could not copy. Select the code and copy it manually.';
      }
      paint();
    }
  }
  async function submit(e) {
    if (!e.target.matches('[data-att-checkin]')) return;
    e.preventDefault();
    if (busy) return;
    const w = selected(),
      code = new FormData(e.target).get('code');
    if (!w) return;
    checkinCode = String(code);
    busy = true;
    error = '';
    notice = '';
    paint();
    try {
      const p = await locate();
      if (stopped) return;
      const result = await api('POST', '/attendance/check-in', {
        eventId: w.id,
        code: String(code).trim().toUpperCase(),
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        timestamp: p.timestamp,
      });
      await refresh();
      notice = result.alreadyRecorded
        ? 'Your attendance was already recorded.'
        : 'You’re checked in. Your attendance has been recorded.';
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
      paint();
    }
  }
  const input = (e) => {
    if (e.target.matches('[data-att-search]')) {
      query = e.target.value;
      paint();
    }
  };
  const change = (e) => {
    if (e.target.matches('[data-att-filter]')) filter = e.target.value;
    else if (e.target.matches('[data-att-report]')) selectedId = e.target.value;
    else return;
    paint();
  };
  root.addEventListener('click', click);
  root.addEventListener('submit', submit);
  root.addEventListener('input', input);
  root.addEventListener('change', change);
  const timer = setInterval(() => {
    if (!document.hidden && !busy && !dialogs.size && !root.contains(document.activeElement))
      void refresh(true);
  }, 30000);
  const visibility = () => {
    if (!document.hidden && !busy && !dialogs.size) void refresh(true);
  };
  document.addEventListener('visibilitychange', visibility);
  void refresh();
  return () => {
    stopped = true;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', visibility);
    root.removeEventListener('click', click);
    root.removeEventListener('submit', submit);
    root.removeEventListener('input', input);
    root.removeEventListener('change', change);
    for (const dialog of dialogs) dialog.close();
  };
}
