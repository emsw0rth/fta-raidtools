export interface NavLinkOptions {
  label: string;
  href: string;
  active?: boolean;
}

export type NavCallback = (href: string) => void;

export function createNavLink({ label, href, active = false }: NavLinkOptions, onNavigate?: NavCallback): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.className = "nav-link" + (active ? " nav-link--active" : "");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-link").forEach((el) => el.classList.remove("nav-link--active"));
    link.classList.add("nav-link--active");
    onNavigate?.(href);
  });
  return link;
}
