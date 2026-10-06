import { logout } from "@/app/admin/actions";

export default function AdminHeader() {
  return (
    <header className="admin-hdr">
      <div className="wrap">
        <a className="brand" href="/admin">Cost Seg <span>Trust</span></a>
        <nav>
          <a href="/admin">Deals</a>
          <a href="/admin/clients">Clients</a>
          <a href="/admin/suppliers">Suppliers</a>
          <a href="/admin/messages">Messages</a>
          <a href="/admin/settings">Settings</a>
          <a href="/" target="_blank" rel="noreferrer">View website</a>
        </nav>
        <div className="spacer" />
        <form className="admin-search" action="/admin/clients" method="get" role="search">
          <input type="search" name="q" placeholder="Search clients…" aria-label="Search clients" />
        </form>
        <form action={logout}><button className="link" type="submit">Sign out</button></form>
      </div>
    </header>
  );
}
