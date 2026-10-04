exports.handler = async () => {
  const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY } = process.env;

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

  try {
    const uid = await rpc("common", "authenticate", [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}]);
    const products = await rpc("object", "execute_kw", [
      ODOO_DB, uid, ODOO_API_KEY, "product.product", "search_read",
      [[["default_code", "in", ["WM-001", "KB-002"]]]],
      { fields: ["name", "default_code", "qty_available"] }
    ]);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(products) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
