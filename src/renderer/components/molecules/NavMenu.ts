import { createNavLink, NavLinkOptions, NavCallback } from "../atoms/NavLink";

export function createNavMenu(items: NavLinkOptions[], onNavigate?: NavCallback): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "nav-menu";

  items.forEach((item) => {
    nav.appendChild(createNavLink(item, onNavigate));
  });

  return nav;
}
