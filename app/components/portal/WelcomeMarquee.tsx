"use client";

/**
 * Animated welcome screen — direct port of the Claude Design handoff
 * (design_handoff_scale/welcome_screen, 2026-08-10): three marquee rows of
 * illustrated trade tiles drifting over a dark wall, light panel with serif
 * wordmark + one "Get started" action. Tile markup below is verbatim from
 * welcome-reference.html (static, design-authored) and rendered 8x per row so
 * the -50% keyframe loop lands seamlessly. Fixed palette per the handoff's
 * default scheme (dark wall / light panel) in every portal theme; keyframes
 * live in globals.css (om*).
 */

const ROW1_GROUP = `<div style="display: flex; width: max-content;">
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #1553c0;">
            <div style="position: absolute; left: 86px; top: -12px; width: 30px; height: 60px; background: #e9eef7; border-radius: 0 0 10px 10px;"></div>
            <div style="position: absolute; left: 79px; top: 38px; width: 44px; height: 12px; background: #c9d5ea; border-radius: 6px;"></div>
            <div style="position: absolute; left: 89px; top: 78px; width: 24px; height: 34px; animation: omDrip 4.6s ease-in infinite;">
              <div style="position: absolute; left: 4px; top: 0px; width: 16px; height: 16px; background: #a8dcff; transform: rotate(45deg);"></div>
              <div style="position: absolute; left: 0px; top: 8px; width: 24px; height: 24px; background: #a8dcff; border-radius: 50%;"></div>
            </div>
            <div style="position: absolute; left: 69px; top: 124px; width: 64px; height: 12px; border: 3px solid rgba(255,255,255,0.45); border-radius: 50%;"></div>
            <div style="position: absolute; left: 32px; top: 36px; width: 10px; height: 10px; background: rgba(255,255,255,0.35); border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #191722;">
            <div style="position: absolute; left: 25px; top: 25px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255,210,63,0.3), rgba(255,210,63,0) 70%); border-radius: 50%;"></div>
            <div style="position: absolute; left: 42px; top: 30px; width: 66px; height: 90px; background: #ffd23f; clip-path: polygon(58% 0%, 0% 58%, 38% 58%, 30% 100%, 100% 40%, 55% 40%);"></div>
            <div style="position: absolute; left: 26px; top: 26px; width: 8px; height: 8px; background: #ffd23f; border-radius: 50%;"></div>
            <div style="position: absolute; left: 116px; top: 102px; width: 6px; height: 6px; background: rgba(255,210,63,0.7); border-radius: 50%;"></div>
            <div style="position: absolute; left: 108px; top: 22px; width: 10px; height: 10px; background: #ff8a3d; transform: rotate(45deg);"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #f0e9dd;">
            <div style="position: absolute; left: -18px; top: 28px; width: 116px; height: 54px; background: #ff5f45; border-radius: 27px;"></div>
            <div style="position: absolute; left: 56px; top: 76px; width: 14px; height: 26px; background: #ff5f45; border-radius: 0 0 8px 8px;"></div>
            <div style="position: absolute; left: 86px; top: 28px; width: 30px; height: 54px; background: #ffffff; border-radius: 14px; box-shadow: inset -6px 0 0 rgba(0,0,0,0.08);"></div>
            <div style="position: absolute; left: 112px; top: 48px; width: 24px; height: 10px; background: #9aa3b2;"></div>
            <div style="position: absolute; left: 128px; top: 48px; width: 10px; height: 46px; background: #9aa3b2;"></div>
            <div style="position: absolute; left: 124px; top: 92px; width: 18px; height: 34px; background: #2b2620; border-radius: 8px;"></div>
            <div style="position: absolute; left: 30px; top: 106px; width: 8px; height: 8px; background: #ff5f45; border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: linear-gradient(180deg, #ff9a3d, #ff5f3d);">
            <div style="position: absolute; left: 92px; top: 14px; width: 40px; height: 40px; background: #ffe3a1; border-radius: 50%;"></div>
            <div style="position: absolute; left: 96px; top: 40px; width: 14px; height: 26px; background: #2c1a3e;"></div>
            <div style="position: absolute; left: 21px; top: 52px; width: 108px; height: 42px; background: #2c1a3e; clip-path: polygon(50% 0%, 100% 100%, 0% 100%);"></div>
            <div style="position: absolute; left: 33px; top: 93px; width: 84px; height: 44px; background: #40265c; border-radius: 0 0 6px 6px;"></div>
            <div style="position: absolute; left: 52px; top: 104px; width: 14px; height: 14px; background: #ffd23f; border-radius: 3px;"></div>
            <div style="position: absolute; left: 84px; top: 104px; width: 14px; height: 14px; background: #ffd23f; border-radius: 3px;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #1e2433;">
            <div style="position: absolute; left: 24px; top: 18px; width: 10px; height: 10px; background: rgba(255,255,255,0.35); border-radius: 50%;"></div>
            <div style="position: absolute; left: 110px; top: 38px; width: 26px; height: 70px; animation: omBob 9s ease-in-out infinite;">
              <div style="position: absolute; left: 1px; top: 0px; width: 3px; height: 46px; background: rgba(255,255,255,0.65);"></div>
              <div style="position: absolute; left: -8px; top: 46px; width: 22px; height: 16px; background: #e85d3d; border-radius: 3px;"></div>
            </div>
            <div style="position: absolute; left: 44px; top: 44px; width: 12px; height: 106px; background: #ffc43d;"></div>
            <div style="position: absolute; left: 20px; top: 34px; width: 112px; height: 10px; background: #ffc43d;"></div>
            <div style="position: absolute; left: 14px; top: 44px; width: 16px; height: 14px; background: #e0a92f;"></div>
            <div style="position: absolute; left: 36px; top: 48px; width: 26px; height: 18px; background: #ffd76e; border-radius: 3px;"></div>
            <div style="position: absolute; left: 0px; top: 138px; width: 150px; height: 12px; background: #141926;"></div>
          </div>
        </div>`;

const ROW2_GROUP = `<div style="display: flex; width: max-content;">
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #0d8477;">
            <div style="position: absolute; left: 25px; top: 25px; width: 100px; height: 100px; border: 8px solid rgba(255,255,255,0.28); border-radius: 50%; box-sizing: border-box;"></div>
            <div style="position: absolute; left: 35px; top: 35px; width: 80px; height: 80px; animation: omSpin 22s linear infinite;">
              <div style="position: absolute; left: 32px; top: 0px; width: 16px; height: 34px; background: #d9fff2; border-radius: 8px; transform-origin: 8px 40px; transform: rotate(0deg);"></div>
              <div style="position: absolute; left: 32px; top: 0px; width: 16px; height: 34px; background: #d9fff2; border-radius: 8px; transform-origin: 8px 40px; transform: rotate(120deg);"></div>
              <div style="position: absolute; left: 32px; top: 0px; width: 16px; height: 34px; background: #d9fff2; border-radius: 8px; transform-origin: 8px 40px; transform: rotate(240deg);"></div>
            </div>
            <div style="position: absolute; left: 64px; top: 64px; width: 22px; height: 22px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #b05f22;">
            <div style="position: absolute; left: 0px; top: 108px; width: 150px; height: 24px; background: #7c3d12;"></div>
            <div style="position: absolute; left: 0px; top: 116px; width: 150px; height: 5px; background: #8f4a16;"></div>
            <div style="position: absolute; left: 0px; top: 132px; width: 150px; height: 18px; background: #6a3410;"></div>
            <div style="position: absolute; left: 25px; top: 66px; width: 100px; height: 26px; background: #ffd23f; border-radius: 7px;"></div>
            <div style="position: absolute; left: 60px; top: 72px; width: 30px; height: 14px; background: rgba(0,0,0,0.28); border-radius: 5px;"></div>
            <div style="position: absolute; left: 71px; top: 75px; width: 9px; height: 8px; background: #b7ff5e; border-radius: 50%;"></div>
            <div style="position: absolute; left: 36px; top: 44px; width: 7px; height: 7px; background: #ffd9a8; border-radius: 50%;"></div>
            <div style="position: absolute; left: 104px; top: 40px; width: 5px; height: 5px; background: #ffd9a8; border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #bfe4ff;">
            <div style="position: absolute; left: 104px; top: 14px; width: 30px; height: 30px; background: #ffd23f; border-radius: 50%;"></div>
            <div style="position: absolute; left: 66px; top: 62px; width: 10px; height: 30px; background: #6b4423; border-radius: 3px;"></div>
            <div style="position: absolute; left: 47px; top: 24px; width: 48px; height: 48px; background: #2c7d3f; border-radius: 50%;"></div>
            <div style="position: absolute; left: 56px; top: 31px; width: 15px; height: 15px; background: rgba(255,255,255,0.25); border-radius: 50%;"></div>
            <div style="position: absolute; left: -46px; top: 92px; width: 160px; height: 160px; background: #4aa653; border-radius: 50%;"></div>
            <div style="position: absolute; left: 64px; top: 106px; width: 150px; height: 150px; background: #37904a; border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #23212c;">
            <div style="position: absolute; left: 22px; top: 52px; width: 76px; height: 76px; background: radial-gradient(circle, rgba(255,170,60,0.5), rgba(255,170,60,0) 70%); border-radius: 50%; animation: omPulse 3.2s ease-in-out infinite;"></div>
            <div style="position: absolute; left: 58px; top: 62px; width: 4px; height: 56px; background: #ffd23f; border-radius: 2px; transform: rotate(0deg);"></div>
            <div style="position: absolute; left: 58px; top: 62px; width: 4px; height: 56px; background: #ffd23f; border-radius: 2px; transform: rotate(45deg);"></div>
            <div style="position: absolute; left: 58px; top: 62px; width: 4px; height: 56px; background: #ffd23f; border-radius: 2px; transform: rotate(90deg);"></div>
            <div style="position: absolute; left: 58px; top: 62px; width: 4px; height: 56px; background: #ffd23f; border-radius: 2px; transform: rotate(135deg);"></div>
            <div style="position: absolute; left: 51px; top: 81px; width: 18px; height: 18px; background: #ffffff; border-radius: 50%;"></div>
            <div style="position: absolute; left: 84px; top: 26px; width: 56px; height: 20px; background: #cdd3e2; border-radius: 10px; transform: rotate(45deg);"></div>
            <div style="position: absolute; left: 78px; top: 54px; width: 18px; height: 14px; background: #8b93a8; border-radius: 4px; transform: rotate(45deg);"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #d9cbb4;">
            <div style="position: absolute; left: 88px; top: 30px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px; transform: rotate(-10deg); box-shadow: 0 6px 10px rgba(0,0,0,0.15);"></div>
            <div style="position: absolute; left: -20px; top: 58px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 25px; top: 58px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 2px; top: 81px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 47px; top: 81px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 92px; top: 81px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 137px; top: 81px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: -20px; top: 104px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 25px; top: 104px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 70px; top: 104px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 115px; top: 104px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 2px; top: 127px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 47px; top: 127px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 92px; top: 127px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
            <div style="position: absolute; left: 137px; top: 127px; width: 40px; height: 18px; background: #c65a3a; border-radius: 2px;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #2e7d5b;">
            <div style="position: absolute; left: 0px; top: 118px; width: 150px; height: 32px; background: #8a5a2e;"></div>
            <div style="position: absolute; left: 0px; top: 124px; width: 150px; height: 5px; background: #9c6a38;"></div>
            <div style="position: absolute; left: 92px; top: 92px; width: 17px; height: 5px; background: #d7dce6; border-radius: 2px;"></div>
            <div style="position: absolute; left: 98px; top: 96px; width: 5px; height: 24px; background: #d7dce6;"></div>
            <div style="position: absolute; left: 24px; top: 22px; width: 80px; height: 92px; transform: rotate(30deg);">
              <div style="position: absolute; left: 18px; top: 8px; width: 48px; height: 18px; background: #b7bfcf; border-radius: 4px;"></div>
              <div style="position: absolute; left: 58px; top: 8px; width: 10px; height: 18px; background: #97a0b4; border-radius: 0 4px 4px 0;"></div>
              <div style="position: absolute; left: 34px; top: 24px; width: 14px; height: 62px; background: #d9a05b; border-radius: 7px;"></div>
            </div>
            <div style="position: absolute; left: 114px; top: 76px; width: 9px; height: 9px; background: #ffffff; opacity: 0.6; transform: rotate(45deg);"></div>
          </div>
        </div>`;

const ROW3_GROUP = `<div style="display: flex; width: max-content;">
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #4a3dc4;">
            <div style="position: absolute; left: 18px; top: 56px; width: 40px; height: 40px; border: 12px solid #f4b942; border-radius: 50%; box-sizing: border-box;"></div>
            <div style="position: absolute; left: 56px; top: 70px; width: 66px; height: 12px; background: #f4b942; border-radius: 0 6px 6px 0;"></div>
            <div style="position: absolute; left: 100px; top: 82px; width: 10px; height: 16px; background: #f4b942;"></div>
            <div style="position: absolute; left: 114px; top: 82px; width: 8px; height: 12px; background: #f4b942;"></div>
            <div style="position: absolute; left: 108px; top: 34px; width: 12px; height: 12px; background: #ffffff; opacity: 0.8; transform: rotate(45deg);"></div>
            <div style="position: absolute; left: 34px; top: 116px; width: 8px; height: 8px; background: rgba(255,255,255,0.5); transform: rotate(45deg);"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #1f8fd0;">
            <div style="position: absolute; left: 40px; top: -30px; width: 70px; height: 220px; background: rgba(255,255,255,0.14); transform: rotate(28deg);"></div>
            <div style="position: absolute; left: 34px; top: 40px; width: 48px; height: 48px; background: rgba(255,255,255,0.85); border-radius: 50%;"></div>
            <div style="position: absolute; left: 42px; top: 47px; width: 12px; height: 12px; background: #ffffff; border-radius: 50%;"></div>
            <div style="position: absolute; left: 94px; top: 28px; width: 26px; height: 26px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
            <div style="position: absolute; left: 86px; top: 92px; width: 34px; height: 34px; background: rgba(255,255,255,0.75); border-radius: 50%;"></div>
            <div style="position: absolute; left: 30px; top: 106px; width: 16px; height: 16px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
            <div style="position: absolute; left: 118px; top: 72px; width: 10px; height: 10px; background: #ffffff; transform: rotate(45deg);"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #cf3440;">
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(0deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(45deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(90deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(135deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(180deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(225deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(270deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 68px; top: 75px; width: 14px; height: 14px; background: #f6e7dc; border-radius: 3px; transform: rotate(315deg) translateY(-32px);"></div>
            <div style="position: absolute; left: 47px; top: 54px; width: 56px; height: 56px; background: #f6e7dc; border-radius: 50%;"></div>
            <div style="position: absolute; left: 65px; top: 72px; width: 20px; height: 20px; background: #cf3440; border-radius: 50%;"></div>
            <div style="position: absolute; left: 14px; top: 38px; width: 26px; height: 6px; background: rgba(255,255,255,0.5); border-radius: 3px;"></div>
            <div style="position: absolute; left: 8px; top: 54px; width: 18px; height: 6px; background: rgba(255,255,255,0.35); border-radius: 3px;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #f2a71b;">
            <div style="position: absolute; left: 24px; top: 124px; width: 102px; height: 12px; background: rgba(0,0,0,0.15); border-radius: 50%;"></div>
            <div style="position: absolute; left: 29px; top: 74px; width: 92px; height: 52px; background: #2c2620; border-radius: 8px;"></div>
            <div style="position: absolute; left: 29px; top: 88px; width: 92px; height: 4px; background: rgba(255,255,255,0.18);"></div>
            <div style="position: absolute; left: 68px; top: 82px; width: 14px; height: 12px; background: #f2a71b; border-radius: 3px;"></div>
            <div style="position: absolute; left: 57px; top: 52px; width: 36px; height: 28px; border: 7px solid #2c2620; border-radius: 12px; box-sizing: border-box;"></div>
            <div style="position: absolute; left: 112px; top: 36px; width: 10px; height: 10px; background: #ffffff; opacity: 0.8; transform: rotate(45deg);"></div>
            <div style="position: absolute; left: 30px; top: 42px; width: 9px; height: 9px; background: rgba(44,38,32,0.4); border-radius: 50%;"></div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #5b3a80;">
            <div style="position: absolute; left: 116px; top: 22px; width: 10px; height: 10px; background: rgba(255,255,255,0.3); border-radius: 50%;"></div>
            <div style="position: absolute; left: 32px; top: 136px; width: 86px; height: 9px; background: rgba(0,0,0,0.22); border-radius: 50%;"></div>
            <div style="position: absolute; left: 40px; top: 6px; width: 70px; height: 140px; transform: rotate(12deg);">
              <div style="position: absolute; left: 8px; top: 0px; width: 10px; height: 134px; background: #ffc43d; border-radius: 5px;"></div>
              <div style="position: absolute; left: 52px; top: 0px; width: 10px; height: 134px; background: #ffc43d; border-radius: 5px;"></div>
              <div style="position: absolute; left: 14px; top: 14px; width: 42px; height: 8px; background: #e0a92f; border-radius: 4px;"></div>
              <div style="position: absolute; left: 14px; top: 38px; width: 42px; height: 8px; background: #e0a92f; border-radius: 4px;"></div>
              <div style="position: absolute; left: 14px; top: 62px; width: 42px; height: 8px; background: #e0a92f; border-radius: 4px;"></div>
              <div style="position: absolute; left: 14px; top: 86px; width: 42px; height: 8px; background: #e0a92f; border-radius: 4px;"></div>
              <div style="position: absolute; left: 14px; top: 110px; width: 42px; height: 8px; background: #e0a92f; border-radius: 4px;"></div>
            </div>
          </div>
          <div style="position: relative; width: 150px; height: 150px; margin-right: 16px; border-radius: 26px; overflow: hidden; flex-shrink: 0; background: #39404f;">
            <div style="position: absolute; left: 44px; top: 114px; width: 62px; height: 9px; background: rgba(0,0,0,0.28); border-radius: 50%;"></div>
            <div style="position: absolute; left: 40px; top: 58px; width: 70px; height: 40px; background: #ffc43d; border-radius: 35px 35px 0 0;"></div>
            <div style="position: absolute; left: 68px; top: 50px; width: 14px; height: 16px; background: #ffc43d; border-radius: 7px 7px 0 0;"></div>
            <div style="position: absolute; left: 28px; top: 96px; width: 94px; height: 14px; background: #e0a92f; border-radius: 999px;"></div>
            <div style="position: absolute; left: 52px; top: 68px; width: 12px; height: 12px; background: rgba(255,255,255,0.35); border-radius: 50%;"></div>
            <div style="position: absolute; left: 108px; top: 38px; width: 10px; height: 10px; background: #ffffff; opacity: 0.7; transform: rotate(45deg);"></div>
          </div>
        </div>`;

const WALL = "#0c0b10";

function Track({ group, animation, marginLeft }: { group: string; animation: string; marginLeft?: string }) {
  return (
    <div
      style={{ display: "flex", width: "max-content", marginLeft, animation }}
      dangerouslySetInnerHTML={{ __html: group.repeat(8) }}
    />
  );
}

export function WelcomeMarquee({ brand, onStart }: { brand: "scale" | "respond"; onStart: () => void }) {
  const wordmark = brand === "respond" ? "Respond" : "Scale";
  return (
    <div className="pj-marquee" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--font-archivo), Archivo, sans-serif", background: WALL }}>
      <div style={{ position: "relative", flex: "1 1 0%", minHeight: 300, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, overflow: "hidden", background: WALL }} aria-hidden>
        <Track group={ROW1_GROUP} animation="omRight 160s linear infinite" />
        <Track group={ROW2_GROUP} animation="omLeft 135s linear infinite" marginLeft="-84px" />
        <Track group={ROW3_GROUP} animation="omRight 210s linear infinite" marginLeft="-42px" />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 90, background: `linear-gradient(90deg, ${WALL} 0%, rgba(0,0,0,0) 100%)`, pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 90, background: `linear-gradient(270deg, ${WALL} 0%, rgba(0,0,0,0) 100%)`, pointerEvents: "none", zIndex: 2 }} />
      </div>
      <div style={{ background: "#f7f5f0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "54px 24px 36px", gap: 14 }}>
        <div style={{ fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif", fontSize: 56, lineHeight: 1, letterSpacing: "-0.5px", color: "#17130e" }}>{wordmark}</div>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "0.2px", color: "#6f6a60" }}>Built for the trades</div>
        <button
          type="button"
          onClick={onStart}
          className="pj-marquee-cta"
          style={{ marginTop: 14, padding: "16px 48px", borderRadius: 999, border: "none", background: "#17130e", color: "#f7f5f0", fontFamily: "var(--font-archivo), Archivo, sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.2px", cursor: "pointer", transition: "transform 0.18s ease, background 0.18s ease" }}
        >
          Get started
        </button>
        <div style={{ marginTop: 18, display: "flex", gap: 6, alignItems: "center", fontSize: 12.5, color: "#8b857b" }}>
          <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>Terms &amp; Conditions</span>
          <span>&middot;</span>
          <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
