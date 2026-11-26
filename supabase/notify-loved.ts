    if (a.kind === "loved") {
      // "someone loved your recommendation": only to the person who added the place.
      // At most one push per ~day per person per group, none 22:00-08:00, opt-out per group (meta.noLoved).
      const skip = (why: string) => Response.json({ sent: 0, skip: why });
      if (!a.restaurant_id) return skip("no place");
      const { data: r } = await sb.from("restaurants").select("list_id,data").eq("id", a.restaurant_id).maybeSingle();
      const d = (r && r.data) || {};
      const rec = d.addedBy;
      if (!r || r.list_id !== a.list_id || !rec || rec === a.user_id || !mem.includes(rec) || !mem.includes(a.user_id)) return skip("not eligible");
      const stars = Number((d.ratings || {})[a.user_id]) || 0, wants = !!(d.votes || {})[a.user_id];
      if (stars < 4 && !wants) return skip("no like");
      const { data: ms } = await sb.from("restaurants").select("id,data").eq("list_id", a.list_id).eq("data->>_meta", "true");
      const mrow = (ms || []).sort((x, y) => ((x.data && x.data.createdAt) || 0) - ((y.data && y.data.createdAt) || 0))[0];
      const md = (mrow && mrow.data) || {};
      if (md.noLoved && md.noLoved[rec]) return skip("opted out");
      const ilH = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
      if (ilH >= 22 || ilH < 8) return skip("quiet hours");
      const last = Number((md.lovedAt || {})[rec]) || 0;
      if (Date.now() - last < 20 * 3600e3) return skip("daily cap");
      const body2 = stars >= 4 ? `${who} אהב/ה את ההמלצה שלך: ${d.name} ${"★".repeat(Math.min(stars, 5))}` : `${who} רוצה ללכת ל${d.name} בזכות ההמלצה שלך`;
      const n = await sendTo([rec], { title: "Fomo · ❤️", body: body2, url: APP + "?open=" + a.restaurant_id, tag: "loved-" + rec.slice(0, 8) + "-" + ilDate(0) });
      if (n && mrow) {
        const { data: fresh } = await sb.from("restaurants").select("data").eq("id", mrow.id).maybeSingle();
        const fd = (fresh && fresh.data) || md;
        await sb.from("restaurants").update({ data: { ...fd, lovedAt: { ...(fd.lovedAt || {}), [rec]: Date.now() } } }).eq("id", mrow.id);
      }
      return Response.json({ sent: n });
    }
