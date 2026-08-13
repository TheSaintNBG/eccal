import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import * as XLSX from 'npm:xlsx@0.18.5';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admins dürfen importieren' }, { status: 403 });

    const body = await req.json();
    const fileUrl = body?.file_url;
    if (!fileUrl) return Response.json({ error: 'file_url fehlt' }, { status: 400 });

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('Datei konnte nicht geladen werden');
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });

    const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
    const sheetName =
      wb.SheetNames.find((n) => norm(n) === 'fra points') ||
      wb.SheetNames.find((n) => norm(n).includes('fra points')) ||
      wb.SheetNames.find((n) => norm(n).includes('fra'));
    if (!sheetName) {
      return Response.json(
        { error: `Tabellenblatt "FRA Points" nicht gefunden. Vorhanden: ${wb.SheetNames.join(', ')}` },
        { status: 400 }
      );
    }
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    const pick = (rowMap, keys) => {
      for (const k of keys) {
        if (rowMap[k] != null && rowMap[k] !== '') return rowMap[k];
      }
      return null;
    };

    // DMS-Format parsen, z.B. "N404519" -> 40.755278, "E0183830" -> 18.641667
    const parseDms = (raw) => {
      if (raw == null) return null;
      const s = String(raw).trim().toUpperCase();
      const m = s.match(/^([NSEW])\s*(\d{1,3})(\d{2})(\d{2})(?:\.\d+)?$/);
      if (!m) return null;
      const deg = parseInt(m[2], 10);
      const min = parseInt(m[3], 10);
      const sec = parseInt(m[4], 10);
      let dec = deg + min / 60 + sec / 3600;
      if (m[1] === 'S' || m[1] === 'W') dec = -dec;
      return dec;
    };

    const toNum = (raw) => {
      if (raw == null) return null;
      const dms = parseDms(raw);
      if (dms != null) return dms;
      const n = parseFloat(String(raw).replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const waypoints = [];
    let headerKeys = [];
    let sampleRow = null;
    for (const r of rows) {
      const keys = Object.keys(r);
      if (headerKeys.length === 0) headerKeys = keys;
      if (!sampleRow) sampleRow = r;
      const rowMap = {};
      for (const k of keys) rowMap[norm(k)] = r[k];
      const ident = pick(rowMap, ['fra point', 'ident', 'fra point.1']);
      const latRaw = pick(rowMap, ['fra point latitude', 'latitude', 'lat']);
      const lngRaw = pick(rowMap, ['fra point longitude', 'longitude', 'lng']);
      if (ident == null || latRaw == null || lngRaw == null) continue;
      const latNum = toNum(latRaw);
      const lngNum = toNum(lngRaw);
      if (latNum == null || lngNum == null) continue;
      const identStr = String(ident).trim();
      if (!identStr) continue;
      waypoints.push({
        ident: identStr,
        latitude: latNum,
        longitude: lngNum,
        lat_dms: String(latRaw),
        lng_dms: String(lngRaw),
        country_code: 'DE',
      });
    }

    if (waypoints.length === 0) {
      return Response.json(
        {
          error: 'Keine gültigen Wegpunkte in der Datei gefunden.',
          matchedSheet: sheetName,
          sheetNames: wb.SheetNames,
          rowCount: rows.length,
          headerKeys,
          sampleRow,
        },
        { status: 400 }
      );
    }

    // Alle bestehenden Wegpunkte ersetzen
    await base44.asServiceRole.entities.Waypoint.deleteMany({});

    let created = 0;
    for (let i = 0; i < waypoints.length; i += 500) {
      const batch = waypoints.slice(i, i + 500);
      await base44.asServiceRole.entities.Waypoint.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ imported: created, total: waypoints.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}