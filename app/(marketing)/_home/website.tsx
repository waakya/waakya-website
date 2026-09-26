"use client";

import * as React from "react";

import { Character } from "./characters";
import { StoryControl, useSequence } from "./v35-seq";

/**
 * Keep your website; connect the business behind it. Drawn as one connected
 * system: the customer's browser on their site, the workspace, and the page
 * the customer gets afterwards — joined by real connections that an enquiry
 * travels along. Three artifacts, complete from the first frame; the story
 * is the enquiry moving through them.
 */
const STEPS = ["She asks for a quote on your website", "A customer record appears, with Neha on it", "She gets her own page, with her name on it"];

export function WebsiteSystem() {
  const { ref, step, playing, setPlaying, replay, done } = useSequence(STEPS.length, 1900);
  const sent = step >= 0;
  const landed = step >= 1;
  const back = step >= 2;

  return (
    <div ref={ref} className="w4-web" data-step={step}>
      <div className="w4-web-system">
        {/* ------------------------------------------------ their website */}
        <div className="w4-web-node w4-web-site">
          <p className="w4-web-label">
            <span className="w4-kicker">Stays exactly as it is</span>
            <b className="num">abcinteriors.com</b>
          </p>
          <div className="w4-browser">
            <div className="w4-browser-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span className="num">abcinteriors.com/estimate</span>
            </div>
            <div className="w4-browser-body">
              <p className="w4-browser-brand">ABC Interiors</p>
              <p className="w4-browser-h">Get an estimate for your office</p>
              <div className="w4-browser-form" aria-hidden="true">
                <span className="num">2,400 sq ft</span>
                <span>Office · Baner</span>
                <span className="num">Meera Joshi · 98xxx xx210</span>
              </div>
              <span className="w4-browser-btn" data-on={sent && !landed} aria-hidden="true">
                {landed ? "Sent ✓" : "Get my estimate"}
              </span>
            </div>
          </div>
        </div>

        <div className="w4-web-link" data-on={landed} aria-hidden="true">
          <i className="w4-web-wire" />
          <i className="w4-web-dot" />
          <span>enquiry</span>
        </div>

        {/* ------------------------------------------------------ Waakya */}
        <div className="w4-web-node w4-web-core">
          <p className="w4-web-label">
            <span className="w4-kicker">Now connected to</span>
            <b>Waakya</b>
          </p>
          <div className="w4-core">
            <p className="w4-core-nav" aria-hidden="true">
              {["Today", "Customers", "Projects", "Work"].map((n) => (
                <span key={n} data-on={n === "Customers"}>
                  {n}
                </span>
              ))}
            </p>
            <div className="w4-core-row" data-on={landed}>
              <span className="w4-core-avatar" aria-hidden="true">
                <Character name="desk" action="idle" className="w-8" />
              </span>
              <span className="min-w-0 flex-1">
                <b>Meera Joshi</b>
                <span className="num w4-row-meta">New enquiry · 2,400 sq ft office · from your website</span>
              </span>
              <span className="w32-status" data-tone="go">
                Neha · by 11:00
              </span>
            </div>
            <div className="w4-core-row w4-core-row-quiet">
              <span className="min-w-0 flex-1">
                <b>Sterling Group</b>
                <span className="w4-row-meta">Kharadi office · 74% · lighting Friday</span>
              </span>
              <span className="w32-status" data-tone="done">
                On track
              </span>
            </div>
            <div className="w4-core-row w4-core-row-quiet">
              <span className="min-w-0 flex-1">
                <b>Pashan clinic</b>
                <span className="w4-row-meta">Quotation Q-1184 · follow-up Thursday</span>
              </span>
              <span className="w32-status" data-tone="wait">
                Waiting
              </span>
            </div>
          </div>
        </div>

        <div className="w4-web-link" data-on={back} aria-hidden="true">
          <i className="w4-web-wire" />
          <i className="w4-web-dot" />
          <span>her page</span>
        </div>

        {/* ------------------------------------------------- her own page */}
        <div className="w4-web-node w4-web-page">
          <p className="w4-web-label">
            <span className="w4-kicker">And their customer gets</span>
            <b className="num">waakya.abcinteriors.com</b>
          </p>
          <div className="w4-minphone" data-on={back}>
            <div className="w4-phone-status">
              <span className="num">11:02</span>
              <span className="num">waakya.abcinteriors.com</span>
            </div>
            <div className="w4-minphone-body">
              <p className="w4-kicker w4-phone-kicker">Your office · Baner</p>
              <p className="w4-minphone-h">Hello Meera. Neha has your enquiry.</p>
              <ul className="w4-minphone-list">
                <li data-on={back}>
                  <b>Call from Neha</b> <span className="num">today, by 11:00</span>
                </li>
                <li data-on={back}>
                  <b>Site measurement</b> <span className="num">Thursday, 4:00 pm</span>
                </li>
                <li>
                  <b>Estimate</b> <span>after the visit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="w4-web-foot">
        <p className="w4-display w4-line">{STEPS[step]}</p>
        <StoryControl
          playing={playing}
          done={done}
          label="the enquiry"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReplay={replay}
        />
      </div>
    </div>
  );
}
