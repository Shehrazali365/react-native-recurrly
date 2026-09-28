import activity from "@/assets/icons/activity.png";
import add from "@/assets/icons/add.png";
import adobe from "@/assets/icons/adobe.png";
import back from "@/assets/icons/back.png";
import canva from "@/assets/icons/canva.png";
import claude from "@/assets/icons/claude.png";
import dropbox from "@/assets/icons/dropbox.png";
import figma from "@/assets/icons/figma.png";
import github from "@/assets/icons/github.png";
import home from "@/assets/icons/home.png";
import medium from "@/assets/icons/medium.png";
import menu from "@/assets/icons/menu.png";
import notion from "@/assets/icons/notion.png";
import openai from "@/assets/icons/openai.png";
import plus from "@/assets/icons/plus.png";
import setting from "@/assets/icons/setting.png";
import spotify from "@/assets/icons/spotify.png";
import wallet from "@/assets/icons/wallet.png";
import type { ImageSourcePropType } from "react-native";

export const icons = {
  home,
  wallet,
  setting,
  activity,
  add,
  back,
  menu,
  plus,
  notion,
  dropbox,
  openai,
  adobe,
  medium,
  figma,
  spotify,
  github,
  claude,
  canva,
} as const;

const localSubscriptionIcons: Record<string, ImageSourcePropType> = {
  spotify: icons.spotify,
  figma: icons.figma,
  notion: icons.notion,
  github: icons.github,
  canva: icons.canva,
  claude: icons.claude,
  adobe: icons.adobe,
  dropbox: icons.dropbox,
  openai: icons.openai,
  medium: icons.medium,
};

const subscriptionLogoDomains: Record<string, string> = {
  spotify: "spotify.com",
  figma: "figma.com",
  notion: "notion.so",
  github: "github.com",
  canva: "canva.com",
  claude: "claude.ai",
  adobe: "adobe.com",
  dropbox: "dropbox.com",
  openai: "openai.com",
  medium: "medium.com",
};

export const resolveSubscriptionIcon = (
  name: string,
): ImageSourcePropType | { uri: string } => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!normalized) return icons.wallet;

  const localMatch = Object.entries(localSubscriptionIcons).find(([key]) => {
    return normalized.includes(key) || key.includes(normalized);
  });

  if (localMatch) return localMatch[1];

  const domainMatch = Object.entries(subscriptionLogoDomains).find(([key]) => {
    return normalized.includes(key) || key.includes(normalized);
  });

  if (domainMatch) {
    const domain = domainMatch[1];
    return {
      uri: `https://www.google.com/s2/favicons?sz=256&domain=${domain}`,
    };
  }

  return icons.wallet;
};

export type IconKey = keyof typeof icons;
