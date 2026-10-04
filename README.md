# TechMart Inventory Dashboard

A small cloud-computing project that connects a **SaaS** inventory system (Odoo) with a **PaaS** hosting platform (Netlify) through a **GitHub** deployment pipeline.

**🔗 Live site: [https://yahya-techmart-inventory.netlify.app/](https://yahya-techmart-inventory.netlify.app/)**

---

## Overview

Inventory is managed in **Odoo Cloud (SaaS)**: products, vendor receipts and customer deliveries. A static web dashboard, hosted on **Netlify (PaaS)** and deployed automatically from this **GitHub** repository, displays the resulting stock levels. A Netlify serverless function can read the numbers live from Odoo, and the page falls back to static values if the function is unavailable.

```
Odoo (SaaS)  ──►  Netlify Function  ──►  Dashboard (index.html)
                        ▲                        ▲
                   env variables            GitHub → Netlify
                   (API key)                auto-deploy
```

## Features

- Responsive, modern dashboard with automatic dark mode
- Summary stats: total received, total delivered, units on hand, active products
- Product cards with SKU, tracking type, unit of measure and a stock bar
- Stock movements table (receipts and deliveries, all in Done status)
- Optional live data from Odoo via a serverless function, with a static fallback
- Continuous deployment: every push to `main` redeploys the site

## Tech Stack

| Layer | Technology |
|---|---|
| SaaS | Odoo Cloud (Inventory, Sales) |
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Netlify Functions (Node.js) |
| Hosting (PaaS) | Netlify |
| Source control / CI | GitHub |

## Project Structure

```
.
├── index.html                    # Dashboard (static page + live-data script)
├── netlify/
│   └── functions/
│       └── stock.js              # Serverless function that reads stock from Odoo
└── README.md
```

## Part 1: Odoo Configuration (SaaS)

1. **Account setup:** registered on odoo.com and activated a database with the Inventory and Sales apps.
2. **Products** (stockable goods, unit of measure: Units):

   | Product | SKU | Tracking | Price |
   |---|---|---|---|
   | Wireless Mouse | WM-001 | By Lots | Rs. 1,500 |
   | USB Keyboard | KB-002 | By Quantity | Rs. 2,500 |

3. **Receipt** from vendor *ABC Suppliers*: +50 Wireless Mouse (lot `LOT-MS-001`), +30 USB Keyboard. Validated, so stock increased.
4. **Delivery** to customer *Ali Traders*: −10 Wireless Mouse, −5 USB Keyboard. Validated, so stock decreased.
5. **Final stock:** Wireless Mouse **40**, USB Keyboard **25**.

## Part 2: Deployment (PaaS)

1. Pushed this project to GitHub (`main` branch).
2. Connected Netlify to GitHub and imported the repository.
3. Build settings (plain static site):

   | Setting | Value |
   |---|---|
   | Build command | *(empty)* |
   | Publish directory | `.` |
   | Functions directory | `netlify/functions` (default) |
   | Branch | `main` |

4. Renamed the site to `yahya-techmart-inventory`, giving the URL above.

## Enabling Live Odoo Data (optional)

Add these in **Netlify → Site configuration → Environment variables**, then trigger a new deploy:

| Variable | Description |
|---|---|
| `ODOO_URL` | Your Odoo address, e.g. `https://your-db.odoo.com` |
| `ODOO_DB` | Database name (the part before `.odoo.com`) |
| `ODOO_USER` | Odoo login email |
| `ODOO_API_KEY` | API key from Odoo → Preferences → Account Security |

Verify the function at `/.netlify/functions/stock`. When the data loads, the badge on the page reads **"Live from Odoo"**; otherwise it shows the static snapshot.

> **Security:** never commit credentials to the repository. They live only in Netlify environment variables.

## Run Locally

```bash
# Static preview
npx serve .

# With serverless function support
npm install -g netlify-cli
netlify dev
```



## Author

**Yahya Shahzad**: Cloud Computing Lab (SaaS & PaaS)

## License

This project is for educational purposes.
