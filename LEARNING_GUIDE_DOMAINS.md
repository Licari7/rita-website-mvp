# How to Connect a Custom Domain (.pt) to Vercel

This guide explains how to buy a `.pt` domain and connect it to your current Vercel website.

## Step 1: Buy the Domain
1.  Go to a domain registrar like **Amen.pt**, **PTisp.pt**, or **Dominios.pt**.
2.  Search for `floresceterapias.pt`.
3.  Add it to your cart and complete the purchase (usually around €10-€15 for one year).
    *   *Note: You do not need "Hosting" or "Email", just the "Domain Name".*

## Step 2: Add Domain to Vercel
1.  Log in to your **Vercel Dashboard**.
2.  Select your project (`rita-website-mvp`).
3.  Go to **Settings** > **Domains**.
4.  Enter `floresceterapias.pt` in the input box and click **Add**.
5.  Vercel will show you a screen with "Invalid Configuration" and give you two important values:
    *   **Type:** `A Record`
    *   **Value:** `76.76.21.21` (This is Vercel's server IP).
    *   *(It might also ask for a CNAME for www, e.g., `cname.vercel-dns.com`)*.

## Step 3: Configure DNS (At the place you bought the domain)
1.  Log back into the site where you bought the domain (e.g., Amen.pt).
2.  Find the **DNS Management** or **DNS Zone** section for your domain.
3.  **Add a new Record:**
    *   **Type:** `A`
    *   **Name/Host:** `@` (or leave empty)
    *   **Value/Target:** `76.76.21.21` (The IP from Vercel)
4.  **Add another Record (for "www"):**
    *   **Type:** `CNAME`
    *   **Name/Host:** `www`
    *   **Value/Target:** `cname.vercel-dns.com`

## Step 4: Wait
DNS changes can take anywhere from a few minutes to 24 hours to propagate across the internet. Once Vercel sees the change, it will automatically issue a free SSL certificate (the secure lock icon), and your site will be live at `floresceterapias.pt`!
