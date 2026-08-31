/**
 * Mobile shell v16 — pin center to grid track 2 + left drawers + FishLogo FAB.
 *
 * Root cause of “only menu visible” (v11): `grid-template-columns: 0 1fr 0` +
 * `position:fixed` on sidebar/details removes them from grid flow → center
 * auto-places into track 1 (width 0). Fix: `grid-column: 2` on centerCol.
 *
 * v16 rules:
 * - Pin .centerCol to grid-column:2 / grid-row:1 under mobile shell
 * - Never transform the center column; never lock html/body/#root height
 * - Drawer from the LEFT; open via FAB click/tap (no swipe-open)
 * - Close: backdrop tap + swipe-left on backdrop; no X button
 * - Main grid stays 0 1fr 0 so local page does not move/squeeze
 * - FAB: touch-action none + capture on pointerdown; open on pointerup if not drag
 * - Header: AgentPreset「模式」beside 轨迹 tabs (title row free)
 * - Session tap auto-close: YDXeBa_sessionRow / searchResultRow (+ 140/280ms)
 * - Plugin only (dsh.client)
 */
window.__ModuleLoader__.load({
  id: 'dsh-webui-mobile',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')

    const MOBILE_MQ = '(max-width: 1023px)'
    const STYLE_ID = 'dsh-webui-mobile-css-v1'
    const HTML_CLASS = 'dsh-mobile-shell'
    const ATTR_DETAILS = 'data-dsh-mobile-details-open'
    const FAB_POS_KEY = 'dsh-mobile-fab-pos'
    const DRAG_THRESHOLD = 8
    const FAB_SIZE = 44
    const FAB_MARGIN = 8
    // Swipe-close only (backdrop); axis-lock aborts vertical pans
    const SWIPE_AXIS_LOCK = 12
    const SWIPE_DX_MIN = 48
    const SWIPE_DX_DY = 1.5
    // Current @deepseek-ai/dsh-client-ui-layout AppFrame module classes
    const CLS = {
      frame: 'pI_x6G_frame',
      sidebar: 'pI_x6G_sidebarCol',
      center: 'pI_x6G_centerCol',
      details: 'pI_x6G_detailsCol',
      overlay: 'pI_x6G_overlayLayer',
      chatScroll: 'Md3f7G_scroll',
      chatOlder: 'Md3f7G_older',
    }
    const MSG = {
      actions: 'p-xYUq_actions',
      action: 'p-xYUq_action',
      timeStart: 'p-xYUq_timeStart',
      timeEnd: 'p-xYUq_timeEnd',
      runTimeDot: 'p-xYUq_runTimeDot',
    }
    const STATS = { root: 'FJxK0a_root', sep: 'FJxK0a_sep' }
    const INPUT = {
      root: 'uV2eYG_root',
      card: 'uV2eYG_card',
      row: 'uV2eYG_row',
      modes: 'uV2eYG_modes',
      select: 'uV2eYG_select',
      tools: 'uV2eYG_tools',
      trailing: 'uV2eYG_trailing',
      primary: 'uV2eYG_primary',
      add: 'uV2eYG_add',
      input: 'uV2eYG_input',
    }
    // Conversation session header (title / 轨迹 / AgentPreset「模式」)
    const HDR = {
      header: 'wSkVaW_header',
      titleRow: 'wSkVaW_titleRow',
      titleCluster: 'wSkVaW_titleCluster',
      crumbs: 'wSkVaW_crumbs',
      crumb: 'wSkVaW_crumb',
      crumbSeg: 'wSkVaW_crumbSeg',
      crumbSep: 'wSkVaW_crumbSep',
      crumbCurrent: 'wSkVaW_crumbCurrent',
      headerActions: 'wSkVaW_headerActions',
      headerUtilities: 'wSkVaW_headerUtilities',
      tabs: 'wSkVaW_tabs',
    }
    const PRESET_LABEL = 'SVAs4q_label'
    // Subagent catalog (header actions trigger + dropdown menu)
    const SUBAGENT = {
      root: 'h8S2Va_root',
      trigger: 'h8S2Va_trigger',
      menu: 'h8S2Va_menu',
    }
    // User-questions panel (ask_user_question composer takeover)
    const QUESTION = {
      frame: 'Mbwy4a_frame',
      card: 'Mbwy4a_card',
      options: 'Mbwy4a_options',
      body: 'Mbwy4a_body',
      footer: 'Mbwy4a_footer',
    }
    // New-session / hero composer (choose workspace, glow, workspace row)
    const HERO = {
      composerHero: 'wSkVaW_composerHero',
      heroGlow: 'wSkVaW_heroGlow',
      heroWorkspaceRow: 'wSkVaW_heroWorkspaceRow',
      scrollBody: 'wSkVaW_scrollBody',
      root: 'wSkVaW_root',
      shellRoot: 'pXSMma_root',
      shellStack: 'pXSMma_stack',
      shellBody: 'pXSMma_body',
    }
    // Workspace section header — the row directly beside the workspace title:
    // search field, view-options (group/order) menu, and add-workspace (+)
    // button. These controls open sub-views / menus inside the drawer, so a tap
    // must NOT collapse the sidebar (previously the generic "actionable" branch
    // closed it → search / add-workspace flashed the drawer closed).
    const WS_HDR = {
      sectionHeader: 'qDHVXG_sectionHeader',
      search: 'qDHVXG_search',
      searchButton: 'qDHVXG_searchButton',
      searchInput: 'qDHVXG_searchInput',
      clearButton: 'qDHVXG_clearButton',
      iconButton: 'qDHVXG_iconButton',
      headerActions: 'qDHVXG_headerActions',
      sessionOverflow: 'qDHVXG_sessionOverflowButton',
    }
    // Workspace sidebar session rows (div[role=treeitem], not <button>)
    const SIDEBAR_ROW = {
      session: 'YDXeBa_sessionRow',
      search: 'YDXeBa_searchResultRow',
      project: 'YDXeBa_projectRow',
      rowActions: 'YDXeBa_rowActions',
      iconButton: 'YDXeBa_iconButton',
    }
    // Tooltip bubble (hover label like 停止生成/发送消息/关闭) — position:fixed
    // with hover-time coordinates that don't follow the anchor when it moves.
    const TOOLTIP_BUBBLE = '_bubble_owhem_8'
    // Sidebar inner root (SidebarRoot) — carries an inline width from the desktop
    // three-column layout that is narrower than the phone drawer, leaving a
    // blank strip to the right of the collapse button.
    const SIDEBAR_ROOT = 'hHd-Xa_root'
    // Settings panel (two-column 800px sheet) — breaks on phones unless turned
    // into a full-screen single column.
    const SETTINGS = {
      overlay: 'VOzbGW_overlay',
      panel: 'VOzbGW_panel',
      nav: 'VOzbGW_nav',
      navList: 'VOzbGW_navList',
      navCell: 'VOzbGW_navCell',
      navTitle: 'VOzbGW_navTitle',
      content: 'VOzbGW_content',
      options: 'VOzbGW_options',
      trigger: 'VOzbGW_trigger',
    }

    function shellDisabled() {
      try {
        if (typeof location === 'undefined') return false
        if (new URLSearchParams(location.search).get('mobileShell') === '0') return true
        if (localStorage.getItem('dsh-mobile-shell') === '0') return true
      } catch (_) {}
      return false
    }

    const CSS = `
@media ${MOBILE_MQ} {
  /* Local chat: full width, never translated / squeezed */
  html.${HTML_CLASS} .${CLS.frame} {
    grid-template-columns: 0 minmax(0, 1fr) 0 !important;
    transition: none !important;
    transform: none !important;
  }

  html.${HTML_CLASS} .${CLS.frame} > [data-side] {
    display: none !important;
  }

  /* CENTER — pin to track 2 (1fr) so fixed side columns cannot starve chat */
  html.${HTML_CLASS} .${CLS.center} {
    grid-column: 2 !important;
    grid-row: 1 !important;
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    inset: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    left: auto !important;
    width: auto !important;
    max-width: none !important;
    height: 100% !important; /* keep the grid track's full height so the
                               conversation root's height:100% chain survives —
                               without it the composer scrolls out of view */
    align-self: stretch !important;
    min-height: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    transform: none !important;
    translate: none !important;
    pointer-events: auto !important;
    overflow: visible !important; /* never clip the model/effort dropdowns that
                                    pop up or out of the center column */
    z-index: 1 !important;
  }

  /* Overlay stays a full-frame absolute layer; never steal the center track */
  html.${HTML_CLASS} .${CLS.overlay} {
    grid-column: 1 / -1 !important;
    grid-row: 1 !important;
  }

  /* SIDEBAR — left drawer; closed parked off-screen to the LEFT (not on center).
     Width is FIXED at the workspace-loaded width (the inner root carries the
     desktop three-column inline width, ~280px + gutters ≈ 302px). It used to
     be max-content, which made the drawer jump when the workspace loaded and,
     while narrow, CLIP the fixed-width settings card — its right-edge dropdown
     selectors (Agent preset, language, …) fell outside the drawer's overflow
     box and became untappable. The dimmed backdrop separates it from the app,
     so there is no hard border-right edge. */
  html.${HTML_CLASS} {
    /* Single source of truth for the drawer width — the settings sheet
       derives its own width from this so it can never overflow the drawer. */
    --dsw-mob-drawer-w: 302px;
  }
  /* SIDEBAR — left drawer; closed parked off-screen to the LEFT (not on center).
     Width is FIXED at the workspace-loaded width (the inner root carries the
     desktop three-column inline width, ~280px + gutters). It used to be
     max-content, which made the drawer jump when the workspace loaded and,
     while narrow, CLIP the settings card — its right-edge dropdown selectors
     (Agent preset, language, …) fell outside the drawer's overflow box and
     became untappable. The dimmed backdrop separates it from the app, so
     there is no hard border-right edge. */
  html.${HTML_CLASS} .${CLS.sidebar} {
    position: fixed !important;
    z-index: 50 !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: 0 !important;
    width: var(--dsw-mob-drawer-w) !important;
    min-width: var(--dsw-mob-drawer-w) !important;
    max-width: 92vw !important;
    height: 100% !important;
    height: 100dvh !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-base, #fff)) !important;
    border: none !important;
    overflow: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    transform: translate3d(-100%, 0, 0) !important;
    pointer-events: none !important;
    transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }

  /* Open state must be transform:none — NOT translate3d(0,0,0). An identity
     transform still makes the drawer the containing block for fixed-position
     descendants (the settings dialog's .VOzbGW_overlay is portaled into the
     sidebar DOM), so the wide settings sheet overflows/offsets. With
     transform:none the overlay is viewport-anchored → the settings sheet
     dims the full screen and centers (the dsh-mobile-nav approach). */
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} {
    transform: none !important;
    pointer-events: auto !important;
  }

  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} > * {
    width: 100% !important;
    max-width: none !important;
    animation: none !important;
  }
  /* The sidebar's inner root carries an inline width from the desktop
     three-column solve (e.g. 280px) that is narrower than the phone drawer
     (min(100%,360px)), leaving a blank strip right of the collapse button.
     Force the inner root to fill the drawer. */
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${SIDEBAR_ROOT} {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Label"] {
    max-width: none !important;
    opacity: 1 !important;
    overflow: visible !important;
  }
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} time,
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="time"],
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Time"],
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="meta"],
  html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Meta"] {
    flex: none;
    white-space: nowrap;
    position: static !important;
    transform: none !important;
    opacity: 1 !important;
  }

  /* DETAILS — left slide sheet for tool-row clicks */
  html.${HTML_CLASS} .${CLS.details} {
    position: fixed !important;
    z-index: 55 !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    height: 100dvh !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--dsw-alias-bg-base, #fff) !important;
    border: none !important;
    overflow: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    transform: translate3d(-100%, 0, 0) !important;
    pointer-events: none !important;
    transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }

  html.${HTML_CLASS}[${ATTR_DETAILS}] .${CLS.details} {
    transform: translate3d(0, 0, 0) !important;
    pointer-events: auto !important;
  }

  html.${HTML_CLASS}[${ATTR_DETAILS}] .${CLS.details} > * {
    width: 100% !important;
    max-width: none !important;
    min-height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    html.${HTML_CLASS} .${CLS.sidebar},
    html.${HTML_CLASS} .${CLS.details} {
      transition: none !important;
    }
  }

  /* Message footer — line1 icons+time; line2 metrics (runMs inside timeEnd) */
  html.${HTML_CLASS} .${MSG.actions} {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    height: auto !important;
    min-height: 28px !important;
    gap: 6px 8px !important;
    row-gap: 4px !important;
    font-size: 12px;
  }
  html.${HTML_CLASS} .${MSG.timeStart},
  html.${HTML_CLASS} .${MSG.timeEnd} {
    display: contents !important;
  }
  html.${HTML_CLASS} .${MSG.runTimeDot}:first-of-type {
    flex: 0 0 100% !important;
    width: 100% !important;
    height: 0 !important;
    margin: 0 !important;
    opacity: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }
  html.${HTML_CLASS} .${MSG.runTimeDot}:not(:first-of-type) {
    margin: 0 6px !important;
    font-size: 12px !important;
  }
  /* StatsLine composer dock — two lines; hide TTFT/tok/s */
  html.${HTML_CLASS} .${STATS.root} {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: baseline !important;
    gap: 1px 0 !important;
    row-gap: 1px !important;
    max-width: 100% !important;
    font-size: 10.5px !important;
    line-height: 13px !important;
    text-align: center !important;
    opacity: 1;
  }
  /* Line 1 (rounds/steps + LLM/tool timings): muted whisper */
  html.${HTML_CLASS} .${STATS.root} > :first-child,
  html.${HTML_CLASS} .${STATS.root} > :nth-child(3) {
    font-size: 9.5px !important;
    color: var(--dsw-alias-label-tertiary, #9aa0a8) !important;
    font-weight: 500 !important;
  }
  /* Line 2 (cache hit + input/output tokens): the three cost metrics stand out */
  html.${HTML_CLASS} .${STATS.root} > [data-dsh-stats="cacheHit"],
  html.${HTML_CLASS} .${STATS.root} > :last-child {
    font-weight: 700 !important;
    font-size: 11.5px !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
  }
  html.${HTML_CLASS} .${STATS.root} [data-dsh-stats="speeds"],
  html.${HTML_CLASS} .${STATS.root} [data-dsh-stats="sep-hide"] {
    display: none !important;
  }
  html.${HTML_CLASS} .${STATS.root} [data-dsh-stats-break] {
    flex: 0 0 100% !important;
    width: 100% !important;
    height: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }

  /* InputBar — single nowrap toolbar row (v15; undo v14 stack) */
  html.${HTML_CLASS} .${INPUT.root} {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    padding-left: max(0px, env(safe-area-inset-left, 0px)) !important;
    padding-right: max(0px, env(safe-area-inset-right, 0px)) !important;
    padding-bottom: max(6px, env(safe-area-inset-bottom, 0px)) !important;
    overflow: visible !important; /* never clip model/effort popovers that pop up */
  }
  html.${HTML_CLASS} .${INPUT.card} {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    gap: 8px !important;
    padding-top: 8px !important;
    border-radius: 18px !important;
    overflow: visible !important; /* was hidden — clips PermissionSelect */
  }
  html.${HTML_CLASS} .${INPUT.row} {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 6px !important;
    padding: 2px 8px 8px !important;
    min-width: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .${INPUT.tools} {
    flex: 0 1 auto !important; /* NOT 1 1 100% */
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 6px !important;
    min-width: 0 !important;
    max-width: none !important;
  }
  html.${HTML_CLASS} .${INPUT.modes} {
    flex: 0 1 auto !important; /* NOT 1 1 100% */
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 4px !important;
    min-width: 0 !important;
    max-width: min(42vw, 140px) !important;
    overflow: visible !important;
  }
  html.${HTML_CLASS} .${INPUT.select} {
    flex: 0 1 auto !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: min(42vw, 140px) !important; /* compact; QA may use 36–42vw */
    min-height: 36px !important;
    height: 36px !important;
    font-size: 13px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  html.${HTML_CLASS} .${INPUT.trailing} {
    flex: 1 1 auto !important; /* NOT 1 1 100% — same row */
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: 6px !important;
    min-width: 0 !important;
    max-width: none !important;
  }
  html.${HTML_CLASS} .${INPUT.add} {
    width: 36px !important;
    height: 36px !important;
    flex: none !important;
  }
  html.${HTML_CLASS} .${INPUT.primary} {
    width: 40px !important;
    height: 40px !important;
    transform: none !important;
    flex: none !important;
  }

  /* Mobile image-upload button: pinned top-right of the composer card (above the
     input, same side as Send), about half the 40px send button so it stays light.
     The composer card is position:relative, so absolute works from here. */
  html.${HTML_CLASS} .dshMobImg {
    position: absolute !important;
    right: 10px !important;
    bottom: calc(100% + 4px) !important; /* float ABOVE the composer card */
    z-index: 5 !important;
    display: flex !important;
    flex-direction: column !important; /* vertical, extends upward */
    align-items: flex-end !important;
    gap: 6px !important;
    pointer-events: auto !important;
  }
  html.${HTML_CLASS} .dshMobImg_btn {
    width: 28px !important;
    height: 28px !important;
    flex: none !important;
    border-radius: 9px !important;
    border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0,0,0,.12)) !important;
    background: var(--dsw-specific-input-major, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-label-secondary, inherit) !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    cursor: pointer !important;
    box-shadow: var(--dsw-shadow-lv1, none) !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  html.${HTML_CLASS} .dshMobImg_btn:active {
    background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)) !important;
  }
  html.${HTML_CLASS} .dshMobImg_chips {
    display: flex !important;
    flex-direction: column !important; /* each thumbnail stacks vertically */
    align-items: flex-end !important;
    gap: 6px !important;
  }
  html.${HTML_CLASS} .dshMobImg_chip {
    position: relative !important;
    width: 48px !important;
    height: 48px !important;
    border-radius: 10px !important;
    border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0,0,0,.12)) !important;
    overflow: hidden !important;
    display: inline-flex !important;
  }
  html.${HTML_CLASS} .dshMobImg_chip img {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }
  html.${HTML_CLASS} .dshMobImg_del {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    width: 18px !important;
    height: 18px !important;
    border: none !important;
    border-radius: 0 0 0 8px !important;
    background: var(--dsw-alias-button-contrast-fill, rgba(0,0,0,.6)) !important;
    color: var(--dsw-alias-label-primary-inverted, #fff) !important;
    font-size: 12px !important;
    line-height: 18px !important;
    text-align: center !important;
    cursor: pointer !important;
    padding: 0 !important;
  }

  /* Session header: title alone; 「模式」beside 轨迹 tabs */
  html.${HTML_CLASS} .${HDR.header} {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    grid-template-areas:
      "crumbs crumbs"
      "tabs actions"
      "utilities" !important;
    align-items: center !important;
    column-gap: 8px !important;
    row-gap: 4px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  html.${HTML_CLASS} .${HDR.titleRow},
  html.${HTML_CLASS} .${HDR.titleCluster} {
    display: contents !important;
  }
  /* The session title owns a full-width line so a long title wraps to two lines
     (via the effect's two-line name box) instead of ellipsizing away — the
     "图2" layout. It must never be squeezed by the status/mode controls. */
  html.${HTML_CLASS} .${HDR.crumbs} {
    grid-area: crumbs !important;
    grid-column: 1 / -1 !important;
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }
  /* Secondary status (创造模式 / N 个后台任务运行中) becomes compact text on the
     row BELOW the title, so it can never clip or crowd the title line. */
  html.${HTML_CLASS} .${HDR.headerUtilities} {
    grid-area: utilities !important;
    grid-column: 1 / -1 !important;
    justify-self: end !important;
  }
  html.${HTML_CLASS} .${HDR.tabs} {
    grid-area: tabs !important;
    grid-column: 1 !important;
    justify-self: start !important;
    min-width: 0 !important;
  }
  html.${HTML_CLASS} .${HDR.headerActions} {
    grid-area: actions !important;
    grid-column: 2 !important;
    justify-self: end !important;
    align-self: center !important;
    min-width: 0 !important;
    max-width: 100% !important;
    flex-wrap: wrap !important;
    gap: 4px 8px !important;
    overflow: visible !important; /* don't clip subagent/jobs buttons or their menus */
    font-size: 12px !important;
    line-height: 16px !important;
  }
  html.${HTML_CLASS} .${HDR.headerActions} .${PRESET_LABEL} {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    font-size: 12px !important;
    line-height: 18px !important;
  }

  /* Subagent catalog: keep the trigger visible and pull its dropdown out of
     the (previously clipped) header so the child-agent list is reachable. */
  html.${HTML_CLASS} .${SUBAGENT.root} {
    position: static !important;
  }
  html.${HTML_CLASS} .${SUBAGENT.menu} {
    position: fixed !important;
    top: env(safe-area-inset-top, 0px) !important;
    left: 8px !important;
    right: 8px !important;
    width: auto !important;
    max-width: none !important;
    max-height: min(70vh, 560px) !important;
    z-index: 120 !important;
  }

  /* User-questions panel: on phones it renders inside the sticky composer seat,
     where narrow height / overflow clipping leaves it half-visible or hidden.
     Lift it into a full-screen centered dialog with a mask so options are
     always reachable (desktop unchanged). */
  html.${HTML_CLASS} .${QUESTION.frame} {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: fixed !important;
    inset: 0 !important;
    z-index: 300 !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 12px !important;
    box-sizing: border-box !important;
    max-height: none !important;
    overflow: auto !important;
    -webkit-overflow-scrolling: touch;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
  }
  html.${HTML_CLASS} .${QUESTION.card} {
    width: 100% !important;
    max-width: min(560px, 100%) !important;
    max-height: min(85vh, 85dvh) !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 20px !important;
    box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.2)) !important;
  }
  html.${HTML_CLASS} .${QUESTION.body} {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    min-height: 0 !important;
  }
  html.${HTML_CLASS} .${QUESTION.footer} {
    flex: none !important;
  }

  /* New-session hero composer: full-width column that fills the viewport so
     the centered title stays mid-screen while the input bar docks at the
     bottom like a normal conversation (no giant blank gap below it). */
  html.${HTML_CLASS} .${HERO.composerHero} {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 100% !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    padding-bottom: 16px !important;
    gap: 8px !important;
  }
  /* Title block (HeroShell) absorbs the extra vertical space and centers the
     headline inside it, keeping logo/text visually centered. */
  html.${HTML_CLASS} .${HERO.composerHero} .${HERO.shellRoot} {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: auto !important;
    justify-content: center !important;
    padding: 24px 16px !important;
  }
  html.${HTML_CLASS} .${HERO.composerHero} .${HERO.shellStack} {
    max-width: 100% !important;
    width: 100% !important;
  }
  /* The input bar and workspace row stay flex:none at the bottom. */
  html.${HTML_CLASS} .${HERO.composerHero} .${INPUT.root} {
    flex: none !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} .${HERO.heroGlow} {
    width: 100% !important;
    max-width: 100vw !important;
    opacity: 0.5 !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
  }
  html.${HTML_CLASS} .${HERO.heroWorkspaceRow} {
    box-sizing: border-box !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    flex-wrap: wrap !important;
    min-width: 0 !important;
    flex: none !important;
  }

  /* Tooltip bubbles (停止生成/发送消息/关闭 hover labels) are position:fixed
     with hover-time coordinates, so they don't follow their anchor when the
     composer/drawer scrolls or reflows on phones. Hide them on mobile — touch
     has no hover anyway, and aria-labels keep the text available to AT. */
  html.${HTML_CLASS} .${TOOLTIP_BUBBLE} {
    display: none !important;
  }

  /* Settings sheet: the drawer's open state is transform:none (see above), so
     this overlay is viewport-anchored and the panel can be pinned to it.
     Match the dsh-mobile-nav look: a near-full-width rounded CARD pinned
     below the status bar (safe-area aware), height following its content and
     capped to the viewport, with a slide+rise+fade entrance — instead of the
     desktop two-column left-nav sheet snapped to a small centered box. */
  html.${HTML_CLASS} .${SETTINGS.panel} {
    position: absolute !important;
    left: 8px !important;
    top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    height: auto !important;
    max-height: min(800px, calc(100dvh - 24px - env(safe-area-inset-top, 0px))) !important;
    flex-direction: column !important;
    border-radius: 14px !important;
    animation: dsh-webui-sheet-in .22s var(--ds-ease-out, ease-in-out);
  }
  /* The dimmed mask under the settings card fades in with it. */
  /* The settings overlay portals into the drawer DOM; as position:absolute it
     was clipped to the drawer's fixed width — the right side of every tab
     (list badges, buttons, selectors) fell into the drawer's horizontal
     scroll and became invisible/untappable. While the sheet is mounted the
     drawer simply stops clipping (overflow:visible): the near-full-width
     card then spans past the drawer over the dimmed backdrop, and every
     control stays reachable. (:has, like the z-lift above.) */
  html.${HTML_CLASS} .${CLS.sidebar}:has(.${SETTINGS.overlay}) {
    overflow: visible !important;
  }
  html.${HTML_CLASS} .${SETTINGS.overlay} {
    animation: dsh-webui-fade .18s var(--ds-ease-out, ease-in-out);
  }
  /* The welcome/onboarding notice is a body-level overlay (z-index 1000),
     while this sheet is portaled inside the drawer, whose stacking context
     (z-index 50) caps it — so an unacknowledged notice paints over the whole
     settings card below its tab strip. While the settings overlay is
     mounted, lift the drawer above body-level modals; it drops back the
     moment the overlay unmounts, so the notice itself stays clickable in the
     normal flow. Browsers without :has() just skip the rule. */
  html.${HTML_CLASS} .${CLS.sidebar}:has(.${SETTINGS.overlay}) {
    z-index: 1001 !important;
  }
  /* The nav strip is a single flex row: the scrollable tab list on the left,
     the close X pinned to the far right. The nav container itself never
     scrolls, so the X is always fully visible (no clipping) — nav's look. */
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.nav} {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    flex: none !important;
    width: 100% !important;
    gap: 4px !important;
    padding: 8px 10px !important;
    overflow: hidden !important;
  }
  /* The tab list is the ONLY scrollable region; it takes the remaining width. */
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.navList} {
    display: flex !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 4px !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none !important;
  }
  /* The settings dialog's close button (X) is reparented into the nav strip by
     our effect; pin it to the RIGHT edge (after the scrollable tab list) so it
     is always visible at the top-right corner, never clipped. */
  html.${HTML_CLASS} .${SETTINGS.nav} [class*="_close"] {
    position: static !important;
    right: auto !important;
    flex: none !important;
    margin-left: 6px !important;
    align-self: center !important;
  }
  /* Each nav cell stays a fixed pill so the strip scrolls horizontally. */
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.nav} .${SETTINGS.navCell} {
    flex: 0 0 auto !important;
    width: auto !important;
    white-space: nowrap !important;
  }
  /* Hide the "设置" nav title on phones — the horizontally scrollable nav
     cells are self-explanatory and the title wastes vertical space. */
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.navTitle} {
    display: none !important;
  }
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.content} {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-height: 0 !important;
  }
  html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.options} {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  /* The "open config file" header band sits above the tab content and eats a
     full-width 54px row on phones; the action belongs in the General settings
     list instead (see the config-row effect). Hide the band on mobile. */
  html.${HTML_CLASS} .${SETTINGS.content} > [class*="_header"]:not([class*="_actions"]) {
    display: none !important;
  }
  /* The relocated "open config file" action, injected as the last row of the
     General settings list; clicking it just clicks the hidden original. */
  html.${HTML_CLASS} .dshMobCfgRow {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    padding: 13px 2px !important;
    border-top: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08)) !important;
    font-size: 14px !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent;
  }
  html.${HTML_CLASS} .dshMobCfgRow:active {
    opacity: .55;
  }
  html.${HTML_CLASS} .dshMobCfgRow .dshMobCfgRowChev {
    color: var(--dsw-alias-label-tertiary, #9aa0a8);
    font-size: 18px;
    line-height: 1;
  }
  /* Appearance (浅色/深色/跟随系统): the desktop control is one horizontal row
     of three equal cubes, but each cube's flex-basis (180px) exceeds half the
     390px row, so they wrapped onto separate lines. Keep them side by side. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cubeRow"] {
    flex-wrap: nowrap !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class*="_themeCube"] {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }
  /* Compact vertical rhythm: on desktop every settings row carries 16px
     top+bottom padding (32px per row), and the theme cubes 20px — on a phone
     that doubles the list height for no benefit. Tighten, mobile only.
     [class$="_row"] so "_rowText"/"_rowDesc" etc. are NOT matched. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_row"],
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_group"] {
    padding-top: 10px !important;
    padding-bottom: 10px !important;
  }
  /* Session log header button: keep only the download icon on phones — the
     "Session log" label eats ~80px of the narrow top bar. The native button
     carries min-width:111px for the label, so drop that too. Desktop keeps
     the full labeled button. */
  html.${HTML_CLASS} [class*="_sessionLogButton"] > span {
    display: none !important;
  }
  html.${HTML_CLASS} [class*="_sessionLogButton"] {
    min-width: 0 !important;
    padding-left: 9px !important;
    padding-right: 9px !important;
  }
  /* Agent 预设 tab: the preset cards collapse to ONE full-width column on
     phones (single grid track = content width, ~177px tall each). Desktop
     shows them two per row — keep that here too, with tighter padding and
     smaller desc text so two fit a 390px card. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cards"] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cardMain"] {
    padding: 10px 10px 9px !important;
    gap: 6px !important;
  }
  /* Uniform cards: every description clamps to the same 2 lines so all
     preset cards share one height and the grid reads as aligned rows. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cardDesc"] {
    font-size: 11px !important;
    line-height: 1.4 !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important;
    overflow: hidden !important;
  }

  /* Expanded cards (a details block mounted inside) take the whole grid row:
     their monospace detail content is unreadable inside one 155px column.
     Other rows keep their natural height. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cards"] > [class$="_card"]:has([class*="_cardDetails"]) {
    grid-column: 1 / -1 !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardDetails"] {
    max-height: 260px !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardDetails"] [class*="_content"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardDetails"] pre,
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardDetails"] code {
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }

  /* Keep iOS zoom guard */
  html.${HTML_CLASS} .${INPUT.input},
  html.${HTML_CLASS} textarea,
  html.${HTML_CLASS} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]) {
    font-size: 16px !important;
  }

  /* --- Subagent breadcrumb (mobile): wrap + single-letter lineage + two-line names ---
     The host crumb (wSkVaW_crumb) is one nowrap button clamped to 220px with
     ellipsis, so long agent/session names truncate horizontally. On phones we
     let the crumb wrap to multiple lines and strip the clamp; the effect
     breathes the single-letter lineage path into the crumbs and injects the
     relation prefix + the two-line name blocks. Scoped to html.dsh-mobile-shell
     so desktop keeps the native single-line crumb. (Do NOT re-add an 11.5px
     crumb font-size — that rule was deliberately reverted.) */
  html.${HTML_CLASS} .${HDR.crumbs} {
    flex-wrap: wrap !important;
    align-items: center !important;
    row-gap: 2px !important;
    column-gap: 2px !important;
    overflow: visible !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} .${HDR.crumbs} .${HDR.crumb} {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    line-height: 1.3 !important;
    padding-top: 1px !important;
    padding-bottom: 1px !important;
  }
  /* Injected crumb body: the single-letter path label and the root toggle. */
  html.${HTML_CLASS} .dshMobCrumbLetter,
  html.${HTML_CLASS} .dshMobCrumbRoot,
  html.${HTML_CLASS} .dshMobCrumbOriginal {
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    white-space: nowrap !important;
  }
  /* Injected two-line name box (subagent list items): the top line carries the
     head, the bottom line the tail. Each line is nowrap and the effect shrinks
     the font independently until every character shows. */
  html.${HTML_CLASS} .dshMobName {
    display: inline-block !important;
    min-width: 0 !important;
    max-width: 100% !important;
    vertical-align: top !important;
  }
  html.${HTML_CLASS} .dshMobName .dshMobNameTop,
  html.${HTML_CLASS} .dshMobName .dshMobNameBottom {
    display: block !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
    text-align: left !important;
    line-height: 1.18 !important;
  }
  /* Relation prefix (parent index + own index), e.g. "BC" — pinned to the left
     of the two-line name and never shrinkable. */
  html.${HTML_CLASS} .dshMobPrefix {
    flex: none !important;
    align-self: flex-start !important;
    margin-right: 5px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums !important;
    letter-spacing: 0.5px !important;
    line-height: 1.18 !important;
    white-space: nowrap !important;
  }
  /* Expanded subagent list item: hide the first "You have joined the team"
     user-prompt description block so the two-line name owns the row. The effect
     tags the block with this class. */
  html.${HTML_CLASS} .dshMobJoinedHide {
    display: none !important;
  }

  /* --- Model edit page compact (mobile) --- */
  html.${HTML_CLASS} [aria-modal="true"] [class*="zGbnIq_rowCard"],
  html.${HTML_CLASS} [class*="zGbnIq_rowCard"] {
    padding: 8px 10px !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_rowHead"] {
    padding: 0 !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_rowName"] {
    font-size: 13px !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_editor"] {
    padding: 8px 10px !important;
    gap: 8px !important;
    margin-top: 4px !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_editor"] [class*="_field"] {
    margin-bottom: 6px !important;
    gap: 4px !important;
  }
  /* Field boxes tightened (narrower height/padding) while keeping font >=16px
     so a tap never triggers iOS focus-zoom. */
  html.${HTML_CLASS} [class*="zGbnIq_input"] {
    width: 100% !important;
    max-width: 100% !important;
    height: 34px !important;
    min-height: 34px !important;
    padding: 0 9px !important;
    font-size: 16px !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_customizedSummary"] {
    font-size: 12px !important;
    padding: 2px 4px !important;
  }
  html.${HTML_CLASS} [class*="zGbnIq_addModelButton"],
  html.${HTML_CLASS} [class*="zGbnIq_linkButton"] {
    padding: 4px 8px !important;
    font-size: 12px !important;
    min-height: 28px !important;
  }

  /* --- Agent preset card fixes (mobile) --- */
  /* Long-press must not start a native text selection / copy drag on the card. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cardMain"],
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cardHead"],
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cardDesc"],
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cardId"] {
    user-select: none !important;
    -webkit-user-select: none !important;
    -webkit-touch-callout: none !important;
    cursor: default !important;
  }
  /* The description scrolls directly with an up-swipe instead of entering text
     selection. Later + equal specificity to the 2-line clamp rule so it wins. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cardDesc"] {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y !important;
    -webkit-line-clamp: unset !important;
    display: block !important;
    max-height: 60px !important;
    overscroll-behavior: contain !important;
  }
  /* Foot icon buttons (查看/打开目录/复制) get a large hit area + no tap block. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cardFoot"] [class*="_iconButton"] {
    min-width: 40px !important;
    min-height: 40px !important;
    margin: 2px !important;
    padding: 0 !important;
    touch-action: manipulation !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  /* --- Appearance custom themes (mobile) --- */
  /* Replace the native 浅色/深色/跟随系统 cubes with a 3-button toolbar
     (浅深切换 / 跟随系统 / 自定义). They still drive the host state, so the app
     keeps its own aria-pressed + persistence; we only hide the visual cubes. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cubeRow"] [class*="_themeCube"] {
    display: none !important;
  }
  html.${HTML_CLASS} .dshMobThemeBar {
    display: flex !important;
    flex: 1 1 100% !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    width: 100% !important;
  }
  html.${HTML_CLASS} .dshMobThemeBtn {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    appearance: none !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 12px !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    font-size: 12.5px !important;
    line-height: 1.25 !important;
    text-align: center !important;
    padding: 11px 6px !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent !important;
    touch-action: manipulation !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobThemeBtn[data-active="true"] {
    border-color: var(--dsw-static-deepseek-500, #4176e6) !important;
    box-shadow: inset 0 0 0 1.5px var(--dsw-static-deepseek-500, #4176e6) !important;
    color: var(--dsw-static-deepseek-500, #4176e6) !important;
    font-weight: 700 !important;
  }

  /* The 自定义 theme card: a centered sheet with the 3 brand palettes + palette. */
  html.${HTML_CLASS} .dshMobThemeCard {
    position: fixed !important;
    inset: 0 !important;
    z-index: 2200 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 16px !important;
    box-sizing: border-box !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
  }
  html.${HTML_CLASS} .dshMobThemeCardSheet {
    width: 100% !important;
    max-width: 360px !important;
    max-height: min(86vh, 86dvh) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 16px !important;
    padding: 16px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }
  html.${HTML_CLASS} .dshMobThemeTitle {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
  }
  html.${HTML_CLASS} .dshMobThemeGrid {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} .dshMobThemeItem {
    flex: 1 1 calc(33.33% - 6px) !important;
    min-width: 0 !important;
    appearance: none !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 6px !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 12px !important;
    background: var(--dsw-alias-bg-base, #fff) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    padding: 10px 4px !important;
    cursor: pointer !important;
  }
  html.${HTML_CLASS} .dshMobThemeItem[data-active="true"] {
    border-color: var(--dsw-static-deepseek-500, #4176e6) !important;
    box-shadow: inset 0 0 0 1.5px var(--dsw-static-deepseek-500, #4176e6) !important;
  }
  html.${HTML_CLASS} .dshMobThemeItemSwatch {
    width: 26px !important;
    height: 26px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(0,0,0,.15) !important;
  }
  html.${HTML_CLASS} .dshMobThemeItemLabel {
    font-size: 12px !important;
    line-height: 1.2 !important;
    text-align: center !important;
  }
  html.${HTML_CLASS} .dshMobThemeSub {
    font-size: 12.5px !important;
    font-weight: 600 !important;
    color: var(--dsw-alias-label-secondary, #61666b) !important;
  }
  html.${HTML_CLASS} .dshMobThemeSwatches {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} .dshMobThemeSwatch {
    width: 30px !important;
    height: 30px !important;
    border-radius: 9px !important;
    appearance: none !important;
    border: 1px solid rgba(0,0,0,.15) !important;
    cursor: pointer !important;
    padding: 0 !important;
  }
  html.${HTML_CLASS} .dshMobThemeSwatch[data-active="true"] {
    box-shadow: 0 0 0 2px var(--dsw-alias-bg-base, #fff), 0 0 0 4px var(--dsw-static-deepseek-500, #4176e6) !important;
  }
  html.${HTML_CLASS} .dshMobThemeColor {
    width: 30px !important;
    height: 30px !important;
    border-radius: 9px !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    padding: 0 !important;
    appearance: none !important;
    background: none !important;
    cursor: pointer !important;
  }
  html.${HTML_CLASS} .dshMobThemeClose {
    appearance: none !important;
    align-self: flex-end !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 10px !important;
    background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    font-size: 13px !important;
    padding: 8px 16px !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
  }

  /* Brand palettes: override the host --dsw-* tokens so the whole mobile UI
     takes the theme. The accent reads var(--dsh-mob-primary, <theme accent>) so
     the 调色板 can override just the primary. Applied to body (both light and dark)
     via a higher-specificity selector, scoped to html.dsh-mobile-shell. */
  html.${HTML_CLASS}[data-dsh-mob-theme="qq"] body {
    --dsw-static-deepseek-500: var(--dsh-mob-primary, #12B7F5);
    --dsw-static-deepseek-450: var(--dsh-mob-primary, #12B7F5);
    --dsw-static-deepseek-400: #3ecdf8;
    --dsw-static-deepseek-600: #0da0d5;
    --dsw-static-deepseek-50: #eaf8ff;
    --dsw-static-deepseek-100: #d6f1fe;
    --dsw-static-deepseek-200: #b3e7fc;
    --dsw-static-neutral-bluish-00: #ffffff;
    --dsw-static-neutral-bluish-50: #f8fcff;
    --dsw-static-neutral-bluish-60: #f3fafe;
    --dsw-static-neutral-bluish-100: #e6f4fc;
    --dsw-static-neutral-bluish-150: #d8edf9;
    --dsw-alias-bg-base: #ffffff;
    --dsw-alias-bg-layer-1: #ffffff;
    --dsw-alias-bg-layer-2: #ffffff;
    --dsw-alias-bg-layer-3: #ffffff;
  }
  html.${HTML_CLASS}[data-dsh-mob-theme="wechat"] body {
    --dsw-static-deepseek-500: var(--dsh-mob-primary, #95EC69);
    --dsw-static-deepseek-450: var(--dsh-mob-primary, #95EC69);
    --dsw-static-deepseek-400: #a9f085;
    --dsw-static-deepseek-600: #6fce43;
    --dsw-static-deepseek-50: #f0fbe6;
    --dsw-static-deepseek-100: #e3f7d3;
    --dsw-static-deepseek-200: #cdf0b1;
    --dsw-static-neutral-bluish-00: #ededed;
    --dsw-static-neutral-bluish-50: #f0f0f0;
    --dsw-static-neutral-bluish-60: #f4f4f4;
    --dsw-static-neutral-bluish-100: #e4e4e4;
    --dsw-static-neutral-bluish-150: #d8d8d8;
    --dsw-alias-bg-base: #ededed;
    --dsw-alias-bg-layer-1: #ededed;
    --dsw-alias-bg-layer-2: #f3f3f3;
    --dsw-alias-bg-layer-3: #f6f6f6;
    --dsw-alias-label-primary: #2b2b2b;
    --dsw-alias-label-secondary: #4a4a4a;
  }
  html.${HTML_CLASS}[data-dsh-mob-theme="bili"] body {
    --dsw-static-deepseek-500: var(--dsh-mob-primary, #FB7299);
    --dsw-static-deepseek-450: var(--dsh-mob-primary, #FB7299);
    --dsw-static-deepseek-400: #fc93b2;
    --dsw-static-deepseek-600: #e85c86;
    --dsw-static-deepseek-50: #fdedf2;
    --dsw-static-deepseek-100: #fcdbe5;
    --dsw-static-deepseek-200: #f9bccd;
    --dsw-static-neutral-bluish-00: #ffffff;
    --dsw-static-neutral-bluish-50: #fff9fb;
    --dsw-static-neutral-bluish-60: #fff5f8;
    --dsw-static-neutral-bluish-100: #fdeaef;
    --dsw-static-neutral-bluish-150: #fadde6;
    --dsw-alias-bg-base: #ffffff;
    --dsw-alias-bg-layer-1: #ffffff;
    --dsw-alias-bg-layer-2: #ffffff;
    --dsw-alias-bg-layer-3: #ffffff;
  }
  html.${HTML_CLASS}[data-dsh-mob-theme="custom"] body {
    --dsw-static-deepseek-500: var(--dsh-mob-primary, #12B7F5);
    --dsw-static-deepseek-450: var(--dsh-mob-primary, #12B7F5);
    --dsw-static-deepseek-50: #eaf8ff;
    --dsw-static-deepseek-100: #d6f1fe;
    --dsw-static-neutral-bluish-00: #ffffff;
    --dsw-static-neutral-bluish-50: #f8fcff;
    --dsw-static-neutral-bluish-100: #e6f4fc;
  }
}

.dshMobMenu {
  position: fixed;
  z-index: 60;
  top: calc(10px + env(safe-area-inset-top, 0px));
  left: calc(10px + env(safe-area-inset-left, 0px));
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
  background: var(--dsw-alias-button-floating-fill, #fff);
  color: var(--dsw-alias-label-primary, #0f1115);
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  user-select: none;
}
.dshMobMenu:active {
  background: var(--dsw-alias-button-floating-hover, #f3f4f6);
}
.dshMobMenu svg {
  width: 22px;
  height: auto;
  display: block;
}
.dshMobMenu[data-flash="true"] {
  border-color: var(--dsw-alias-label-primary, #0f1115);
  opacity: 0.55;
}

.dshMobBackdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  border: 0;
  margin: 0;
  padding: 0;
  background: rgba(15, 17, 21, 0.4);
  display: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media ${MOBILE_MQ} {
  .dshMobMenu[data-visible="true"] {
    display: inline-flex;
  }
  .dshMobBackdrop[data-visible="true"] {
    display: block;
  }
}

/* Settings card entrance (mobile): fade + slight rise/scale, so the dialog
   reads as a sheet instead of snapping in (the official dialog mounts with
   no animation at all). */
@keyframes dsh-webui-sheet-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes dsh-webui-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  html.${HTML_CLASS} .${SETTINGS.panel},
  html.${HTML_CLASS} .${SETTINGS.overlay} {
    animation: none !important;
  }
}

/* --- Pinch zoom + reflow + FAB long-press function card (mobile) --- */
@media ${MOBILE_MQ} {
  /* --dsh-mob-font-zoom scales the chat readable text so it RE-WRAPS (true
     reflow, not a raster/transform scale). --dsh-mob-page-zoom scales the page.
     Pinch drives the font zoom; the FAB long-press card drives both. Zoom=1 is
     the default, so the base sizes resolve to DSH's normal values. */
  html.${HTML_CLASS} {
    --dsh-mob-font-zoom: 1;
    --dsh-mob-page-zoom: 1;
    --dsh-mob-font-base: 14px;
    font-size: calc(16px * var(--dsh-mob-page-zoom, 1)) !important;
  }
  /* Chat body text reflows with the font zoom: scaling the message wrappers AND
     their bare text leaves changes wrapping/line count (not a transform). */
  html.${HTML_CLASS} .${CLS.chatScroll},
  html.${HTML_CLASS} .${CLS.chatScroll} [class*="_bubble"],
  html.${HTML_CLASS} .${CLS.chatScroll} [class*="_content"],
  html.${HTML_CLASS} .${CLS.chatScroll} [class*="_markdown"],
  html.${HTML_CLASS} .${CLS.chatScroll} [class*="_text"] {
    font-size: calc(var(--dsh-mob-font-base, 14px) * var(--dsh-mob-font-zoom, 1)) !important;
    line-height: 1.55 !important;
  }
  html.${HTML_CLASS} .${CLS.chatScroll} p,
  html.${HTML_CLASS} .${CLS.chatScroll} li,
  html.${HTML_CLASS} .${CLS.chatScroll} pre,
  html.${HTML_CLASS} .${CLS.chatScroll} code {
    font-size: inherit !important;
  }

  /* FAB long-press function card: centered sheet with 字体大小/页面大小 zoom
     controls (－/＋/↺). Modeled on the custom-theme card, z-index above the FAB
     and backdrop so it floats above everything in mobile. */
  html.${HTML_CLASS} .dshMobZoomCard {
    position: fixed !important;
    inset: 0 !important;
    z-index: 2300 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 16px !important;
    box-sizing: border-box !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
  }
  html.${HTML_CLASS} .dshMobZoomSheet {
    width: 100% !important;
    max-width: 340px !important;
    box-sizing: border-box !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 16px !important;
    padding: 16px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
  }
  html.${HTML_CLASS} .dshMobZoomTitle {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
  }
  html.${HTML_CLASS} .dshMobZoomRow {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
  }
  html.${HTML_CLASS} .dshMobZoomLabel {
    font-size: 13px !important;
    color: var(--dsw-alias-label-secondary, #61666b) !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  html.${HTML_CLASS} .dshMobZoomCtl {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} .dshMobZoomBtn {
    width: 40px !important;
    height: 40px !important;
    appearance: none !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 12px !important;
    background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    font-size: 18px !important;
    line-height: 1 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent !important;
    touch-action: manipulation !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobZoomBtn:active {
    background: var(--dsw-alias-button-floating-hover, #f3f4f6) !important;
  }
  html.${HTML_CLASS} .dshMobZoomVal {
    min-width: 46px !important;
    text-align: center !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    font-variant-numeric: tabular-nums !important;
  }
  html.${HTML_CLASS} .dshMobZoomClose {
    appearance: none !important;
    align-self: flex-end !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 10px !important;
    background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important;
    font-size: 13px !important;
    padding: 8px 16px !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
  }
}
`

    function scrubLegacy() {
      if (typeof document === 'undefined') return
      for (const old of document.querySelectorAll('style[data-plugin="dsh-webui-mobile"]')) old.remove()
      const html = document.documentElement
      html.removeAttribute(ATTR_DETAILS)
      html.removeAttribute('data-dsh-mobile-chrome-menu')
      html.removeAttribute('data-dsh-mobile-overlay')
      for (const el of document.querySelectorAll(
        '[data-dsh-mobile-frame],[data-dsh-mobile-sidebar],[data-dsh-mobile-center],[data-dsh-mobile-details]',
      )) {
        el.removeAttribute('data-dsh-mobile-frame')
        el.removeAttribute('data-dsh-mobile-sidebar')
        el.removeAttribute('data-dsh-mobile-center')
        el.removeAttribute('data-dsh-mobile-details')
      }
    }

    function ensureStyle() {
      if (typeof document === 'undefined') return
      scrubLegacy()
      if (shellDisabled()) {
        document.documentElement.classList.remove(HTML_CLASS)
        return
      }
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-webui-mobile'
      tag.dataset.pluginCss = STYLE_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function findFrame() {
      return (
        document.querySelector(`.${CLS.frame}`) ||
        document.querySelector('[data-shell-overlay]')?.parentElement ||
        null
      )
    }

    function findSidebar(frame) {
      return frame?.querySelector?.(`.${CLS.sidebar}`) || null
    }

    function getLayout(proxy) {
      return proxy?.__raw ?? proxy
    }

    function defaultFabPos() {
      return { left: 10, top: 10 }
    }

    function clampFabPos(left, top) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 375
      const vh = typeof window !== 'undefined' ? window.innerHeight : 667
      const maxX = Math.max(FAB_MARGIN, vw - FAB_SIZE - FAB_MARGIN)
      const maxY = Math.max(FAB_MARGIN, vh - FAB_SIZE - FAB_MARGIN)
      return {
        left: Math.min(maxX, Math.max(FAB_MARGIN, left)),
        top: Math.min(maxY, Math.max(FAB_MARGIN, top)),
      }
    }

    function readFabPos() {
      try {
        const raw = localStorage.getItem(FAB_POS_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (
          typeof parsed?.left !== 'number' ||
          typeof parsed?.top !== 'number' ||
          !Number.isFinite(parsed.left) ||
          !Number.isFinite(parsed.top)
        ) {
          return null
        }
        return clampFabPos(parsed.left, parsed.top)
      } catch (_) {
        return null
      }
    }

    function writeFabPos(pos) {
      try {
        localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos))
      } catch (_) {}
    }

    function useMobile() {
      const [mobile, setMobile] = React.useState(
        () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches && !shellDisabled(),
      )
      React.useEffect(() => {
        if (shellDisabled()) {
          setMobile(false)
          return
        }
        const mq = window.matchMedia(MOBILE_MQ)
        const update = () => setMobile(mq.matches && !shellDisabled())
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
      }, [])
      return mobile
    }

    // Exact DSH FishLogo path (from @deepseek-ai/dsh-client-ui-primitives) — inline only
    const FISH_LOGO_PATH =
      'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z'

    function IconFishLogo() {
      return jsx('svg', {
        viewBox: '0 0 23.16 17.04',
        width: 22,
        height: (22 * 17.04) / 23.16,
        fill: 'none',
        'aria-hidden': true,
        children: jsx('path', {
          d: FISH_LOGO_PATH,
          fill: 'currentColor',
        }),
      })
    }

    function classifyStatsGroup(text) {
      const t = String(text || '')
      if ((/轮/.test(t) && /步/.test(t)) || (/turns?/i.test(t) && /steps?/i.test(t))) return 'counts'
      if (/LLM|工具调用|Tool call/i.test(t)) return 'durations'
      if (/TTFT|tok\/s|首 token/i.test(t)) return 'speeds'
      if (/缓存命中|Cache hit/i.test(t)) return 'cacheHit'
      if ((/输入/.test(t) && /输出/.test(t)) || (/Input/i.test(t) && /Output/i.test(t))) return 'tokens'
      return null
    }

    function tagStatsRoot(root) {
      if (!(root instanceof Element)) return
      const groupSpans = Array.from(root.children).filter(
        (el) =>
          el.tagName === 'SPAN' &&
          !el.classList.contains(STATS.sep) &&
          !el.hasAttribute('data-dsh-stats-break'),
      )
      let cacheHitEl = null
      let tokensEl = null
      for (const span of groupSpans) {
        const kind = classifyStatsGroup(span.textContent)
        if (!kind) continue
        if (span.getAttribute('data-dsh-stats') !== kind) {
          span.setAttribute('data-dsh-stats', kind)
        }
        if (kind === 'speeds') {
          const prev = span.previousElementSibling
          const next = span.nextElementSibling
          if (prev?.classList?.contains(STATS.sep) && prev.getAttribute('data-dsh-stats') !== 'sep-hide') {
            prev.setAttribute('data-dsh-stats', 'sep-hide')
          }
          if (next?.classList?.contains(STATS.sep) && next.getAttribute('data-dsh-stats') !== 'sep-hide') {
            next.setAttribute('data-dsh-stats', 'sep-hide')
          }
        } else if (kind === 'cacheHit') {
          cacheHitEl = span
        } else if (kind === 'tokens') {
          tokensEl = span
        }
      }
      const breakTarget = cacheHitEl || tokensEl
      const existingBreaks = Array.from(root.querySelectorAll('[data-dsh-stats-break]'))
      if (!breakTarget) {
        if (existingBreaks.length > 0) {
          for (const b of existingBreaks) b.remove()
        }
        return
      }
      let breakEl = existingBreaks[0] || null
      for (let i = 1; i < existingBreaks.length; i++) existingBreaks[i].remove()
      if (!breakEl) {
        breakEl = document.createElement('span')
        breakEl.setAttribute('data-dsh-stats-break', '')
        breakEl.setAttribute('aria-hidden', 'true')
      }
      if (breakEl.nextElementSibling !== breakTarget) {
        root.insertBefore(breakEl, breakTarget)
      }
    }

    function tagAllStatsRoots() {
      if (!document.documentElement.classList.contains(HTML_CLASS)) return
      for (const root of document.querySelectorAll(`.${STATS.root}`)) {
        tagStatsRoot(root)
      }
    }

    function MobileChrome({ getLayout: getLayoutFn }) {
      const mobile = useMobile()
      const [frame, setFrame] = React.useState(null)
      const [sidebarEl, setSidebarEl] = React.useState(null)
      const [collapsed, setCollapsed] = React.useState(true)
      const [detailsOpen, setDetailsOpen] = React.useState(false)
      const [fabPos, setFabPos] = React.useState(() => readFabPos())
      const getLayoutRef = React.useRef(getLayoutFn)
      getLayoutRef.current = getLayoutFn
      const ignoreBackdropClickUntil = React.useRef(0)
      const fabBtnRef = React.useRef(null)
      const fabDragRef = React.useRef({
        active: false,
        dragging: false,
        draggedThisGesture: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originLeft: 0,
        originTop: 0,
        offsetX: 0,
        offsetY: 0,
        lastLeft: 0,
        lastTop: 0,
      })

      // The button's idle position is owned by React's `style` prop (fabStyle),
      // and imperative left/top writes happen only during an active drag for
      // smooth finger-follow. After commit, React re-renders `style={{left,top}}`
      // from fabPos, so there is nothing to clear — clearing here would wipe the
      // committed position and make the FAB snap back to its CSS default.

      const withLayout = React.useCallback((fn) => {
        try {
          const layout = getLayout(getLayoutRef.current?.())
          if (!layout) return
          return fn(layout)
        } catch (err) {
          console.warn('[dsh-webui-mobile] layout', err)
        }
      }, [])

      const openSidebar = React.useCallback(() => {
        const layout = getLayout(getLayoutRef.current?.())
        if (!layout?.toggleSidebar) {
          console.warn('[dsh-webui-mobile] toggleSidebar unavailable')
          const btn = fabBtnRef.current
          if (btn) {
            btn.setAttribute('data-flash', 'true')
            window.setTimeout(() => btn.removeAttribute('data-flash'), 200)
          }
          return
        }
        // The FAB is only rendered while collapsed, so a straight toggle here
        // opens the drawer. Avoid gating on the frame's data-sidebar-collapsed
        // attribute, whose state can lag React and silently no-op the tap.
        layout.toggleSidebar()
      }, [])

      const toggleSidebar = React.useCallback(() => {
        withLayout((layout) => layout.toggleSidebar?.())
      }, [withLayout])

      const closeDetails = React.useCallback(() => {
        withLayout((layout) => layout.closeDetails?.())
        document.documentElement.removeAttribute(ATTR_DETAILS)
        setDetailsOpen(false)
      }, [withLayout])

      const onClose = React.useCallback(() => {
        if (detailsOpen || document.documentElement.hasAttribute(ATTR_DETAILS)) closeDetails()
        else toggleSidebar()
      }, [detailsOpen, closeDetails, toggleSidebar])

      React.useEffect(() => {
        ensureStyle()
        if (!mobile) {
          document.documentElement.classList.remove(HTML_CLASS)
          document.documentElement.removeAttribute(ATTR_DETAILS)
          setFrame(null)
          setSidebarEl(null)
          setDetailsOpen(false)
          return
        }
        document.documentElement.classList.add(HTML_CLASS)
        document.documentElement.removeAttribute(ATTR_DETAILS)

        let raf = 0
        let bodyObs = null
        let alive = true

        const sync = () => {
          if (!alive) return
          const f = findFrame()
          if (!f) return
          const side = findSidebar(f)
          setFrame((prev) => (prev === f ? prev : f))
          setSidebarEl((prev) => (prev === side ? prev : side))
          // Canary after paint: center must occupy the 1fr track
          requestAnimationFrame(() => {
            if (!alive) return
            const center = f.querySelector(`.${CLS.center}`)
            if (
              center &&
              center.clientWidth === 0 &&
              document.documentElement.classList.contains(HTML_CLASS)
            ) {
              console.warn('[dsh-webui-mobile] center width 0 — grid placement failed')
              document.documentElement.classList.remove(HTML_CLASS)
            }
          })
          bodyObs?.disconnect()
          bodyObs = null
        }

        const schedule = () => {
          if (raf) return
          raf = requestAnimationFrame(() => {
            raf = 0
            sync()
          })
        }

        sync()
        if (!findFrame()) {
          bodyObs = new MutationObserver(schedule)
          bodyObs.observe(document.body, { childList: true, subtree: true })
        }

        return () => {
          alive = false
          if (raf) cancelAnimationFrame(raf)
          bodyObs?.disconnect()
          document.documentElement.classList.remove(HTML_CLASS)
          document.documentElement.removeAttribute(ATTR_DETAILS)
        }
      }, [mobile])

      // Suppress programmatic input focus on mobile: switching sessions fires
      // an el.focus() in the conversation InputBar, which pops the soft keyboard.
      // We only let focus through when the user actually tapped the composer.
      React.useEffect(() => {
        if (!mobile) return
        let userTapAt = 0
        const onPointerDown = (e) => {
          const t = e.target
          if (t instanceof Element && t.closest('textarea, input, [data-input-mirror], [contenteditable="true"]')) {
            userTapAt = Date.now()
          }
        }
        const onFocusIn = (e) => {
          const t = e.target
          if (!(t instanceof Element)) return
          const isComposer = t.closest('textarea, input[type="text"], input:not([type]), [contenteditable="true"]')
          if (!isComposer) return
          // A focus within ~600ms of a real tap is user-intended — allow it.
          if (Date.now() - userTapAt < 600) return
          // Otherwise it is programmatic (session switch) — blur to keep the
          // keyboard closed.
          if (typeof t.blur === 'function') t.blur()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('touchstart', onPointerDown, { capture: true, passive: true })
        document.addEventListener('focusin', onFocusIn, true)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('touchstart', onPointerDown, true)
          document.removeEventListener('focusin', onFocusIn, true)
        }
      }, [mobile])

      // Mobile-only infinite scroll: when the reader scrolls the chat column to
      // the top and a "load earlier" page exists, click the (still-rendered)
      // "加载更早" button instead of requiring a manual tap. Desktop is untouched
      // — this lives entirely in the mobile shell plugin.
      React.useEffect(() => {
        if (!mobile) return
        let lastTapAt = 0
        let raf = 0
        const tick = () => {
          raf = 0
          const scroller = document.querySelector(`.${CLS.chatScroll}`) || document.querySelector('[data-conversation-scroll]')
          if (!scroller) return
          const el = scroller.scrollHeight > scroller.clientHeight ? scroller : null
          if (!el) return
          const older = scroller.querySelector(`.${CLS.chatOlder} button`)
          if (!older || older.disabled) return
          if (el.scrollTop <= 40) {
            const now = Date.now()
            if (now - lastTapAt < 500) return
            lastTapAt = now
            older.click()
          }
        }
        const onScroll = (e) => {
          const t = e.target
          if (!(t instanceof Element)) return
          if (t.classList?.contains(CLS.chatScroll) || t.closest?.('[data-conversation-scroll]')) {
            if (!raf) raf = requestAnimationFrame(tick)
          }
        }
        document.addEventListener('scroll', onScroll, { capture: true, passive: true })
        return () => {
          document.removeEventListener('scroll', onScroll, true)
          if (raf) cancelAnimationFrame(raf)
        }
      }, [mobile])

      // StatsLine Option A — tag groups + insert flex break (mobile shell only)
      React.useEffect(() => {
        if (!mobile || shellDisabled()) return
        let raf = 0
        const schedule = () => {
          if (raf) return
          raf = requestAnimationFrame(() => {
            raf = 0
            tagAllStatsRoots()
          })
        }
        schedule()
        const obs = new MutationObserver(schedule)
        // NOTE: observe childList only (new nodes), NOT characterData. Streams
        // mutate text on every token while loading history / generating, which
        // would re-scan all stat roots hundreds of times and slow the phone.
        obs.observe(document.body, { childList: true, subtree: true })
        return () => {
          if (raf) cancelAnimationFrame(raf)
          obs.disconnect()
        }
      }, [mobile])

      React.useEffect(() => {
        if (!mobile) return
        let cancelled = false
        let patched = null
        let tries = 0
        let timer = 0

        const tryPatch = () => {
          if (cancelled) return
          const layout = getLayout(getLayoutRef.current?.())
          if (!layout || typeof layout.openDetails !== 'function' || typeof layout.closeDetails !== 'function') {
            if (tries++ < 40) timer = window.setTimeout(tryPatch, 100)
            return
          }
          if (layout.__dshMobileHanuiPatched) {
            patched = layout
            return
          }

          const origOpen = layout.openDetails.bind(layout)
          const origClose = layout.closeDetails.bind(layout)

          layout.openDetails = (...args) => {
            try {
              origOpen(...args)
              document.documentElement.setAttribute(ATTR_DETAILS, '')
              setDetailsOpen(true)
              const f = findFrame()
              if (f && !f.hasAttribute('data-sidebar-collapsed')) layout.toggleSidebar?.()
            } catch (err) {
              console.warn('[dsh-webui-mobile] openDetails', err)
              document.documentElement.removeAttribute(ATTR_DETAILS)
              setDetailsOpen(false)
            }
          }

          layout.closeDetails = (...args) => {
            try {
              origClose(...args)
            } catch (err) {
              console.warn('[dsh-webui-mobile] closeDetails', err)
            }
            document.documentElement.removeAttribute(ATTR_DETAILS)
            setDetailsOpen(false)
          }

          layout.__dshMobileHanuiPatched = true
          layout.__dshMobileHanuiOrigOpen = origOpen
          layout.__dshMobileHanuiOrigClose = origClose
          patched = layout
        }

        tryPatch()

        return () => {
          cancelled = true
          if (timer) window.clearTimeout(timer)
          if (patched?.__dshMobileHanuiPatched) {
            patched.openDetails = patched.__dshMobileHanuiOrigOpen
            patched.closeDetails = patched.__dshMobileHanuiOrigClose
            delete patched.__dshMobileHanuiPatched
            delete patched.__dshMobileHanuiOrigOpen
            delete patched.__dshMobileHanuiOrigClose
          }
          document.documentElement.removeAttribute(ATTR_DETAILS)
          setDetailsOpen(false)
        }
      }, [mobile])

      React.useEffect(() => {
        if (!frame) return
        const read = () => setCollapsed(frame.hasAttribute('data-sidebar-collapsed'))
        read()
        const obs = new MutationObserver(read)
        obs.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
        return () => obs.disconnect()
      }, [frame])

      // Swipe-left on visible backdrop → same onClose as backdrop click. No swipe-open.
      React.useEffect(() => {
        if (!mobile) return
        let startX = 0
        let startY = 0
        let mode = null // 'close' | null
        let aborted = false

        const onStart = (e) => {
          const backdrop = document.querySelector('.dshMobBackdrop[data-visible="true"]')
          if (!backdrop) {
            mode = null
            return
          }
          const t = e.touches?.[0]
          if (!t) return
          const target = e.target
          const onBackdrop =
            target === backdrop || (target instanceof Element && backdrop.contains(target))
          if (!onBackdrop) {
            mode = null
            return
          }
          startX = t.clientX
          startY = t.clientY
          aborted = false
          mode = 'close'
        }

        const onMove = (e) => {
          if (!mode || aborted) return
          const t = e.touches?.[0]
          if (!t) return
          const dx = t.clientX - startX
          const dy = t.clientY - startY
          if (Math.abs(dx) < SWIPE_AXIS_LOCK && Math.abs(dy) < SWIPE_AXIS_LOCK) return
          if (Math.abs(dy) > Math.abs(dx)) {
            aborted = true
            mode = null
          }
        }

        const onEnd = (e) => {
          if (!mode || aborted) {
            mode = null
            aborted = false
            return
          }
          mode = null
          const t = e.changedTouches?.[0]
          if (!t) return
          const dx = t.clientX - startX
          const dy = t.clientY - startY
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            ignoreBackdropClickUntil.current = Date.now() + 300
          }
          if (dx > -SWIPE_DX_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_DX_DY) return
          ignoreBackdropClickUntil.current = Date.now() + 300
          onClose()
        }

        window.addEventListener('touchstart', onStart, { passive: true })
        window.addEventListener('touchmove', onMove, { passive: true })
        window.addEventListener('touchend', onEnd, { passive: true })
        window.addEventListener('touchcancel', onEnd, { passive: true })
        return () => {
          window.removeEventListener('touchstart', onStart)
          window.removeEventListener('touchmove', onMove)
          window.removeEventListener('touchend', onEnd)
          window.removeEventListener('touchcancel', onEnd)
        }
      }, [mobile, onClose])

      // Re-clamp FAB on viewport changes
      React.useEffect(() => {
        if (!mobile) return
        const reclamp = () => {
          setFabPos((prev) => {
            if (!prev) return prev
            const next = clampFabPos(prev.left, prev.top)
            if (next.left !== prev.left || next.top !== prev.top) {
              writeFabPos(next)
              return next
            }
            return prev
          })
        }
        window.addEventListener('resize', reclamp)
        window.addEventListener('orientationchange', reclamp)
        const vv = window.visualViewport
        vv?.addEventListener?.('resize', reclamp)
        return () => {
          window.removeEventListener('resize', reclamp)
          window.removeEventListener('orientationchange', reclamp)
          vv?.removeEventListener?.('resize', reclamp)
        }
      }, [mobile])

      React.useEffect(() => {
        if (!mobile || !sidebarEl || !frame) return
        const onClick = (e) => {
          if (frame.hasAttribute('data-sidebar-collapsed')) return
          const t = e.target
          if (!(t instanceof Element)) return
          // Row action menus / folder chrome — don't close
          if (t.closest(`.${SIDEBAR_ROW.rowActions}, .${SIDEBAR_ROW.iconButton}, input, textarea, select`)) {
            return
          }
          // Workspace section-header controls (search view, view options, add
          // workspace) open sub-views / menus inside the drawer — keep it open.
          // The "expand remaining sessions" overflow button also belongs here:
          // tapping it only reveals more sessions in place, so it must NOT
          // collapse the drawer (previously the generic "actionable" branch
          // closed it → the drawer flashed back / "返回效果").
          if (t.closest(`.${WS_HDR.sectionHeader}, .${WS_HDR.search}, .${WS_HDR.searchButton}, .${WS_HDR.searchInput}, .${WS_HDR.clearButton}, .${WS_HDR.iconButton}, .${WS_HDR.sessionOverflow}`)) {
            return
          }
          // Session rows are div[role=treeitem].YDXeBa_sessionRow (not <button>)
          const sessionHit = t.closest(`.${SIDEBAR_ROW.session}, .${SIDEBAR_ROW.search}`)
          if (sessionHit) {
            const closeIfOpen = () => {
              if (!frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
            }
            window.setTimeout(closeIfOpen, 140)
            window.setTimeout(closeIfOpen, 280)
            return
          }
          // Other nav (new chat, settings, …) — skip project/folder expand rows
          if (t.closest(`.${SIDEBAR_ROW.project}`)) return
          // The settings trigger opens a full-screen overlay that is portaled
          // into the sidebar DOM; with the drawer's transform:none the overlay
          // is viewport-anchored, so keeping the drawer open is fine (and
          // avoids the "settings flashes then disappears" bug).
          if (t.closest(`.${SETTINGS.overlay}, .${SETTINGS.trigger}`)) return
          const actionable = t.closest(
            'button, a, [role="button"], [role="option"], [role="menuitem"], li, [data-session-id], [data-conversation-id]',
          )
          if (!actionable) return
          const closeIfOpen = () => {
            if (!frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
          }
          window.setTimeout(closeIfOpen, 140)
          window.setTimeout(closeIfOpen, 280)
        }
        sidebarEl.addEventListener('click', onClick, true)
        return () => sidebarEl.removeEventListener('click', onClick, true)
      }, [mobile, sidebarEl, frame, toggleSidebar])

      React.useEffect(() => {
        if (!mobile) return
        const onKey = (e) => {
          if (e.key !== 'Escape') return
          if (document.documentElement.hasAttribute(ATTR_DETAILS)) {
            closeDetails()
            return
          }
          if (frame && !frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [mobile, frame, toggleSidebar, closeDetails])

      const onFabPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const left = fabPos?.left ?? rect.left
        const top = fabPos?.top ?? rect.top
        fabDragRef.current = {
          active: true,
          dragging: false,
          draggedThisGesture: false,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originLeft: left,
          originTop: top,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          lastLeft: left,
          lastTop: top,
        }
        el.setAttribute('data-dragging', 'true')
        // NOTE: do NOT setPointerCapture here — capture disrupts the native
        // click on mobile (iOS Safari / Android Chrome), so a clean tap would
        // never fire onClick (the sole open path). `touch-action: none` already
        // keeps the pointer tracked on the button during a drag without capture.
      }

      const onFabPointerMove = (e) => {
        const st = fabDragRef.current
        if (!st.active || st.pointerId !== e.pointerId) return
        const dx = e.clientX - st.startX
        const dy = e.clientY - st.startY
        if (!st.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        if (!st.dragging) {
          st.dragging = true
          st.draggedThisGesture = true
        }
        const next = clampFabPos(e.clientX - st.offsetX, e.clientY - st.offsetY)
        st.lastLeft = next.left
        st.lastTop = next.top
        const el = fabBtnRef.current || e.currentTarget
        if (el) {
          el.style.left = `${next.left}px`
          el.style.top = `${next.top}px`
          el.style.right = 'auto'
          el.style.bottom = 'auto'
        }
        // DO NOT call setFabPos here — React commit only on pointerup
      }

      const endFabPointer = (e) => {
        const st = fabDragRef.current
        if (!st.active || (e.pointerId != null && st.pointerId !== e.pointerId)) return
        const wasDragging = st.dragging
        st.active = false
        st.dragging = false
        st.pointerId = null
        const el = e.currentTarget
        el?.removeAttribute?.('data-dragging')
        if (wasDragging) {
          // Only a real drag must block the trailing click (done via
          // draggedThisGesture in onClick); commit the dragged position.
          const pos = clampFabPos(st.lastLeft, st.lastTop)
          writeFabPos(pos)
          setFabPos(pos) // React re-renders style={{left,top}}; no imperative clear
          return
        }
        // Clean tap: do NOT open here and do NOT suppress the click — the
        // button's onClick is the sole open path (avoids the pointerup/click
        // double-fire that hides the FAB mid-sequence and drops the open).
      }

      const onFabClick = (e) => {
        const st = fabDragRef.current
        if (st.draggedThisGesture) {
          // Just completed a drag in a prior gesture — swallow this click.
          e.preventDefault()
          e.stopPropagation()
          st.draggedThisGesture = false
          return
        }
        openSidebar()
      }

      if (!mobile) return null

      const sidebarOpen = !!frame && !collapsed
      const showMenu = !!frame && collapsed && !detailsOpen
      const showBackdrop = sidebarOpen || detailsOpen

      const fabStyle = fabPos
        ? { left: `${fabPos.left}px`, top: `${fabPos.top}px` }
        : undefined

      const onBackdropClick = () => {
        if (Date.now() < ignoreBackdropClickUntil.current) return
        onClose()
      }

      return jsxs(React.Fragment, {
        children: [
          jsx('button', {
            type: 'button',
            ref: fabBtnRef,
            className: 'dshMobMenu',
            'data-visible': showMenu ? 'true' : 'false',
            'aria-label': '打开菜单',
            style: fabStyle,
            onPointerDown: onFabPointerDown,
            onPointerMove: onFabPointerMove,
            onPointerUp: endFabPointer,
            onPointerCancel: endFabPointer,
            onClick: onFabClick,
            children: jsx(IconFishLogo, {}),
          }),
          jsx('button', {
            type: 'button',
            className: 'dshMobBackdrop',
            'data-visible': showBackdrop ? 'true' : 'false',
            'aria-label': '关闭面板',
            onClick: onBackdropClick,
          }),
        ],
      })
    }

    const inject = ['slots', 'layout']

    // Mobile image upload: a small "＋图片" button pinned to the composer card's
    // top-right corner (above the input, same side as the send button, roughly
    // half its size). It opens a hidden <input type=file accept="image/*"> so the
    // native phone gallery/camera chooser appears; picked files go straight into
    // the composer's existing, validated add-images pipeline via onAddImages.
    // The face is registered only while mobile is active (see apply), so the
    // desktop composer keeps the native attachment rail untouched.
    function MobileAttachBar(props) {
      const mobile = useMobile()
      const inputRef = React.useRef(null)
      const attachments = props?.attachments || []
      const onAddImages = props?.onAddImages
      const onRemoveImage = props?.onRemoveImage
      const pick = React.useCallback(() => {
        inputRef.current?.click()
      }, [])
      const onChange = React.useCallback((e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (files.length > 0 && typeof onAddImages === 'function') onAddImages(files)
      }, [onAddImages])
      if (!mobile) return null
      return jsx('div', {
        className: 'dshMobImg',
        'data-dsh-mobile-image': true,
        children: [
          attachments.length > 0
            ? jsx('div', {
                className: 'dshMobImg_chips',
                children: attachments.map((a) =>
                  jsx('span', {
                    className: 'dshMobImg_chip',
                    key: a.id,
                    children: [
                      jsx('img', { src: a.previewUrl, alt: a.file?.name || '图片' }),
                      jsx('button', {
                        type: 'button',
                        className: 'dshMobImg_del',
                        'aria-label': '移除图片',
                        onClick: () => {
                          if (typeof onRemoveImage === 'function') onRemoveImage(a.id)
                        },
                        children: '\u00d7',
                      }),
                    ],
                  }),
                ),
              })
            : null,
          jsx('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/*',
            multiple: true,
            hidden: true,
            'data-dsh-mobile-file': true,
            onChange,
          }),
          jsx('button', {
            type: 'button',
            className: 'dshMobImg_btn',
            'aria-label': '上传图片',
            title: '上传图片',
            onClick: pick,
            children: jsx('svg', {
              width: 16,
              height: 16,
              viewBox: '0 0 20 20',
              'aria-hidden': true,
              children: jsx('path', {
                d: 'M4 3h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5.5 5a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 9.5 8ZM5 13.4l3-3a.8.8 0 0 1 1.13 0l.4.4 1.9-1.9a.8.8 0 0 1 1.13 0L15.9 13a.6.6 0 0 1 .2.4H5a.6.6 0 0 1-.2-.4Z',
                fill: 'currentColor',
              }),
            }),
          }),
        ],
      })
    }

    // Shared guard for every DOM-level side effect: the plugin may only touch
    // the page while the phone layout is actually active (and not disabled via
    // ?mobileShell=0). Desktop must keep the native DSH DOM completely
    // untouched — CSS alone is not enough, because DOM rearrangement effects
    // registered at plugin level run in every viewport.
    function mobileDomAllowed() {
      try {
        if (typeof window === 'undefined' || !window.matchMedia) return false
        return window.matchMedia(MOBILE_MQ).matches && !shellDisabled()
      } catch (_) {
        return false
      }
    }

    // Move ONLY the settings dialog's close button (X) into its nav row so the
    // X sits at the top-right of the nav strip (the dsh-mobile-nav
    // "settings-toolbar-reparent" behavior). The header's other content (e.g. the
    // "open config file" action) stays in the body, so nothing clutters the nav.
    // Restore on close; the dialog DOM may be rebuilt by React, so refresh the
    // origin each time we move it. Guarded by mobileDomAllowed(): on desktop the
    // observer only ever restores, so the native two-column dialog keeps its X.
    function installSettingsHeaderReparent() {
      let origin = null
      const reparent = () => {
        if (!mobileDomAllowed()) {
          restore()
          return
        }
        const dialog = document.querySelector('[aria-modal="true"]')
        if (!dialog) return
        const nav = dialog.querySelector(':scope > [class*="_nav"]')
        const close = dialog.querySelector('[class*="_close"]')
        if (!nav || !close) return
        if (close.parentElement === nav) return
        if (close.parentElement) origin = { parent: close.parentElement, next: close.nextSibling }
        nav.appendChild(close)
      }
      const restore = () => {
        if (!origin) return
        const close = document.querySelector('[aria-modal="true"] [class*="_close"]')
        if (close && origin.parent.isConnected) origin.parent.insertBefore(close, origin.next)
        origin = null
      }
      if (typeof document === 'undefined' || !window.MutationObserver) return
      const observer = new MutationObserver(() => {
        if (document.querySelector('[aria-modal="true"]')) reparent()
        else restore()
      })
      observer.observe(document.body, { childList: true, subtree: true })
      // Crossing the breakpoint while a dialog is open must undo/redo the move.
      let mql = null
      const onMq = () => reparent()
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      return () => {
        observer.disconnect()
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
        restore()
      }
    }

    // The "open config file" header band above the tab content is hidden on
    // mobile (CSS); this effect injects a compact row at the end of the
    // General settings list that simply clicks the hidden original button, so
    // the action lives inside General settings instead of eating a full-width
    // band under the nav strip. Same mobile guard as the reparent effect.
    function installSettingsConfigRow() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      let row = null
      const disposeRow = () => {
        if (row && row.isConnected) row.remove()
        row = null
      }
      const ensureRow = () => {
        if (!mobileDomAllowed()) {
          disposeRow()
          return
        }
        const dialog = document.querySelector('[aria-modal="true"]')
        if (!dialog) {
          disposeRow()
          return
        }
        const options = dialog.querySelector('[class*="_options"]')
        // Only the General settings tab is a natural home for the action.
        if (!options || !/外观/.test(options.textContent || '')) {
          disposeRow()
          return
        }
        if (row && row.parentElement === options) return
        const original = dialog.querySelector('[class*="_header"] button')
        if (!original) return
        disposeRow()
        row = document.createElement('div')
        row.className = 'dshMobCfgRow'
        row.setAttribute('role', 'button')
        const label = document.createElement('span')
        label.textContent = '打开配置文件'
        const chev = document.createElement('span')
        chev.className = 'dshMobCfgRowChev'
        chev.textContent = '›'
        row.appendChild(label)
        row.appendChild(chev)
        row.addEventListener('click', () => original.click())
        options.appendChild(row)
      }
      const observer = new MutationObserver(ensureRow)
      observer.observe(document.body, { childList: true, subtree: true })
      let mql = null
      const onMq = () => ensureRow()
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      return () => {
        observer.disconnect()
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
        disposeRow()
      }
    }

    // v0.3.4 lifts the drawer above the body-level onboarding notice while the
    // settings overlay is open (a :has() rule pinning z-index to 1001). But
    // select/popup menus portal to the BODY as well, and on some DSH builds
    // their stacking layer sits BELOW 1001 — the lifted card then swallows the
    // menu and the control reads as dead on touch devices. While a body-level
    // portal popup is open, drop the drawer back to its base layer so the
    // popup always paints above it, whatever layer the host build uses.
    function installPopupZGuard() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      let lifted = false
      const release = () => {
        const drawer = document.querySelector('.' + CLS.sidebar)
        if (drawer && lifted) drawer.style.removeProperty('z-index')
        lifted = false
      }
      const update = () => {
        if (!mobileDomAllowed()) {
          release()
          return
        }
        if (!document.querySelector('[aria-modal="true"]')) {
          release()
          return
        }
        // Any body-level portal (popup menus portal outside the drawer)?
        let popupOpen = false
        for (const el of document.body.children) {
          if (el.id || el.tagName === 'SCRIPT') continue
          if (/_portal_/.test(String(el.className || ''))) {
            popupOpen = true
            break
          }
        }
        const drawer = document.querySelector('.' + CLS.sidebar)
        if (!drawer) return
        if (popupOpen) {
          if (!lifted) {
            // The :has() lift rule is !important, so a plain inline value
            // loses the cascade — only an inline !important beats it.
            drawer.style.setProperty('z-index', '50', 'important')
            lifted = true
          }
        } else if (lifted) {
          drawer.style.removeProperty('z-index')
          lifted = false
        }
      }
      const observer = new MutationObserver(update)
      observer.observe(document.body, { childList: true, subtree: false })
      update()
      return () => {
        observer.disconnect()
        release()
      }
    }


    // Generic content care for FUTURE tabs (native or plugin), in two passes:
    // 1) squeeze repair — a text leaf crushed by its own row (one-character
    //    vertical stacks, ellipsis down to a sliver) gets its row wrapped and
    //    takes a full-width line of its own;
    // 2) overflow fit — a block extending past the sheet scales down as a
    //    whole (fonts and icons shrink together via zoom) until it fits.
    // Both are class-agnostic: they apply to whatever any plugin registers.
    function installContentFit() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      let raf = 0
      const FLOOR = 0.72
      const MIN_TEXT_W = 26
      const repairSqueeze = (scope) => {
        for (const leaf of scope.querySelectorAll('*')) {
          if (leaf.childElementCount) continue
          const text = (leaf.textContent || '').trim()
          if (text.length <= 1) continue
          const r = leaf.getBoundingClientRect()
          const fs = parseFloat(getComputedStyle(leaf).fontSize) || 14
          const cs = getComputedStyle(leaf)
          const crushedVertical = r.width < fs * 2 && r.height > fs * 2.2
          // actively cut flat: hard-sliver, or ellipsis showing fewer than
          // ~5 characters' worth — "incl..." is as dead as "i"
          const cutFlat = leaf.scrollWidth > leaf.clientWidth + 1 && (r.width < MIN_TEXT_W ||
            (cs.textOverflow === 'ellipsis' && r.width < fs * 5))
          if (!crushedVertical && !cutFlat) continue
          // climb to the nearest non-wrapping flex/grid row (max 4 hops)
          let row = leaf.parentElement, hops = 0
          while (row && row !== scope && hops < 4) {
            const rcs = getComputedStyle(row)
            if ((rcs.display.includes('flex') || rcs.display === 'grid') && rcs.flexWrap !== 'wrap') break
            row = row.parentElement; hops++
          }
          if (!row || row === scope) continue
          const rcs = getComputedStyle(row)
          if (!(rcs.display.includes('flex') || rcs.display === 'grid')) continue
          row.style.flexWrap = 'wrap'
          // every wrapper between the row and the leaf takes a full line, so
          // the text lands on a line of its own and the meta falls below
          let node = leaf
          while (node !== row) { node.style.flex = '1 1 100%'; node = node.parentElement }
          if (getComputedStyle(leaf).whiteSpace === 'nowrap') leaf.style.whiteSpace = 'normal'
        }
      }
      const fitAll = () => {
        raf = 0
        if (!mobileDomAllowed()) return
        const scope = document.querySelector('[aria-modal="true"] [class*="_options"]')
        if (!scope) return
        repairSqueeze(scope)
        // "fits" = the block's visual right edge stays inside the sheet.
        // (scrollWidth/clientWidth both scale with zoom, so their ratio can
        // never certify a fit — the rect check can.)
        const limit = scope.getBoundingClientRect().right - 1
        const targets = []
        const handled = new Set()
        for (const el of scope.querySelectorAll('*')) {
          if (handled.has(el)) continue
          const cs = getComputedStyle(el)
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue
          const r = el.getBoundingClientRect()
          if (r.width > 40 && r.right > limit + 1 && el.childElementCount) {
            for (const d of el.querySelectorAll('*')) handled.add(d)
            handled.add(el)
            targets.push(el)
          }
        }
        for (const el of targets) {
          let z = parseFloat(el.style.zoom || '1') || 1
          while (z > FLOOR) {
            z = Math.max(FLOOR, +(z - 0.06).toFixed(2))
            el.style.zoom = String(z)
            if (el.getBoundingClientRect().right <= limit + 1) break
          }
          // at the floor keep the best zoom: smaller-but-readable beats cut off
        }
      }
      const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fitAll() }) }
      const observer = new MutationObserver(schedule)
      observer.observe(document.body, { childList: true, subtree: true })
      window.addEventListener('resize', schedule)
      schedule()
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', schedule)
        if (raf) cancelAnimationFrame(raf)
      }
    }

    // ===== Subagent breadcrumb + subagent list (mobile only) =====
    // Single-letter lineage naming (A/B/C/D), a two-line name box with a
    // punctuation-aware split + independent per-line font auto-fit, a relation
    // prefix (parent index + own index, e.g. "BC") on the left of the name, and
    // hiding the first "You have joined the team" user-prompt description so the
    // two-line name owns the expanded row. Every mutation is guarded by
    // mobileDomAllowed() so desktop keeps the native DSH DOM untouched.
    const SUB_CRUMB_NAME = 'dshMobName'
    const SUB_CRUMB_PREFIX = 'dshMobPrefix'
    const SUB_JOINED_HIDE = 'dshMobJoinedHide'
    const SUB_NAME_SPLIT = /[\/\\,;:.\-_ ｜]+/

    // 0 -> A, 1 -> B, ... 25 -> Z, 26 -> AA, ...
    function subLetter(index) {
      let i = index + 1
      let s = ''
      while (i > 0) {
        const rem = (i - 1) % 26
        s = String.fromCharCode(65 + rem) + s
        i = Math.floor((i - 1) / 26)
      }
      return s
    }

    // Split an agent name into minimal units on ASCII non-digit punctuation /
    // space separators: / , ; : . - _ (and a bare space). A lone 'l' is NOT a
    // separator — it is a real letter (the spec list is illustrative).
    function subSplitUnits(name) {
      return String(name || '').split(SUB_NAME_SPLIT).map((u) => u.trim()).filter(Boolean)
    }

    // Canvas-backed text-width measurer so the auto-fit is real-pixel accurate;
    // falls back to a character-based estimate when canvas is unavailable.
    function subMeasure() {
      let ctx = null
      try {
        if (typeof document !== 'undefined') {
          const canvas = document.createElement('canvas')
          ctx = canvas.getContext('2d')
        }
      } catch (_) {
        ctx = null
      }
      return (text, fontSize) => {
        if (ctx) {
          ctx.font = `${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
          return ctx.measureText(text).width
        }
        return Math.max(1, String(text).length) * fontSize * 0.55
      }
    }

    // Largest prefix of `text` whose rendered width fits `boxWidth`.
    function subMaxChars(text, fontSize, boxWidth, measure) {
      let lo = 0
      let hi = String(text).length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        if (measure(String(text).slice(0, mid), fontSize) <= boxWidth) lo = mid
        else hi = mid - 1
      }
      return lo
    }

    // Independent per-line auto-fit: shrink the font until this one line fits.
    function subOneLineFit(text, boxWidth, measure, baseFont, minFont) {
      let font = baseFont
      while (font > minFont && measure(String(text), font) > boxWidth) font -= 0.5
      return font
    }

    // A name with NO separators (one continuous token) cannot be grouped: fill the
    // top line, spill the overflow into the bottom line; only when BOTH lines
    // overrun do we shrink the whole name.
    function subFitContinuous(text, boxWidth, measure, baseFont, minFont) {
      let font = baseFont
      for (;;) {
        const topChars = subMaxChars(text, font, boxWidth, measure)
        const top = String(text).slice(0, topChars)
        const rest = String(text).slice(topChars)
        if (rest.length === 0 || measure(rest, font) <= boxWidth) {
          return { top, bottom: rest, topFont: font, bottomFont: font }
        }
        if (font <= minFont) return { top, bottom: rest, topFont: font, bottomFont: font }
        font -= 0.5
      }
    }

    // A split-able name: pick the split whose SECOND group is SHORTER than the
    // first (both in units and characters), then shrink each line independently
    // until it fits. Prefer the split that needs the least shrink.
    function subFitSplit(units, boxWidth, measure, baseFont, minFont) {
      const join = (arr) => arr.join('/')
      let best = null
      for (let k = 1; k < units.length; k++) {
        const top = join(units.slice(0, k))
        const bottom = join(units.slice(k))
        if (bottom.length > top.length) continue
        if (units.slice(k).length > units.slice(0, k).length) continue
        const topFont = subOneLineFit(top, boxWidth, measure, baseFont, minFont)
        const bottomFont = subOneLineFit(bottom, boxWidth, measure, baseFont, minFont)
        const score = Math.min(topFont, bottomFont)
        if (best === null || score > best.score) {
          best = { top, bottom, topFont, bottomFont, score }
        }
      }
      return best
    }

    // Fill `wrapper` with [prefix][two-line name], auto-fitting the font of each
    // line. `boxWidth` is the available width in px after the prefix.
    function subApplyNameBox(wrapper, name, boxWidth, prefix) {
      const baseFont = 13
      const minFont = 9
      const measure = subMeasure()
      const units = subSplitUnits(name)
      const joined = units.join('/')
      let layout
      if (units.length <= 1) {
        layout = subFitContinuous(String(name || ''), boxWidth, measure, baseFont, minFont)
      } else {
        layout =
          subFitSplit(units, boxWidth, measure, baseFont, minFont) ||
          subFitContinuous(joined, boxWidth, measure, baseFont, minFont)
      }
      wrapper.textContent = ''
      if (prefix) {
        const p = document.createElement('span')
        p.className = SUB_CRUMB_PREFIX
        p.setAttribute('aria-hidden', 'true')
        p.textContent = prefix
        wrapper.appendChild(p)
      }
      const nameEl = document.createElement('span')
      nameEl.className = SUB_CRUMB_NAME
      const top = document.createElement('span')
      top.className = SUB_CRUMB_NAME + 'Top'
      top.textContent = layout.top || '\u00a0'
      top.style.fontSize = `${layout.topFont}px`
      nameEl.appendChild(top)
      if (layout.bottom) {
        const bottom = document.createElement('span')
        bottom.className = SUB_CRUMB_NAME + 'Bottom'
        bottom.textContent = layout.bottom
        bottom.style.fontSize = `${layout.bottomFont}px`
        nameEl.appendChild(bottom)
      }
      wrapper.appendChild(nameEl)
      return nameEl
    }

    // --- Single-letter path labels for intermediate ancestor crumbs ---
    // The letter MUST reflect the parent's child creation order, not the depth —
    // a depth fallback would label same-parent siblings A/A instead of A/B/C.
    // Resolution order:
    //   1) explicit order hint (data-dsh-mob-order / data-order / data-index, or
    //      a numeric prefix like "1."),
    //   2) the agent-teams roster / expanded subagent tree in document order —
    //      siblings there are creation-ordered (e.g. scan-backend/frontend/docs),
    //   3) a defensive placeholder (never a bare depth letter) so same-parent
    //      siblings never collapse onto the same character.
    function subCrumbTitle(crumb) {
      return (crumb.textContent || '').trim() || crumb.getAttribute('title') || ''
    }

    function subExplicitOrder(crumb, title) {
      const hint = crumb.getAttribute && (
        crumb.getAttribute('data-dsh-mob-order') ||
        crumb.getAttribute('data-order') ||
        crumb.getAttribute('data-index')
      )
      if (hint !== null && hint !== '' && /^\d+$/.test(String(hint))) return Number(hint)
      const m = title.match(/^(\d+)\s*[.)、-]\s*/)
      if (m) return Number(m[1]) - 1
      return null
    }

    // The expanded subagent/team roster in document order (= creation order).
    function subRosterEntries() {
      return Array.from(document.querySelectorAll(
        '[data-delegation-map] [class*="_memberRow"], [class*="_agentRow"], [class*="_subagent"], [data-agent-teams-card] [class*="_member"]',
      )).map((el) => (el.textContent || '').trim()).filter((t) => t.length > 0)
    }

    // Pure: index of `agentId` among its SAME-PARENT siblings in `roster` order.
    // Agent ids look like `agent-teams:<parent>:<leaf>`; siblings share the full
    // parent prefix and the same segment count. Returns null when not found.
    function subRosterIndexPure(agentId, roster) {
      if (!agentId || !roster || roster.length === 0) return null
      let target = roster.find((t) => t === agentId)
      if (!target) target = roster.find((t) => t.endsWith(':' + agentId))
      if (!target) return null
      const parentPrefix = target.split(':').slice(0, -1).join(':') + ':'
      const selfDepth = target.split(':').length
      let idx = 0
      for (const t of roster) {
        if (t === target) return idx
        if (t.split(':').length === selfDepth && t.startsWith(parentPrefix)) idx += 1
      }
      return null
    }

    function subStableHash(value) {
      let h = 0
      const s = String(value || '')
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
      return Math.abs(h)
    }

    // Defensive placeholder: a short name slice + a stable hash token, so two
    // different same-parent names never share a bare letter (this is NOT a real
    // creation-order letter — it only appears when no order source is available).
    function subPlaceholder(title) {
      const name = String(title || '').trim()
      if (!name) return '?'
      const h = subStableHash(name)
      const dis = ((h % 36).toString(36) + (Math.floor(h / 36) % 36).toString(36)).toUpperCase()
      return name.slice(0, 3) + dis
    }

    // Pure letter resolution: explicit order > roster sibling index > placeholder.
    function subResolveLetterPure(title, depth, roster, explicitOrder) {
      if (explicitOrder !== null && explicitOrder !== undefined && explicitOrder >= 0) {
        return subLetter(explicitOrder)
      }
      const idx = subRosterIndexPure(title, roster)
      if (idx !== null && idx >= 0) return subLetter(idx)
      return subPlaceholder(title)
    }

    function subResolveCrumbLetter(crumb, depth) {
      const title = subCrumbTitle(crumb)
      const roster = subRosterEntries()
      const explicitOrder = subExplicitOrder(crumb, title)
      return subResolveLetterPure(title, depth, roster, explicitOrder)
    }

    // Breadcrumb / session-title header: the CURRENT (leaf) crumb shows its full
    // two-line title so a long session name is never ellipsized; the root
    // ancestor crumb becomes 【主代理】 (focus/click expands the original name,
    // blur restores); intermediate ancestor crumbs become single-letter path
    // labels. Also rewrites the "N 个子代理" count into "【N子代】".
    function subApplyBreadcrumb(nav) {
      const crumbBtns = Array.from(nav.querySelectorAll(`.${HDR.crumb}`))
      if (crumbBtns.length === 0) return
      const leafIndex = crumbBtns.length - 1
      const titleWidth = Math.max(60, (nav.clientWidth || window.innerWidth) - 10)
      for (let i = 0; i < crumbBtns.length; i++) {
        const crumb = crumbBtns[i]
        if (i === leafIndex) {
          // CURRENT session title: full, two-line, no ellipsis.
          if (crumb.dataset.dshMobTitle) continue
          const title = crumb.textContent.trim() || crumb.getAttribute('title') || ''
          if (!title) continue
          crumb.dataset.dshMobTitle = '1'
          crumb.setAttribute('title', title)
          crumb.textContent = ''
          const wrap = document.createElement('span')
          wrap.style.display = 'inline-block'
          wrap.style.verticalAlign = 'top'
          wrap.style.maxWidth = '100%'
          subApplyNameBox(wrap, title, titleWidth, '')
          crumb.appendChild(wrap)
        } else if (i === 0) {
          // Root ancestor -> 【主代理】, toggled on focus, restored on blur.
          if (!crumb.dataset.dshMobRoot) {
            crumb.dataset.dshMobRoot = '1'
            const origTitle = crumb.textContent.trim() || crumb.getAttribute('title') || ''
            crumb.textContent = ''
            const label = document.createElement('span')
            label.className = 'dshMobCrumbRoot'
            label.textContent = '【主代理】'
            crumb.appendChild(label)
            const original = document.createElement('span')
            original.className = 'dshMobCrumbOriginal'
            original.textContent = origTitle
            original.style.display = 'none'
            crumb.appendChild(original)
            crumb.addEventListener('focus', () => {
              label.style.display = 'none'
              original.style.display = ''
            })
            crumb.addEventListener('blur', () => {
              original.style.display = 'none'
              label.style.display = ''
            })
            if (origTitle) crumb.setAttribute('title', origTitle)
          }
        } else {
          // Intermediate ancestor -> single-letter path label.
          if (crumb.dataset.dshMobPath) continue
          crumb.dataset.dshMobPath = '1'
          const letterLabel = document.createElement('span')
          letterLabel.className = 'dshMobCrumbLetter'
          letterLabel.textContent = subResolveCrumbLetter(crumb, i - 1)
          crumb.textContent = ''
          crumb.appendChild(letterLabel)
        }
      }
    }

    // Rewrite "N 个子代理" -> "N子代" inside the crumbs nav (the dsh-client-subagent
    // lineage count rendered as a trailing segment).
    function subApplyAgentCount(nav) {
      const walker = document.createTreeWalker(nav, NodeFilter.SHOW_TEXT, null)
      let node = walker.nextNode()
      while (node) {
        const value = String(node.nodeValue || '')
        const m = value.match(/(\d+)\s*个子代理/)
        if (m) {
          node.nodeValue = `【${m[1]}子代】`
        }
        node = walker.nextNode()
      }
    }

    // Subagent / member list: for each agent-name element build the two-line box
    // with a relation prefix, and hide the "You have joined the team" description.
    // The real roster/tree entries (agent-teams:xxx) carry the name on one line
    // and a meta line like "You have joined the team · 可继续 · 当前未运行" on the
    // next — that meta is what we hide so the two-line name owns the row.
    function subApplyList() {
      const candidateSel = [
        '[class*="_memberRow"]',
        '[class*="_member"]',
        '[class*="_agentRow"]',
        '[class*="_subagent"]',
        '[data-agent-teams-card] [class*="_member"]',
      ].join(', ')
      const seen = new Set()
      for (const row of Array.from(document.querySelectorAll(candidateSel))) {
        if (!row || seen.has(row)) continue
        seen.add(row)
        const rowText = (row.textContent || '').trim()
        const isRoster = /You have joined the team/i.test(rowText) || /agent-teams:/i.test(rowText)
        const nameEl = row.querySelector('[class*="_memberName"], [class*="_name"], [class*="_title"], [class*="_nodeLabel"]')
        if (!nameEl || nameEl.dataset.dshMobNameBox) continue
        const name = nameEl.textContent.trim()
        if (!name) continue
        // Only touch team-roster names (member rows) or names that carry the
        // agent-teams prefix — never unrelated "_name" everywhere on the page.
        if (!isRoster && !/memberName|agent-teams/i.test(String(nameEl.className) + name)) continue
        const boxWidth = Math.max(40, (row.clientWidth || window.innerWidth) - 66)
        const index = subLooseIndex(nameEl)
        nameEl.dataset.dshMobNameBox = '1'
        subApplyNameBox(nameEl, name, boxWidth, index === null ? '' : subLetter(index))
      }

      // 2) Hide the "You have joined the team" first user-prompt description (the
      //    roster/member meta line) so the two-line name owns the row. Scoped to
      //    roster containers to keep the per-mutation walk cheap.
      const scopes = Array.from(document.querySelectorAll(
        '[class*="_memberRow"], [class*="_agentRow"], [class*="_subagent"], [class*="_member"], [data-agent-teams-card], [data-delegation-map]',
      ))
      for (const scope of scopes) {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null)
        let node = walker.nextNode()
        while (node) {
          const value = String(node.nodeValue || '').trim()
          if (value.length > 0 && /You have joined the team/i.test(value)) {
            const block = node.parentElement
            if (block && !block.dataset.dshMobJoinedHide) {
              block.dataset.dshMobJoinedHide = '1'
              block.classList.add(SUB_JOINED_HIDE)
            }
          }
          node = walker.nextNode()
        }
      }
    }

    // Best-effort creation-order index for a member row: prefer an explicit
    // order/index attribute, else the row's position among its sibling rows.
    function subLooseIndex(el) {
      const host = el.closest('[class*="_memberRow"]') || el.closest('[data-team-id]') || el
      const explicit = host.getAttribute && (
        host.getAttribute('data-dsh-mob-order') ||
        host.getAttribute('data-order') ||
        host.getAttribute('data-index')
      )
      if (explicit !== null && explicit !== '' && /^\d+$/.test(String(explicit))) return Number(explicit)
      const parent = host.parentElement
      if (!parent) return null
      const siblings = Array.from(parent.children).filter((c) =>
        c.matches && c.matches('[class*="_memberRow"], [data-team-id]'))
      return siblings.indexOf(host)
    }

    // Named use-case assertions for the two-line allocator (subFitSplit /
    // subFitContinuous). Run when the URL carries ?selfTest=1 or
    // localStorage['dsh-mob-self-test']==='1', so they validate the split/fit
    // invariants in-browser on the deployed bundle without runtime overhead in
    // normal use. Failing cases log to the console for a Playwright assertion.
    function subSelfTest() {
      const results = []
      const measure = subMeasure()
      const box = 180
      const check = (name, fn) => {
        let ok = false
        let err = ''
        try {
          ok = !!fn()
        } catch (e) {
          err = String(e)
        }
        results.push({ name, ok, err })
        if (!ok) console.error(`[dsh-webui-mobile] self-test FAILED: ${name} ${err}`)
      }
      check('split.agentTeamsName', () => {
        const r = subFitSplit(subSplitUnits('agent-teams:wangpan-project-scan:scan-backend'), box, measure, 13, 9)
        return !!r && r.top.length > r.bottom.length && r.topFont >= 9 && r.bottomFont >= 9
      })
      check('split.secondGroupShorter', () => {
        const r = subFitSplit(subSplitUnits('DeepSeek V4 Flash Free'), box, measure, 13, 9)
        return !!r && r.bottom.length < r.top.length && r.bottomFont <= r.topFont
      })
      check('split.nestedChineseLongName', () => {
        const r = subFitSplit(subSplitUnits('agent-teams:递归多层团队:递归...'), box, measure, 13, 9)
        return !!r && r.top.length > r.bottom.length
      })
      check('continuous.twoLinesWhenLong', () => {
        const long = '连续无分隔符超长会话标题名称用于测试两行分配'
        const r = subFitContinuous(long, box, measure, 13, 9)
        return r.top.length > 0 && r.top.length < long.length && r.bottom.length > 0
      })
      check('continuous.shortsOnlyWhenBothOverrun', () => {
        const huge = 'x'.repeat(220)
        const r = subFitContinuous(huge, box, measure, 13, 9)
        return r.topFont <= 13 && r.top.length <= huge.length && r.bottomFont <= 13
      })
      check('continuous.singleLineWhenShort', () => {
        const short = '当前dsh手机端插件名称'
        const r = subFitContinuous(short, box, measure, 13, 9)
        return r.top.length > 0 && (r.bottom.length === 0 || r.bottom === short)
      })
      const failed = results.filter((r) => !r.ok)
      console.info(`[dsh-webui-mobile] subSelfTest: ${results.length - failed.length}/${results.length} passed` +
        (failed.length ? ` — FAILED: ${failed.map((f) => f.name).join(', ')}` : ''))
      return results
    }

    function installSubagentCrumbs() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      try {
        let selfTest = false
        if (typeof location !== 'undefined' && /(^|[?&])selfTest=1/.test(location.search)) selfTest = true
        if (!selfTest) {
          try { selfTest = localStorage.getItem('dsh-mob-self-test') === '1' } catch (_) {}
        }
        if (selfTest) subSelfTest()
      } catch (_) {}
      let raf = 0
      const applyAll = () => {
        raf = 0
        if (!mobileDomAllowed()) return
        const nav = document.querySelector(`.${HDR.crumbs}`)
        if (nav) {
          if (!nav.dataset.dshMobCrumbs) nav.dataset.dshMobCrumbs = '1'
          subApplyAgentCount(nav)
          subApplyBreadcrumb(nav)
        }
        subApplyList()
      }
      const schedule = () => {
        if (raf) return
        raf = requestAnimationFrame(applyAll)
      }
      const obs = new MutationObserver(schedule)
      obs.observe(document.body, { childList: true, subtree: true })
      schedule()
      let mql = null
      const onMq = () => schedule()
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      return () => {
        obs.disconnect()
        if (raf) cancelAnimationFrame(raf)
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    // ===== Model edit page compact (mobile) =====
    // The compact rhythm is CSS-driven; this effect marks the editors and enforces
    // the iOS zoom guard so a tap on a tightened input never zooms the page.
    function installModelCompact() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      let raf = 0
      const sync = () => {
        raf = 0
        if (!mobileDomAllowed()) return
        for (const ed of document.querySelectorAll('[class*="zGbnIq_editor"]')) {
          if (ed.dataset.dshMobCompact) continue
          ed.dataset.dshMobCompact = '1'
          for (const input of ed.querySelectorAll('input')) {
            const cs = getComputedStyle(input)
            if (parseFloat(cs.fontSize) < 16) input.style.fontSize = '16px'
          }
        }
      }
      const schedule = () => { if (raf) return; raf = requestAnimationFrame(sync) }
      const obs = new MutationObserver(schedule)
      obs.observe(document.body, { childList: true, subtree: true })
      schedule()
      return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf) }
    }

    // ===== Agent preset card fixes (mobile) =====
    // A long-press on a preset card must not start a native text selection / copy
    // drag (that is what hijacks the 查看/打开目录/复制 taps on touch devices).
    // The real buttons keep their host handlers; this only blocks selection.
    function installPresetCardFixes() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      const blocked = (t) =>
        t instanceof Element &&
        !!t.closest('[class*="_cardMain"], [class*="_cardDesc"], [class*="_cardHead"], [class*="_cardId"]')
      const onSelect = (e) => {
        if (!mobileDomAllowed()) return
        const t = e.target
        if (!(t instanceof Element)) return
        if (t.closest('input, textarea, [contenteditable="true"]')) return
        if (blocked(t)) e.preventDefault()
      }
      const onDrag = (e) => {
        if (!mobileDomAllowed()) return
        if (blocked(e.target)) e.preventDefault()
      }
      document.addEventListener('selectstart', onSelect, true)
      document.addEventListener('dragstart', onDrag, true)
      return () => {
        document.removeEventListener('selectstart', onSelect, true)
        document.removeEventListener('dragstart', onDrag, true)
      }
    }

    // ===== Appearance custom themes (mobile) =====
    // Replaces the 浅色/深色/跟随系统 cubes with a 3-button toolbar (浅深切换 /
    // 跟随系统 / 自定义). The native cubes stay in the DOM (hidden) and keep driving
    // the host theme state, so clicking them still updates aria-pressed + persists.
    // 自定义 opens a card with the QQ蓝白/微信绿灰/B站粉白 palettes + a color palette
    // that overrides the primary via html[data-dsh-mob-theme] + --dsh-mob-primary.
    const THEME_KEY = 'dsh-mob-theme'
    const THEME_LABEL = { qq: 'QQ蓝白', wechat: '微信绿灰', bili: 'B站粉白', custom: '自定义' }
    const THEME_ACCENT = { qq: '#12B7F5', wechat: '#95EC69', bili: '#FB7299', custom: '#12B7F5' }

    function readThemePersisted() {
      try {
        const raw = localStorage.getItem(THEME_KEY)
        if (!raw) return null
        const p = JSON.parse(raw)
        return {
          theme: typeof p?.theme === 'string' ? p.theme : null,
          primary: typeof p?.primary === 'string' ? p.primary : null,
        }
      } catch (_) { return null }
    }

    function writeThemePersisted(theme, primary) {
      try { localStorage.setItem(THEME_KEY, JSON.stringify({ theme, primary })) } catch (_) {}
    }

    function applyThemeState(theme, primary) {
      const el = document.documentElement
      if (theme) el.setAttribute('data-dsh-mob-theme', theme)
      else el.removeAttribute('data-dsh-mob-theme')
      if (primary) el.style.setProperty('--dsh-mob-primary', primary)
      else el.style.removeProperty('--dsh-mob-primary')
    }

    function currentPrimary() {
      const inline = document.documentElement.style.getPropertyValue('--dsh-mob-primary').trim()
      if (inline) return inline
      return readThemePersisted()?.primary || ''
    }

    function currentThemeAttr() {
      return document.documentElement.getAttribute('data-dsh-mob-theme') || ''
    }

    function isDarkMode() {
      return !!(document.body && document.body.hasAttribute('data-ds-dark-theme'))
    }

    function systemDark() {
      try {
        return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      } catch (_) { return false }
    }

    function findCubeRow() {
      const dialogs = Array.from(document.querySelectorAll('[aria-modal="true"]'))
      for (const d of dialogs) {
        for (const r of Array.from(d.querySelectorAll('[class*="_cubeRow"]'))) {
          if (r.querySelector('[class*="_themeCube"]')) return r
        }
      }
      for (const r of Array.from(document.querySelectorAll('[class*="_cubeRow"]'))) {
        if (r.querySelector('[class*="_themeCube"]')) return r
      }
      return null
    }

    function themeCubes(cubeRow) {
      return Array.from(cubeRow.querySelectorAll('[class*="_themeCube"]'))
    }

    function cubeByText(cubeRow, re) {
      return themeCubes(cubeRow).find((c) => re.test(c.textContent || '')) || null
    }

    // Effective dark/light for display + toggle, respecting follow-system.
    function darkThemeActive(cubeRow) {
      const follow = cubeByText(cubeRow, /跟随系统/)
      if (follow && follow.getAttribute('aria-pressed') === 'true') return systemDark()
      const dark = cubeByText(cubeRow, /深色/)
      const light = cubeByText(cubeRow, /浅色/)
      if (dark && dark.getAttribute('aria-pressed') === 'true') return true
      if (light && light.getAttribute('aria-pressed') === 'true') return false
      return isDarkMode()
    }

    function clickCubeForMode(cubeRow, wantDark) {
      const target = cubeByText(cubeRow, wantDark ? /深色/ : /浅色/)
      if (target) { target.click(); return true }
      document.body.toggleAttribute('data-ds-dark-theme', wantDark)
      return false
    }

    function buildThemeBar(cubeRow) {
      if (cubeRow.querySelector('.dshMobThemeBar')) return
      const bar = document.createElement('div')
      bar.className = 'dshMobThemeBar'
      const modeBtn = document.createElement('button')
      modeBtn.type = 'button'
      modeBtn.className = 'dshMobThemeBtn'
      modeBtn.dataset.role = 'mode'
      modeBtn.addEventListener('click', () => {
        const row = findCubeRow()
        if (row) clickCubeForMode(row, !darkThemeActive(row))
        syncThemeBar(row)
      })
      const followBtn = document.createElement('button')
      followBtn.type = 'button'
      followBtn.className = 'dshMobThemeBtn'
      followBtn.dataset.role = 'follow'
      followBtn.textContent = '跟随系统'
      followBtn.addEventListener('click', () => {
        const row = findCubeRow()
        const target = row && cubeByText(row, /跟随系统/)
        if (target) target.click()
        syncThemeBar(row)
      })
      const customBtn = document.createElement('button')
      customBtn.type = 'button'
      customBtn.className = 'dshMobThemeBtn'
      customBtn.dataset.role = 'custom'
      customBtn.textContent = '自定义'
      customBtn.addEventListener('click', showThemeCard)
      bar.appendChild(modeBtn)
      bar.appendChild(followBtn)
      bar.appendChild(customBtn)
      cubeRow.appendChild(bar)
    }

    function syncThemeBar(cubeRow) {
      const bar = cubeRow && cubeRow.querySelector('.dshMobThemeBar')
      if (!bar) return
      const modeBtn = bar.querySelector('[data-role="mode"]')
      const followBtn = bar.querySelector('[data-role="follow"]')
      const customBtn = bar.querySelector('[data-role="custom"]')
      const followCtl = cubeRow && cubeByText(cubeRow, /跟随系统/)
      const followActive = !!followCtl && followCtl.getAttribute('aria-pressed') === 'true'
      const cur = darkThemeActive(cubeRow) ? '深色' : '浅色'
      if (modeBtn) {
        modeBtn.textContent = cur
        modeBtn.setAttribute('title', `点击切换到${cur === '深色' ? '浅色' : '深色'}`)
        modeBtn.setAttribute('aria-label', `当前${cur}，点击切换到${cur === '深色' ? '浅色' : '深色'}`)
      }
      if (followBtn) followBtn.setAttribute('data-active', followActive ? 'true' : 'false')
      if (customBtn) customBtn.setAttribute('data-active', currentThemeAttr() ? 'true' : 'false')
    }

    function updateThemeCardActive() {
      const cur = currentThemeAttr() || ''
      const primary = currentPrimary()
      for (const it of document.querySelectorAll('.dshMobThemeItem')) {
        it.setAttribute('data-active', it.dataset.theme === cur ? 'true' : 'false')
      }
      for (const s of document.querySelectorAll('.dshMobThemeSwatch')) {
        s.setAttribute('data-active', (s.dataset.primary || '') === primary ? 'true' : 'false')
      }
    }

    function applyPrimary(color) {
      const base = currentThemeAttr() || 'custom'
      applyThemeState(base, color)
      writeThemePersisted(base, color)
      updateThemeCardActive()
      syncThemeBar(findCubeRow())
    }

    function showThemeCard() {
      if (document.querySelector('.dshMobThemeCard')) return
      const overlay = document.createElement('div')
      overlay.className = 'dshMobThemeCard'
      const sheet = document.createElement('div')
      sheet.className = 'dshMobThemeCardSheet'

      const title = document.createElement('div')
      title.className = 'dshMobThemeTitle'
      title.textContent = '自定义主题'
      sheet.appendChild(title)

      const grid = document.createElement('div')
      grid.className = 'dshMobThemeGrid'
      for (const key of ['qq', 'wechat', 'bili']) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'dshMobThemeItem'
        item.dataset.theme = key
        const sw = document.createElement('span')
        sw.className = 'dshMobThemeItemSwatch'
        sw.style.background = THEME_ACCENT[key]
        const lb = document.createElement('span')
        lb.className = 'dshMobThemeItemLabel'
        lb.textContent = THEME_LABEL[key]
        item.appendChild(sw)
        item.appendChild(lb)
        item.addEventListener('click', () => {
          // Picking a brand palette uses its own accent (clears any custom primary).
          applyThemeState(key, null)
          writeThemePersisted(key, null)
          updateThemeCardActive()
          syncThemeBar(findCubeRow())
        })
        grid.appendChild(item)
      }
      sheet.appendChild(grid)

      const sub = document.createElement('div')
      sub.className = 'dshMobThemeSub'
      sub.textContent = '调色板 · 自定义主色'
      sheet.appendChild(sub)

      const swatches = document.createElement('div')
      swatches.className = 'dshMobThemeSwatches'
      const palette = ['#12B7F5', '#95EC69', '#FB7299', '#4176e6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0f1115']
      for (const c of palette) {
        const s = document.createElement('button')
        s.type = 'button'
        s.className = 'dshMobThemeSwatch'
        s.dataset.primary = c
        s.style.background = c
        s.setAttribute('aria-label', `主色 ${c}`)
        s.addEventListener('click', () => applyPrimary(c))
        swatches.appendChild(s)
      }
      const colorInput = document.createElement('input')
      colorInput.type = 'color'
      colorInput.className = 'dshMobThemeColor'
      colorInput.value = (currentPrimary() || '#12B7F5').slice(0, 7)
      colorInput.setAttribute('aria-label', '自定义主色')
      colorInput.addEventListener('change', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(colorInput.value)) applyPrimary(colorInput.value)
      })
      swatches.appendChild(colorInput)
      sheet.appendChild(swatches)

      const close = document.createElement('button')
      close.type = 'button'
      close.className = 'dshMobThemeClose'
      close.textContent = '关闭'
      close.addEventListener('click', () => overlay.remove())
      sheet.appendChild(close)

      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
      overlay.appendChild(sheet)
      document.body.appendChild(overlay)
      updateThemeCardActive()
    }

    function installAppearanceCustomizer() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      const persisted = readThemePersisted()
      if (persisted && (persisted.theme || persisted.primary) && mobileDomAllowed()) {
        applyThemeState(persisted.theme, persisted.primary)
      }
      let raf = 0
      const sync = () => {
        raf = 0
        if (!mobileDomAllowed()) return
        const cubeRow = findCubeRow()
        if (!cubeRow) return
        if (!cubeRow.dataset.dshMobThemeBar) cubeRow.dataset.dshMobThemeBar = '1'
        buildThemeBar(cubeRow)
        syncThemeBar(cubeRow)
      }
      const schedule = () => { if (raf) return; raf = requestAnimationFrame(sync) }
      const obs = new MutationObserver(schedule)
      obs.observe(document.body, { childList: true, subtree: true })
      schedule()
      let mql = null
      const onMq = () => schedule()
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      return () => {
        obs.disconnect()
        if (raf) cancelAnimationFrame(raf)
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    // ===== Pinch zoom + reflow + FAB long-press function card (mobile) =====
    const ZOOM_KEY = 'dsh-mob-zoom'
    const ZOOM_FONT_MIN = 0.7
    const ZOOM_FONT_MAX = 1.7
    const ZOOM_FONT_STEP = 0.1
    const ZOOM_FONT_DEFAULT = 1
    const ZOOM_PAGE_MIN = 0.8
    const ZOOM_PAGE_MAX = 1.4
    const ZOOM_PAGE_STEP = 0.1
    const ZOOM_PAGE_DEFAULT = 1
    const ZOOM_LONGPRESS_MS = 500

    const zoomState = { font: ZOOM_FONT_DEFAULT, page: ZOOM_PAGE_DEFAULT }

    function clampNum(v, lo, hi, dflt) {
      const n = parseFloat(v)
      if (Number.isFinite(n)) return Math.min(hi, Math.max(lo, n))
      return dflt
    }

    function readZoomPersisted() {
      try {
        const raw = localStorage.getItem(ZOOM_KEY)
        if (!raw) return null
        const p = JSON.parse(raw)
        return {
          font: clampNum(p?.font, ZOOM_FONT_MIN, ZOOM_FONT_MAX, ZOOM_FONT_DEFAULT),
          page: clampNum(p?.page, ZOOM_PAGE_MIN, ZOOM_PAGE_MAX, ZOOM_PAGE_DEFAULT),
        }
      } catch (_) { return null }
    }

    function writeZoomPersisted(font, page) {
      try { localStorage.setItem(ZOOM_KEY, JSON.stringify({ font, page })) } catch (_) {}
    }

    function applyZoomState(font, page) {
      zoomState.font = clampNum(font, ZOOM_FONT_MIN, ZOOM_FONT_MAX, ZOOM_FONT_DEFAULT)
      zoomState.page = clampNum(page, ZOOM_PAGE_MIN, ZOOM_PAGE_MAX, ZOOM_PAGE_DEFAULT)
      if (typeof document !== 'undefined') {
        const host = document.documentElement
        host.style.setProperty('--dsh-mob-font-zoom', String(zoomState.font))
        host.style.setProperty('--dsh-mob-page-zoom', String(zoomState.page))
      }
      syncZoomCard()
    }

    function bumpZoom(which, delta) {
      let nf = zoomState.font
      let np = zoomState.page
      if (which === 'font') nf = clampNum(nf + delta, ZOOM_FONT_MIN, ZOOM_FONT_MAX, ZOOM_FONT_DEFAULT)
      else np = clampNum(np + delta, ZOOM_PAGE_MIN, ZOOM_PAGE_MAX, ZOOM_PAGE_DEFAULT)
      applyZoomState(nf, np)
      writeZoomPersisted(nf, np)
    }

    function resetZoom(which) {
      const nf = which === 'font' ? ZOOM_FONT_DEFAULT : zoomState.font
      const np = which === 'page' ? ZOOM_PAGE_DEFAULT : zoomState.page
      applyZoomState(nf, np)
      writeZoomPersisted(nf, np)
    }

    function syncZoomCard() {
      for (const card of document.querySelectorAll('.dshMobZoomCard')) {
        const fv = card.querySelector('[data-dsh-mob-val="font"]')
        const pv = card.querySelector('[data-dsh-mob-val="page"]')
        if (fv) fv.textContent = `${Math.round(zoomState.font * 100)}%`
        if (pv) pv.textContent = `${Math.round(zoomState.page * 100)}%`
      }
    }

    function showZoomCard() {
      if (document.querySelector('.dshMobZoomCard')) { syncZoomCard(); return }
      const overlay = document.createElement('div')
      overlay.className = 'dshMobZoomCard'
      const sheet = document.createElement('div')
      sheet.className = 'dshMobZoomSheet'

      const title = document.createElement('div')
      title.className = 'dshMobZoomTitle'
      title.textContent = '缩放功能卡片'
      sheet.appendChild(title)

      const controls = [
        { which: 'font', label: '字体大小' },
        { which: 'page', label: '页面大小' },
      ]
      for (const c of controls) {
        const row = document.createElement('div')
        row.className = 'dshMobZoomRow'
        const label = document.createElement('span')
        label.className = 'dshMobZoomLabel'
        label.textContent = c.label
        const ctl = document.createElement('div')
        ctl.className = 'dshMobZoomCtl'
        const minus = document.createElement('button')
        minus.type = 'button'
        minus.className = 'dshMobZoomBtn'
        minus.textContent = '−'
        minus.setAttribute('aria-label', `${c.label}减小`)
        minus.addEventListener('click', () => bumpZoom(c.which, -ZOOM_FONT_STEP))
        const val = document.createElement('span')
        val.className = 'dshMobZoomVal'
        val.dataset.dshMobVal = c.which
        const plus = document.createElement('button')
        plus.type = 'button'
        plus.className = 'dshMobZoomBtn'
        plus.textContent = '＋'
        plus.setAttribute('aria-label', `${c.label}放大`)
        plus.addEventListener('click', () => bumpZoom(c.which, ZOOM_FONT_STEP))
        const reset = document.createElement('button')
        reset.type = 'button'
        reset.className = 'dshMobZoomBtn'
        reset.textContent = '↺'
        reset.setAttribute('aria-label', `${c.label}重置`)
        reset.addEventListener('click', () => resetZoom(c.which))
        ctl.appendChild(minus)
        ctl.appendChild(val)
        ctl.appendChild(plus)
        ctl.appendChild(reset)
        row.appendChild(label)
        row.appendChild(ctl)
        sheet.appendChild(row)
      }

      const close = document.createElement('button')
      close.type = 'button'
      close.className = 'dshMobZoomClose'
      close.textContent = '关闭'
      close.addEventListener('click', () => overlay.remove())
      sheet.appendChild(close)

      // Guard the outside-tap close against the release click right after the
      // long-press (which can land on the freshly-shown overlay and close it).
      const shownAt = Date.now()
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && Date.now() - shownAt > 700) overlay.remove()
      })
      overlay.appendChild(sheet)
      document.body.appendChild(overlay)
      syncZoomCard()
    }

    function measureChatBaseFont() {
      const scroll = document.querySelector(`.${CLS.chatScroll}`) || document.querySelector('[data-conversation-scroll]')
      if (!scroll) return
      const probe = scroll.querySelector('p, li, [class*="_text"], [class*="_markdown"]')
      if (!probe) return
      const fs = parseFloat(getComputedStyle(probe).fontSize)
      if (Number.isFinite(fs) && fs > 0) {
        document.documentElement.style.setProperty('--dsh-mob-font-base', `${fs}px`)
      }
    }

    function installPinchZoomFab() {
      if (typeof document === 'undefined' || typeof window === 'undefined' || typeof window.MutationObserver !== 'function') return

      // Restore persisted zoom on load (mobile only).
      const persisted = readZoomPersisted()
      if (persisted && mobileDomAllowed()) applyZoomState(persisted.font, persisted.page)

      // ---- FAB long-press -> function card; short tap stays open-sidebar ----
      let lpBtn = null
      let lpTimer = 0
      let lpCancel = false
      let lpX = 0
      let lpY = 0
      let suppressNextClick = false
      const cancelTimer = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = 0 } }
      const onFabPointerDown = (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('.dshMobMenu') : null
        if (!btn) return
        lpBtn = btn
        lpCancel = false
        lpX = e.clientX
        lpY = e.clientY
        cancelTimer()
        lpTimer = window.setTimeout(() => {
          lpTimer = 0
          if (lpCancel || !lpBtn) return
          if (!mobileDomAllowed()) return
          showZoomCard()
          suppressNextClick = true
          if (lpBtn) {
            lpBtn.setAttribute('data-dsh-mob-longpress', 'true')
            // Clear the button flag even if no synthesized click follows, so a
            // later short tap still opens the sidebar normally.
            window.setTimeout(() => {
              if (lpBtn) lpBtn.removeAttribute('data-dsh-mob-longpress')
            }, 900)
          }
        }, ZOOM_LONGPRESS_MS)
      }
      const onFabPointerMove = (e) => {
        if (!lpTimer || !lpBtn) return
        if (Math.hypot((e.clientX || 0) - lpX, (e.clientY || 0) - lpY) > 12) {
          lpCancel = true
          cancelTimer()
        }
      }
      const onFabPointerUp = () => { cancelTimer() }
      const onClickCapture = (e) => {
        // The release that follows a long-press targets the just-shown overlay
        // (or a common ancestor); swallow it so the card stays open and the
        // sidebar is NOT toggled. Any later real tap works normally.
        if (suppressNextClick) {
          suppressNextClick = false
          const p0 = e.composedPath ? e.composedPath() : (e.target ? [e.target] : [])
          const b0 = p0.find((n) => n && n.classList && n.classList.contains('dshMobMenu'))
          if (b0) b0.removeAttribute('data-dsh-mob-longpress')
          e.preventDefault()
          e.stopPropagation()
          return
        }
        const path = e.composedPath ? e.composedPath() : (e.target ? [e.target] : [])
        const btn = path.find((n) => n && n.classList && n.classList.contains('dshMobMenu'))
        if (btn && btn.getAttribute('data-dsh-mob-longpress') === 'true') {
          btn.removeAttribute('data-dsh-mob-longpress')
          e.preventDefault()
          e.stopPropagation()
        }
      }
      document.addEventListener('pointerdown', onFabPointerDown, true)
      document.addEventListener('pointermove', onFabPointerMove, true)
      document.addEventListener('pointerup', onFabPointerUp, true)
      document.addEventListener('pointercancel', onFabPointerUp, true)
      document.addEventListener('click', onClickCapture, true)

      // ---- Pinch-to-zoom on the chat: 2-finger pinch scales the font zoom ----
      let pinchActive = false
      let pinchStartDist = 0
      let pinchStartFont = ZOOM_FONT_DEFAULT
      const findScroll = () => document.querySelector(`.${CLS.chatScroll}`) || document.querySelector('[data-conversation-scroll]')
      const inScroll = (t) => {
        const sc = findScroll()
        return !!(sc && t && t.target && sc.contains(t.target))
      }
      const onTouchStart = (e) => {
        if (e.touches.length !== 2) return
        if (!mobileDomAllowed()) return
        const t1 = e.touches[0]; const t2 = e.touches[1]
        if (!inScroll(t1) || !inScroll(t2)) return
        pinchActive = true
        pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        pinchStartFont = zoomState.font
      }
      const onTouchMove = (e) => {
        if (!pinchActive || e.touches.length !== 2) return
        const t1 = e.touches[0]; const t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        if (pinchStartDist > 0) {
          const ratio = dist / pinchStartDist
          const font = clampNum(pinchStartFont * ratio, ZOOM_FONT_MIN, ZOOM_FONT_MAX, ZOOM_FONT_DEFAULT)
          applyZoomState(font, zoomState.page)
        }
        if (e.cancelable) e.preventDefault()
      }
      const onTouchEnd = (e) => {
        if (pinchActive && e.touches.length < 2) {
          pinchActive = false
          writeZoomPersisted(zoomState.font, zoomState.page)
        }
      }
      document.addEventListener('touchstart', onTouchStart, { passive: true })
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd, { passive: true })

      // Watch for the chat scroll mounting (conversation loads after the app).
      let raf = 0
      const schedule = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          if (!mobileDomAllowed()) return
          measureChatBaseFont()
          syncZoomCard()
        })
      }
      const obs = new MutationObserver(schedule)
      obs.observe(document.body, { childList: true, subtree: true })
      schedule()
      let mql = null
      const onMq = () => schedule()
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}

      return () => {
        obs.disconnect()
        if (raf) cancelAnimationFrame(raf)
        document.removeEventListener('pointerdown', onFabPointerDown, true)
        document.removeEventListener('pointermove', onFabPointerMove, true)
        document.removeEventListener('pointerup', onFabPointerUp, true)
        document.removeEventListener('pointercancel', onFabPointerUp, true)
        document.removeEventListener('click', onClickCapture, true)
        document.removeEventListener('touchstart', onTouchStart)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    function apply(ctx) {
      ensureStyle()
      ctx.effect(installSettingsHeaderReparent, 'dsh-webui-mobile: settings-header-reparent')
      ctx.effect(installSubagentCrumbs, 'dsh-webui-mobile: subagent-crumbs')
      ctx.effect(installSettingsConfigRow, 'dsh-webui-mobile: settings-config-row')
      ctx.effect(installPopupZGuard, 'dsh-webui-mobile: popup-z-guard')
      ctx.effect(installContentFit, 'dsh-webui-mobile: content-fit')
      ctx.effect(installModelCompact, 'dsh-webui-mobile: model-compact')
      ctx.effect(installPresetCardFixes, 'dsh-webui-mobile: preset-card-fixes')
      ctx.effect(installAppearanceCustomizer, 'dsh-webui-mobile: appearance-customizer')
      ctx.effect(installPinchZoomFab, 'dsh-webui-mobile: pinch-zoom-fab')
      ctx.effect(
        () =>
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              {
                name: 'shell.overlay',
                id: 'dsh-webui-mobile-chrome',
                order: 10,
                label: 'Mobile chrome',
              },
              () =>
                jsx(MobileChrome, {
                  getLayout: () => ctx.layout,
                }),
            ),
          ),
        'dsh-webui-mobile: shell.overlay',
      )
      // Mobile-only image-upload affordance. The `conversation.input.attachments`
      // slot is kind:"single", so we take it over ONLY while mobile is active and
      // release it when it isn't — desktop keeps the native attachment rail. The
      // face receives { attachments, onAddImages, onRemoveImage, ... } slot props.
      ctx.effect(
        () => {
          if (typeof window === 'undefined' || !window.matchMedia) return
          let disposer = null
          const mq = window.matchMedia(MOBILE_MQ)
          const update = () => {
            const on = mq.matches && !shellDisabled()
            if (on && !disposer) {
              try {
                disposer = ctx.slots.inject('conversation.input.attachments', () =>
                  ctx.slots.register(
                    {
                      name: 'conversation.input.attachments',
                      id: 'dsh-webui-mobile-image',
                      priority: -1, // lower than the native rail's 0 → shadows it (lowest renders)
                      order: -1,
                      label: 'Mobile image upload',
                    },
                    MobileAttachBar,
                  ),
                )
              } catch (err) {
                console.warn('[dsh-webui-mobile] attachments slot', err)
              }
            } else if (!on && disposer) {
              disposer()
              disposer = null
            }
          }
          update()
          mq.addEventListener('change', update)
          return () => {
            mq.removeEventListener('change', update)
            if (disposer) disposer()
          }
        },
        'dsh-webui-mobile: conversation.input.attachments',
      )
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
