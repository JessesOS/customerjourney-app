/**
 * Server-rendered markup of the portal and its welcome screens, for one client
 * type: every look × completion set × day, rendered with React's own server
 * renderer (no JSX here, so plain tsx runs it). The frozen fixtures keep a
 * hash of each, so any change a client could see in the first paint fails.
 *
 * Component props come from ./ssr-props.ts, the only file that follows the
 * component API.
 */
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientPortalExperience } from "../../app/components/portal/ClientPortalExperience";
import { WelcomeAurora } from "../../app/components/portal/WelcomeAurora";
import { WelcomeFunnel } from "../../app/components/portal/WelcomeFunnel";
import { WelcomeMarquee } from "../../app/components/portal/WelcomeMarquee";
import { WelcomeScreen } from "../../app/components/portal/WelcomeScreen";
import { SSR_DAYS, SSR_THEMES, ssrSets } from "./contract";
import { portalProps, welcomeProps } from "./ssr-props";

type AnyComponent = ComponentType<Record<string, unknown>>;
const render = (component: unknown, props: Record<string, unknown>) => renderToStaticMarkup(createElement(component as AnyComponent, props));
const noop = () => {};

/** "<theme>|<set>|day<d>" → the portal's server-rendered markup. */
export function portalMarkup(clientType: string, visibleIds: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const extra = portalProps(clientType);
  for (const theme of SSR_THEMES) {
    for (const [set, ids] of Object.entries(ssrSets(visibleIds))) {
      for (const d of SSR_DAYS) {
        out[`${theme}|${set}|day${d}`] = render(ClientPortalExperience, {
          name: "Probe",
          currentDay: d,
          calendarDay: d,
          initialCompletedMilestoneIds: ids,
          themeVariant: theme,
          portalToken: "probe-token",
          ...extra,
        });
      }
    }
  }
  return out;
}

/** Welcome screen name → its server-rendered markup. */
export function welcomeMarkup(clientType: string): Record<string, string> {
  const w = welcomeProps(clientType);
  return {
    funnel: render(WelcomeFunnel, { ...w.brandProps, onStart: noop }),
    "funnel-grove": render(WelcomeFunnel, { ...w.brandProps, color: "#0f6b4b", onStart: noop }),
    aurora: render(WelcomeAurora, { ...w.brandProps, tagline: w.tagline, stages: w.stages, onStartGesture: w.introVideo ? noop : undefined, onStart: noop }),
    marquee: render(WelcomeMarquee, { ...w.brandProps, onStart: noop }),
    mosaic: render(WelcomeScreen, { name: "Probe", ...w.brandProps, onStart: noop }),
  };
}
