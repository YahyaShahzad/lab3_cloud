// Netlify Function: reads live stock data from Odoo and returns clean JSON.
// Credentials come from Netlify environment variables (never put them in index.html).
exports.handler = async () => {
  const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY } = process.env;
  const SKUS = ["WM-001", "KB-002"];

  const rpc = async (service, method, args) => {
    const res = await fetch(`${ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: 1 })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.data?.message || "Odoo error");
    return json.result;
  };
  const call = (uid, model, method, args, kwargs = {}) =>
    rpc("object", "execute_kw", [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]);

  try {
    const uid = await rpc("common", "authenticate", [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}]);
    if (!uid) throw new Error("Odoo authentication failed");

    const prods = await call(uid, "product.product", "search_read",
      [[["default_code", "in", SKUS]]], { fields: ["name", "default_code", "qty_available"] });

    const moves = await call(uid, "stock.move", "search_read",
      [[["state", "=", "done"], ["product_id", "in", prods.map(p => p.id)], ["picking_code", "in", ["incoming", "outgoing"]]]],
      { fields: ["product_id", "quantity", "picking_id", "picking_code"], order: "id asc" });

    const pickIds = [...new Set(moves.map(m => m.picking_id && m.picking_id[0]).filter(Boolean))];
    const picks = pickIds.length ? await call(uid, "stock.picking", "read", [pickIds], { fields: ["partner_id"] }) : [];
    const partner = {};
    picks.forEach(p => { partner[p.id] = p.partner_id ? p.partner_id[1] : ""; });

    const rows = moves.map(m => ({
      sku: (prods.find(p => p.id === m.product_id[0]) || {}).default_code,
      product: m.product_id[1].replace(/^\[.*?\]\s*/, ""),
      type: m.picking_code === "incoming" ? "Receipt" : "Delivery",
      partner: m.picking_id ? partner[m.picking_id[0]] : "",
      qty: m.quantity
    }));

    const products = prods.map(p => ({
      sku: p.default_code,
      name: p.name,
      onHand: p.qty_available,
      received: rows.filter(r => r.sku === p.default_code && r.type === "Receipt").reduce((a, r) => a + r.qty, 0),
      delivered: rows.filter(r => r.sku === p.default_code && r.type === "Delivery").reduce((a, r) => a + r.qty, 0)
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ products, moves: rows })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
