import { secrets } from "base44:runtime";

export default async function(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }
    const password = body?.password;
    const adminPassword = secrets.get("ADMIN_PASSWORD");
    if (!password || !adminPassword || password !== adminPassword) {
      return Response.json({ authorized: false }, { status: 403 });
    }
    return Response.json({ authorized: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}