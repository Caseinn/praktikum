import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared";
import { FaGithub, FaInstagram } from "react-icons/fa";

export const linkItems: LinkItemType[] = [
  {
    type: "icon",
    url: "https://instagram.com/ditorifkii",
    label: "instagram",
    text: "Instagram",
    icon: <FaInstagram className="h-4 w-4" />,
    external: true,
  },
  {
    type: "icon",
    url: "https://github.com/Caseinn",
    label: "github",
    text: "Github",
    icon: <FaGithub className="h-4 w-4" />,
    external: true,
  },
];

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          Praktikum
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: linkItems,
  };
}
