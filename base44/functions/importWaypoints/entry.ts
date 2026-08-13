import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import * as XLSX from 'npm:xlsx@0.18.5';

const SHEET = 'FRA Points';

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

    if (!wb.SheetNames.includes(SHEET)) {
      return Response.json(
        { error: `Tabellenblatt "${SHEET}" nicht gefunden. Vorhanden: ${wb.SheetNames.join(', ')}` },
        { status: 400 }
      );
    }
    const ws = wb.Sheets[SHEET];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    const pick = (r, keys) => {
      for (const k of keys) {
        if (r[k] != null && r[k] !== '') return r[k];
      }
      return null;
    };

    const waypoints = [];
    for (const r of rows) {
      const ident = pick(r, ['FRA Point', 'IDENT', 'FRA Point.1', 'Ident']);
      const lat = pick(r, ['FRA Point Latitude', 'Latitude', 'LAT', 'Lat']);
      const lng = pick(r, ['FRA Point Longitude', 'Longitude', 'LNG', 'Lng']);
      if (ident == null || lat == null || lng == null) continue;
      const latNum = parseFloat(String(lat));
      const lngNum = parseFloat(String(lng));
      if (isNaN(latNum) || isNaN(lngNum)) continue;
      const identStr = String(ident).trim();
      if (!identStr) continue;
      waypoints.push({
        ident: identStr,
        latitude: latNum,
        longitude: lngNum,
        country_code: 'DE',
      });
    }

    if (waypoints.length === 0) {
      return Response.json({ error: 'Keine gültigen Wegpunkte in der Datei gefunden.' }, { status: 400 });
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