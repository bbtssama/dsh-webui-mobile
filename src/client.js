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
      "crumbs utilities"
      "tabs actions" !important;
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
  html.${HTML_CLASS} .${HDR.crumbs} {
    grid-area: crumbs !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} .${HDR.headerUtilities} {
    grid-area: utilities !important;
    justify-self: end !important;
  }
  html.${HTML_CLASS} .${HDR.tabs} {
    grid-area: tabs !important;
    justify-self: start !important;
    min-width: 0 !important;
  }
  html.${HTML_CLASS} .${HDR.headerActions} {
    grid-area: actions !important;
    justify-self: end !important;
    align-self: center !important;
    min-width: 0 !important;
    max-width: 100% !important;
    flex-wrap: wrap !important;
    gap: 4px 8px !important;
    overflow: visible !important; /* don't clip subagent/jobs buttons or their menus */
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

  /* R4 — Agent preset cards (mobile readability + layout stability).
     Ground truth (current DSH): card = [class$="_card"]; inside it a
     [class$="_cardMain"] <button> holds the name ([class$="_cardHead"]) +
     id ([class$="_cardId"]) + description ([class$="_cardDesc"]); a sibling
     [class$="_cardFoot"] holds [class*="_iconButton"]s (data-tip = 查看/复制/
     打开目录/删除). The native handlers work (buttons are not disabled and
     pointer-events is auto) — the mobile bugs are VIEWPORT-FIT / hit-area:
     the 查看 viewer dialog is centered at ~561px (wider than a phone → the
     "详细文字" clips off the right edge), and the small foot buttons are hard
     to tap. Class-agnostic structural selectors; mobile only. */
  /* Long-press / drag must not start native text-selection or the iOS copy
     bubble on the card. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardMain"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardHead"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardDesc"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardId"] {
    user-select: none !important;
    -webkit-user-select: none !important;
    -webkit-touch-callout: none !important;
  }
  /* Uniform grid: two equal tracks, every card stretches to its row's height so
     the grid reads as aligned rows (no card taller/misaligned than its peers). */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cards"] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    align-items: start !important; /* cards hug their content: uniform height, no stretch dead space */
  }
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_card"] {
    min-width: 0 !important;
    max-width: 100% !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important; /* never clip the foot buttons */
  }
  /* The name/desc block hugs its content (no flex-grow); the foot sits directly
     beneath it. A uniform 2-line name cell keeps every card's content the same
     height, so cards stay equal and the buttons line up without a big gap. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_card"] [class$="_cardMain"] {
    flex: 0 1 auto !important;   /* don't stretch: stop the dead space above the foot */
    min-width: 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    padding: 10px 10px 4px !important; /* tighten bottom so the foot hugs the content */
    gap: 4px !important;
  }
  /* Long names wrap inside the card and clip to 2 lines instead of pushing the
     card taller / overflowing the grid cell. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cardHead"] {
    min-width: 0 !important;
    min-height: 42px !important; /* reserve 2 lines so ALL cards share one content height */
    overflow: hidden !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }
  /* Description: a FIXED-height box (uniform across cards) that scrolls directly
     on an up-swipe instead of dragging a selection cursor. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_options"] [class$="_cardDesc"] {
    font-size: 11px !important;
    line-height: 1.4 !important;
    display: block !important;
    min-height: 4.2em !important;
    max-height: 4.2em !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y !important;
    overscroll-behavior: contain !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }
  /* Foot icon buttons (查看/复制/打开目录/删除): larger tap target, never
     clipped, and taps land reliably (touch-action manipulation). */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardFoot"] {
    min-width: 0 !important;
    flex: none !important;
    flex-wrap: wrap !important;
    gap: 0 !important;
    padding: 2px 0 0 !important; /* snug above the buttons; removes dead vertical space */
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_cardFoot"] [class*="_iconButton"] {
    min-width: 40px !important;
    min-height: 40px !important;
    margin: 2px !important;
    padding: 0 !important;
    touch-action: manipulation !important;
    pointer-events: auto !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  /* 查看 viewer dialog: it is centered at ~561px wide (a desktop dialog). On a
     phone that is wider than the viewport, so the "详细文字" clips off the right
     edge before the pre's own scroll is reachable. Fit it to the viewport and let
     the code wrap + scroll instead of overflowing horizontally. */
  html.${HTML_CLASS} [role="dialog"]:has([class$="_viewerCode"]) {
    z-index: 2000 !important; /* topmost: never behind the settings panel/mask */
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    max-height: calc(100dvh - 24px - env(safe-area-inset-top, 0px)) !important;
    box-sizing: border-box !important;
    overflow: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  /* The 查看 viewer is a separate dialog-library overlay portal (a body-level div,
     parent of the rtSEdW_dialog) with position:fixed + z-index:1000. Our settings
     panel lives inside the sidebar, which we LIFT to z-index:1001 while its overlay
     is mounted (:has(.VOzbGW_overlay)), so the settings panel paints ABOVE the
     viewer's 1000 and hides the "查看" detail text (DOM present but not visible).
     Lift the viewer's portal root above the lifted sidebar so the detail truly
     shows in the foreground. The viewer code block only ever exists inside this
     portal, so :has([class$="_viewerCode"]) scopes it to the viewer alone. */
  html.${HTML_CLASS} body > div:has([class$="_viewerCode"]) {
    z-index: 2000 !important; /* above the lifted sidebar (1001) + masks */
  }
  html.${HTML_CLASS} [role="dialog"]:has([class$="_viewerCode"]) [class$="_viewerCode"] {
    max-height: none !important;
    overflow: auto !important;
    -webkit-overflow-scrolling: touch;
    white-space: pre-wrap !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
  }

  /* Keep iOS zoom guard */
  html.${HTML_CLASS} .${INPUT.input},
  html.${HTML_CLASS} textarea,
  html.${HTML_CLASS} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]) {
    font-size: 16px !important;
  }

  /* R3 — model editor compact: narrow field rows so long model names / api keys /
     api urls render fully, and tighten the expanded card's padding/gap. The editor
     is the model provider's edit card inside the settings modal: [class$="_editor"]
     holds [class$="_field"] > [class$="_fieldLabel"] + input[class$="_input"]/
     select[class$="_input"]. Class-agnostic structural selectors; mobile only. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] {
    gap: 10px !important;
    padding: 10px 12px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editorHeader"] {
    flex-wrap: wrap !important;
    row-gap: 4px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_field"] {
    width: 100% !important;
    min-width: 0 !important;
    gap: 4px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_fieldLabel"] {
    flex: none !important;
    max-width: 100% !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  /* The value / input: take remaining width. Single-line <input> cannot wrap and does
     not honor text-overflow:ellipsis, so long api urls / api keys / model names are shown
     in full by the model-editor value assist (title tooltip + a wrapping read-only
     sidecar line injected after the overflowing input). The input stays a clean
     single-line field. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] input[class$="_input"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] select[class$="_input"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] textarea[class$="_input"] {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    flex: 1 1 auto !important;
    height: 31px !important;
    min-height: 31px !important;
    font-size: 13px !important;
    line-height: 31px !important;
    padding: 0 8px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] textarea[class$="_input"] {
    white-space: pre-wrap !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    resize: vertical !important;
    height: auto !important;
    min-height: 31px !important;
    line-height: 1.4 !important;
    padding: 6px 8px !important;
  }
  /* Expanded details body (自定义设置) — keep it from overshooting, tighten gaps. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class*="_customizedBody"] {
    max-width: 100% !important;
    min-width: 0 !important;
    gap: 6px !important;
    row-gap: 6px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] details[class$="_customized"] {
    margin-top: 6px !important;
    padding-top: 6px !important;
  }
  /* Model-catalog blocks (模型 ID / 显示名称 + 容量">"/垃圾桶) — compact, uniform height,
     minimal internal/paragraph whitespace. Keep the row on ONE tight wrapping line with
     equally-sized inputs/buttons (no tall column stack that leaves big gaps). */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelRow"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    gap: 3px 6px !important;
    row-gap: 3px !important;
    padding: 1px 0 !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelRow"] input[class$="_input"] {
    flex: 1 1 140px !important;
    min-width: 0 !important;
    max-width: 100% !important;
    width: auto !important;
    box-sizing: border-box !important;
    height: 31px !important;
    min-height: 31px !important;
    font-size: 13px !important;
    line-height: 31px !important;
    padding: 0 8px !important;
  }
  /* The 容量(">") chevron and trash buttons sit on the same tight row, uniform 31px. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelRow"] button[class*="_iconButton"] {
    flex: none !important;
    width: 31px !important;
    height: 31px !important;
    min-width: 31px !important;
    min-height: 31px !important;
    max-width: 31px !important;
    max-height: 31px !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  /* One block wraps no extra space: each entry hugs its single row. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelEntry"] {
    padding: 1px 0 !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelList"] {
    gap: 3px !important;
    row-gap: 3px !important;
    padding: 0 !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelCatalog"] {
    gap: 5px !important;
    row-gap: 5px !important;
    min-width: 0 !important;
  }
  /* 模型目录 heading row (title + meta) — tighten spacing to the block list. */
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelListHead"] {
    padding: 0 0 2px !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelCatalogHeading"] {
    row-gap: 0 !important;
  }
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelCatalogTitle"],
  html.${HTML_CLASS} [aria-modal="true"] [class$="_editor"] [class$="_modelCatalogMeta"] {
    margin: 0 !important;
  }

  /* ===== R5 — appearance themes (mobile only) ===== */
  /* Hide the native 浅色/深色/跟随系统 cubes; our 3-button toolbar replaces them. */
  html.${HTML_CLASS} [aria-modal="true"] [class*="_cubeRow"] [class*="_themeCube"] {
    display: none !important;
  }
  /* Native controls (scrollbars / selects) follow the chosen colour-scheme. */
  html.${HTML_CLASS} { color-scheme: light; }
  html.${HTML_CLASS}[data-ds-dark] { color-scheme: dark; }

  /* Accent mapping — ONE --dsh-theme-accent drives every accent-themed token, so a
     preset or a custom accent stays coherent (single source of truth for the 主色). */
  html.${HTML_CLASS}[data-dsh-theme] body {
    --dsw-alias-state-business-primary: var(--dsh-theme-accent);
    --dsw-alias-brand-primary-new-colorprimary-new-color: var(--dsh-theme-accent);
    --dsw-alias-button-info-fill: var(--dsh-theme-accent);
    --dsw-alias-button-info-hover: color-mix(in srgb, var(--dsh-theme-accent) 80%, #fff);
    --dsw-alias-button-primary-fill: var(--dsh-theme-accent);
    --dsw-alias-button-primary-hover: color-mix(in srgb, var(--dsh-theme-accent) 76%, #000);
    --dsw-alias-button-primary-dimmed: color-mix(in srgb, var(--dsh-theme-accent) 14%, var(--dsw-alias-bg-layer-1));
    --dsw-alias-interactive-bg-hover-accent: color-mix(in srgb, var(--dsh-theme-accent) 14%, var(--dsw-alias-bg-base));
    --dsw-alias-state-business-tertiary: color-mix(in srgb, var(--dsh-theme-accent) 16%, var(--dsw-alias-bg-base));
    --dsw-specific-bubble: color-mix(in srgb, var(--dsh-theme-accent) 9%, var(--dsw-alias-bg-base));
    --dsw-specific-bubble-highlight: color-mix(in srgb, var(--dsh-theme-accent) 18%, var(--dsw-alias-bg-base));
    --dsw-specific-sidebar-nav-item-active-accent: color-mix(in srgb, var(--dsh-theme-accent) 20%, var(--dsw-alias-bg-base));
    --dsw-alias-scrollbar-hover-l1: color-mix(in srgb, var(--dsh-theme-accent) 26%, var(--dsw-alias-bg-base));
    --dsw-alias-scrollbar-hover-l2: color-mix(in srgb, var(--dsh-theme-accent) 26%, var(--dsw-alias-bg-base));
  }

  /* — 预设 1 · 晴空蓝 (QQ蓝白): airy, trustworthy blue — */
  html.${HTML_CLASS}[data-dsh-theme="qq"] { --dsh-theme-accent: #2E7CF6; }
  html.${HTML_CLASS}[data-dsh-theme="qq"] body {
    --dsw-alias-bg-base:#F4F8FF; --dsw-alias-bg-layer-1:#FFFFFF; --dsw-alias-bg-layer-2:#EEF3FC; --dsw-alias-bg-layer-3:#E3EBF9;
    --dsw-alias-bg-module-platform:#EAF0FB; --dsw-alias-bg-overlay:#DEE7F7; --dsw-alias-bg-multi-select:#EAF0FB;
    --dsw-alias-label-primary:#12233B; --dsw-alias-label-secondary:#5A6B8C; --dsw-alias-label-tertiary:#8192AB; --dsw-alias-label-caption:#A6B2C5;
    --dsw-alias-label-primary-dimmed:#12233B;
    --dsw-alias-border-l1:rgba(46,124,246,.10); --dsw-alias-border-l2:rgba(46,124,246,.16); --dsw-alias-border-l3:rgba(46,124,246,.24); --dsw-alias-border-l2-darkmode-thin:rgba(46,124,246,.10);
    --dsw-specific-sidebar-fill:#F7FAFF; --dsw-specific-menu:#FFFFFF; --dsw-specific-input-major:#FFFFFF; --dsw-specific-selector:#EEF3FC; --dsw-specific-tip:#F0F4FC;
    --dsw-alias-scrollbar-bg-l1:#E4EAF4; --dsw-alias-scrollbar-bg-l2:#E4EAF4;
    --dsw-alias-button-floating-fill:#FFFFFF; --dsw-alias-button-floating-hover:#EAF0FB;
  }
  html.${HTML_CLASS}[data-dsh-theme="qq"] body[data-ds-dark-theme] {
    --dsw-alias-bg-base:#10141D; --dsw-alias-bg-layer-1:#171D2A; --dsw-alias-bg-layer-2:#1F2737; --dsw-alias-bg-layer-3:#283043;
    --dsw-alias-bg-module-platform:#222A3A; --dsw-alias-bg-overlay:#2C3547; --dsw-alias-bg-multi-select:#1F2737;
    --dsw-alias-label-primary:#E7EDF8; --dsw-alias-label-secondary:#93A3BD; --dsw-alias-label-tertiary:#6E7E98; --dsw-alias-label-caption:#5A6A84;
    --dsw-alias-label-primary-dimmed:#DDE6F5;
    --dsw-alias-border-l1:rgba(91,155,255,.12); --dsw-alias-border-l2:rgba(91,155,255,.20); --dsw-alias-border-l3:rgba(91,155,255,.28); --dsw-alias-border-l2-darkmode-thin:rgba(91,155,255,.12);
    --dsw-specific-sidebar-fill:#141923; --dsw-specific-menu:#1D2330; --dsw-specific-input-major:#1F2737; --dsw-specific-selector:#232B3B; --dsw-specific-tip:#20283A;
    --dsw-alias-scrollbar-bg-l1:#2B3345; --dsw-alias-scrollbar-bg-l2:#2B3345;
    --dsw-alias-button-floating-fill:#1D2330; --dsw-alias-button-floating-hover:#283043;
  }

  /* — 预设 2 · 青草绿 (古早微信绿灰): warm, calm, nostalgic — */
  html.${HTML_CLASS}[data-dsh-theme="wechat"] { --dsh-theme-accent: #07C160; }
  html.${HTML_CLASS}[data-dsh-theme="wechat"] body {
    --dsw-alias-bg-base:#EFF3EF; --dsw-alias-bg-layer-1:#FFFFFF; --dsw-alias-bg-layer-2:#F3F7F3; --dsw-alias-bg-layer-3:#EAF0EA;
    --dsw-alias-bg-module-platform:#ECF2EC; --dsw-alias-bg-overlay:#E3EBE3; --dsw-alias-bg-multi-select:#ECF2EC;
    --dsw-alias-label-primary:#1F2A21; --dsw-alias-label-secondary:#5F6B62; --dsw-alias-label-tertiary:#8A948C; --dsw-alias-label-caption:#A9B2AA;
    --dsw-alias-label-primary-dimmed:#1F2A21;
    --dsw-alias-border-l1:rgba(7,193,96,.10); --dsw-alias-border-l2:rgba(7,193,96,.16); --dsw-alias-border-l3:rgba(7,193,96,.24); --dsw-alias-border-l2-darkmode-thin:rgba(7,193,96,.10);
    --dsw-specific-sidebar-fill:#F5F8F5; --dsw-specific-menu:#FFFFFF; --dsw-specific-input-major:#FFFFFF; --dsw-specific-selector:#F0F5F0; --dsw-specific-tip:#EEF4EE;
    --dsw-alias-scrollbar-bg-l1:#E0E7E0; --dsw-alias-scrollbar-bg-l2:#E0E7E0;
    --dsw-alias-button-floating-fill:#FFFFFF; --dsw-alias-button-floating-hover:#EDF3ED;
  }
  html.${HTML_CLASS}[data-dsh-theme="wechat"] body[data-ds-dark-theme] {
    --dsw-alias-bg-base:#131815; --dsw-alias-bg-layer-1:#1A211D; --dsw-alias-bg-layer-2:#222B26; --dsw-alias-bg-layer-3:#2B362F;
    --dsw-alias-bg-module-platform:#232C27; --dsw-alias-bg-overlay:#2C3830; --dsw-alias-bg-multi-select:#222B26;
    --dsw-alias-label-primary:#E5EFE8; --dsw-alias-label-secondary:#93A69B; --dsw-alias-label-tertiary:#6E8175; --dsw-alias-label-caption:#5A6B61;
    --dsw-alias-label-primary-dimmed:#D8E8DD;
    --dsw-alias-border-l1:rgba(43,217,126,.12); --dsw-alias-border-l2:rgba(43,217,126,.20); --dsw-alias-border-l3:rgba(43,217,126,.28); --dsw-alias-border-l2-darkmode-thin:rgba(43,217,126,.12);
    --dsw-specific-sidebar-fill:#161C18; --dsw-specific-menu:#1E2621; --dsw-specific-input-major:#222B26; --dsw-specific-selector:#263029; --dsw-specific-tip:#232C27;
    --dsw-alias-scrollbar-bg-l1:#2A352D; --dsw-alias-scrollbar-bg-l2:#2A352D;
    --dsw-alias-button-floating-fill:#1E2621; --dsw-alias-button-floating-hover:#2B362F;
  }

  /* — 预设 3 · 樱粉白 (老B站粉白): playful, soft pink — */
  html.${HTML_CLASS}[data-dsh-theme="bilibili"] { --dsh-theme-accent: #FB7299; }
  html.${HTML_CLASS}[data-dsh-theme="bilibili"] body {
    --dsw-alias-bg-base:#FFF5F7; --dsw-alias-bg-layer-1:#FFFFFF; --dsw-alias-bg-layer-2:#FEF0F3; --dsw-alias-bg-layer-3:#FDE4EA;
    --dsw-alias-bg-module-platform:#FEEFF2; --dsw-alias-bg-overlay:#FCE3E8; --dsw-alias-bg-multi-select:#FEEFF2;
    --dsw-alias-label-primary:#2B1E26; --dsw-alias-label-secondary:#6E5860; --dsw-alias-label-tertiary:#9A828B; --dsw-alias-label-caption:#B7A0A8;
    --dsw-alias-label-primary-dimmed:#2B1E26;
    --dsw-alias-border-l1:rgba(251,114,153,.10); --dsw-alias-border-l2:rgba(251,114,153,.16); --dsw-alias-border-l3:rgba(251,114,153,.24); --dsw-alias-border-l2-darkmode-thin:rgba(251,114,153,.10);
    --dsw-specific-sidebar-fill:#FFF8FA; --dsw-specific-menu:#FFFFFF; --dsw-specific-input-major:#FFFFFF; --dsw-specific-selector:#FEF0F3; --dsw-specific-tip:#FEF0F3;
    --dsw-alias-scrollbar-bg-l1:#F9E4EA; --dsw-alias-scrollbar-bg-l2:#F9E4EA;
    --dsw-alias-button-floating-fill:#FFFFFF; --dsw-alias-button-floating-hover:#FEEAF0;
  }
  html.${HTML_CLASS}[data-dsh-theme="bilibili"] body[data-ds-dark-theme] {
    --dsw-alias-bg-base:#181318; --dsw-alias-bg-layer-1:#211A20; --dsw-alias-bg-layer-2:#2B222A; --dsw-alias-bg-layer-3:#362B38;
    --dsw-alias-bg-module-platform:#2B222A; --dsw-alias-bg-overlay:#362B38; --dsw-alias-bg-multi-select:#2B222A;
    --dsw-alias-label-primary:#F2E7EC; --dsw-alias-label-secondary:#A88E99; --dsw-alias-label-tertiary:#7C6770; --dsw-alias-label-caption:#6B565F;
    --dsw-alias-label-primary-dimmed:#E9DBE2;
    --dsw-alias-border-l1:rgba(255,143,177,.14); --dsw-alias-border-l2:rgba(255,143,177,.22); --dsw-alias-border-l3:rgba(255,143,177,.30); --dsw-alias-border-l2-darkmode-thin:rgba(255,143,177,.14);
    --dsw-specific-sidebar-fill:#1C161C; --dsw-specific-menu:#241C23; --dsw-specific-input-major:#2B222A; --dsw-specific-selector:#302730; --dsw-specific-tip:#2B222A;
    --dsw-alias-scrollbar-bg-l1:#3A2E38; --dsw-alias-scrollbar-bg-l2:#3A2E38;
    --dsw-alias-button-floating-fill:#241C23; --dsw-alias-button-floating-hover:#362B38;
  }

  /* 3-button theme toolbar (replaces the native cubes) */
  html.${HTML_CLASS} .dshMobThemeBar {
    display: flex !important;
    flex: 1 1 100% !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 4px !important;
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
    padding: 10px 6px !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent !important;
    touch-action: manipulation !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobThemeBtn[data-active="true"] {
    border-color: var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) !important;
    box-shadow: inset 0 0 0 1.5px var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) !important;
    color: var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) !important;
    font-weight: 700 !important;
    background: color-mix(in srgb, var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) 12%, var(--dsw-alias-bg-base, #fff)) !important;
  }

  /* 自定义 card — bottom-sheet */
  html.${HTML_CLASS} .dshMobThemeMask {
    position: fixed !important;
    inset: 0 !important;
    z-index: 1300 !important; /* above the lifted settings sidebar (1001) / body dialogs */
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
    display: none !important;
    align-items: flex-end !important;
    justify-content: center !important;
    padding: 12px !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .dshMobThemeMask[data-open="true"] { display: flex !important; }
  html.${HTML_CLASS} .dshMobThemeSheet {
    width: 100% !important;
    max-width: 480px !important;
    max-height: min(82vh, 82dvh) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 20px 20px 14px 14px !important;
    padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px)) !important;
    box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.2)) !important;
  }
  html.${HTML_CLASS} .dshMobThemeSheet h4 { margin: 0 0 4px !important; font-size: 15px !important; color: var(--dsw-alias-label-primary, #0f1115) !important; }
  html.${HTML_CLASS} .dshMobThemeSub { margin: 0 0 12px !important; font-size: 12px !important; color: var(--dsw-alias-label-tertiary, #81858c) !important; }
  html.${HTML_CLASS} .dshMobThemePresets { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
  html.${HTML_CLASS} .dshMobThemePreset {
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    border-radius: 14px !important; padding: 10px !important;
    background: var(--dsw-alias-bg-layer-1, #fff) !important; cursor: pointer !important; text-align: left !important;
  }
  html.${HTML_CLASS} .dshMobThemePreset[data-active="true"] {
    border-color: var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) !important;
    box-shadow: inset 0 0 0 1px var(--dsh-theme-accent, var(--dsw-alias-state-business-primary, #4176e6)) !important;
  }
  html.${HTML_CLASS} .dshMobThemePresetSwatch { height: 36px !important; border-radius: 9px !important; margin-bottom: 7px !important; border: 1px solid rgba(0,0,0,.08) !important; }
  html.${HTML_CLASS} .dshMobThemePresetName { font-size: 12px !important; font-weight: 600 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; }
  html.${HTML_CLASS} .dshMobThemePresetDesc { font-size: 10.5px !important; color: var(--dsw-alias-label-tertiary, #81858c) !important; }
  html.${HTML_CLASS} .dshMobThemePalLabel { margin: 14px 0 8px !important; font-size: 12.5px !important; font-weight: 600 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; }
  html.${HTML_CLASS} .dshMobThemePalette { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; }
  html.${HTML_CLASS} .dshMobThemeDot { width: 34px !important; height: 34px !important; border-radius: 50% !important; cursor: pointer !important; border: 1px solid rgba(0,0,0,.14) !important; flex: none !important; }
  html.${HTML_CLASS} .dshMobThemeDot[data-active="true"] { outline: 2px solid var(--dsw-alias-label-primary, #0f1115) !important; outline-offset: 2px !important; }
  html.${HTML_CLASS} .dshMobThemeClose { margin-top: 14px !important; width: 100% !important; padding: 11px !important; border-radius: 12px !important; border: none !important; background: var(--dsw-alias-bg-module-platform, #f5f6f7) !important; color: var(--dsw-alias-label-primary, #0f1115) !important; font-size: 14px !important; font-weight: 600 !important; -webkit-tap-highlight-color: transparent !important; touch-action: manipulation !important; }

  /* ===== R6 — zoom (font-scale reflow) + long-message fold (mobile only) ===== */
  /* Zoom: --dsw-chat-font-scale drives EVERY chat text (AI + user body, tool-call /
     context-injection badges, action labels, time/meta, icons) so it all REFLOWS
     (not transform:scale — no blur). Every element gets a FIXED base px * var, so nested
     text never compounds and everything stays uniform. */
  html.${HTML_CLASS} [class*="_flowItem"] p,
  html.${HTML_CLASS} [class*="_flowItem"] li,
  html.${HTML_CLASS} [class*="_flowItem"] span,
  html.${HTML_CLASS} [class*="_flowItem"] div,
  html.${HTML_CLASS} [class*="_flowItem"] strong,
  html.${HTML_CLASS} [class*="_flowItem"] em,
  html.${HTML_CLASS} [class*="_flowItem"] a,
  html.${HTML_CLASS} [class*="_flowItem"] td,
  html.${HTML_CLASS} [class*="_flowItem"] blockquote,
  html.${HTML_CLASS} [class*="_flowItem"] time,
  html.${HTML_CLASS} [class*="_userRow"] p,
  html.${HTML_CLASS} [class*="_userRow"] span,
  html.${HTML_CLASS} [class*="_userRow"] div,
  html.${HTML_CLASS} [class*="_userRow"] a {
    font-size: calc(14px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.7 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Markdown/rich-text HEADINGS scale with the zoom too (each keeps its hierarchy). */
  html.${HTML_CLASS} [class*="_flowItem"] h1,
  html.${HTML_CLASS} [class*="_userRow"] h1 {
    font-size: calc(24px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.3 * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] h2,
  html.${HTML_CLASS} [class*="_userRow"] h2 {
    font-size: calc(20px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.35 * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] h3,
  html.${HTML_CLASS} [class*="_userRow"] h3 {
    font-size: calc(17px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.4 * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] h4,
  html.${HTML_CLASS} [class*="_flowItem"] h5,
  html.${HTML_CLASS} [class*="_flowItem"] h6,
  html.${HTML_CLASS} [class*="_userRow"] h4,
  html.${HTML_CLASS} [class*="_userRow"] h5,
  html.${HTML_CLASS} [class*="_userRow"] h6 {
    font-size: calc(15px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] pre,
  html.${HTML_CLASS} [class*="_flowItem"] code,
  html.${HTML_CLASS} [class*="_userRow"] code {
    font-size: calc(12.5px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Action labels (复制/好/坏/分支) + time/meta scale together, slimmer base. */
  html.${HTML_CLASS} [class*="_flowItem"] [class*="_action"],
  html.${HTML_CLASS} [class*="_flowItem"] [class*="_actions"] button,
  html.${HTML_CLASS} [class*="_flowItem"] [class*="time"] {
    font-size: calc(12px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.4 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Tool-call (Tool call …) + context-injection (上下文注入 …) rows also scale, wherever
     they render under the chat scroll, so special message text is never left at 14px. */
  html.${HTML_CLASS} [class*="_toolCall"],
  html.${HTML_CLASS} [class*="_toolCallTitle"],
  html.${HTML_CLASS} [class*="_toolRow"],
  html.${HTML_CLASS} [class*="_toolTitle"],
  html.${HTML_CLASS} [class*="_contextInj"],
  html.${HTML_CLASS} [class*="_contextInject"],
  html.${HTML_CLASS} [class*="_inject"],
  html.${HTML_CLASS} [class*="_contextRow"],
  html.${HTML_CLASS} [class*="_context"] {
    font-size: calc(14px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Tool-call / context-injection block INTERNAL text (name/summary/params) + icons
     scale too — not just the container — so nothing is stuck at the 16px base. */
  html.${HTML_CLASS} [class*="_toolCall"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_toolRow"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_toolTitle"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_contextInj"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_contextInject"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_inject"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_contextRow"] :is(p, span, div, strong, em, a, code, pre, time),
  html.${HTML_CLASS} [class*="_context"] :is(p, span, div, strong, em, a, code, pre, time) {
    font-size: calc(14px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Trace / tool-command rows ("Edit · path", "Read · path", "Tool call …") render in a
     _callRow container with file-link BUTTONs — scale their text + buttons too, so the
     command labels reflow with the rest of the chat. */
  html.${HTML_CLASS} [class*="_callRow"] button,
  html.${HTML_CLASS} [class*="_callRow"] [class*="fileLink"],
  html.${HTML_CLASS} [class*="_callRow"] [class*="_title"],
  html.${HTML_CLASS} [class*="_callRow"] [class*="_name"],
  html.${HTML_CLASS} [class*="_callRow"] p,
  html.${HTML_CLASS} [class*="_callRow"] span,
  html.${HTML_CLASS} [class*="_callRow"] div {
    font-size: calc(14px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_callRow"] svg,
  html.${HTML_CLASS} [class*="_callRow"] [class*="fileLink"] svg {
    width: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
    height: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_callRow"] [class*="_summary"] {
    font-size: calc(12px * var(--dsw-chat-font-scale, 1)) !important;
    line-height: calc(1.4 * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Tool-call / think / context ROW CONTAINERS: keep only a TIGHT scaled spacing so
     the rows shrink with the font without ballooning (previous base was too wide).
     Also clear the native fixed min-height that keeps these rows tall regardless of
     the zoom — the row must hug its (scaled) content so spacing reflows. */
  html.${HTML_CLASS} [class*="_callRow"] [class*="_row"],
  html.${HTML_CLASS} [data-variant="think"] [class*="_row"],
  html.${HTML_CLASS} [class*="_toolCall"] [class*="_row"],
  html.${HTML_CLASS} [class*="_contextInj"] [class*="_row"],
  html.${HTML_CLASS} [class*="_context"] [class*="_row"],
  html.${HTML_CLASS} [class*="_callRow"] [class*="_root"],
  html.${HTML_CLASS} [data-variant="think"] [class*="_root"] {
    padding-block: calc(1px * var(--dsw-chat-font-scale, 1)) !important;
    row-gap: calc(2px * var(--dsw-chat-font-scale, 1)) !important;
    column-gap: calc(4px * var(--dsw-chat-font-scale, 1)) !important;
    min-height: 0 !important;
    height: auto !important;
  }
  html.${HTML_CLASS} [class*="_callRow"],
  html.${HTML_CLASS} [data-variant="think"],
  html.${HTML_CLASS} [class*="_toolCall"],
  html.${HTML_CLASS} [class*="_contextInj"],
  html.${HTML_CLASS} [class*="_context"] {
    line-height: calc(1.5 * var(--dsw-chat-font-scale, 1)) !important;
    min-height: 0 !important;
  }
  html.${HTML_CLASS} [class*="_tool"] svg,
  html.${HTML_CLASS} [class*="_context"] svg,
  html.${HTML_CLASS} [class*="_inject"] svg,
  html.${HTML_CLASS} [class*="inject"] svg {
    width: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
    height: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Inline icons (SVG in buttons / meta) scale so the whole UI grows together. */
  html.${HTML_CLASS} [class*="_flowItem"] svg,
  html.${HTML_CLASS} [class*="_userRow"] svg {
    width: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
    height: calc(16px * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Message-level spacing reflows with the text. */
  html.${HTML_CLASS} [class*="_flowItem"] {
    row-gap: calc(8px * var(--dsw-chat-font-scale, 1)) !important;
    column-gap: calc(8px * var(--dsw-chat-font-scale, 1)) !important;
  }
  /* Paragraph/list margins + action-row gap/icon padding scale with the text so spacing
     stays proportionate at every zoom level (aesthetic: no cramped gaps at small text). */
  html.${HTML_CLASS} [class*="_flowItem"] p,
  html.${HTML_CLASS} [class*="_flowItem"] li,
  html.${HTML_CLASS} [class*="_userRow"] p {
    margin: calc(4px * var(--dsw-chat-font-scale, 1)) 0 !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] [class*="_actions"] {
    gap: calc(4px * var(--dsw-chat-font-scale, 1)) calc(8px * var(--dsw-chat-font-scale, 1)) !important;
  }
  html.${HTML_CLASS} [class*="_flowItem"] [class*="_action"] {
    padding: calc(6px * var(--dsw-chat-font-scale, 1)) !important;
  }

  /* Zoom bottom-sheet (reuses the theme sheet look; z above the lifted sidebar). */
  html.${HTML_CLASS} .dshMobZoomMask {
    position: fixed !important; inset: 0 !important; z-index: 1300 !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
    display: none !important; align-items: flex-end !important; justify-content: center !important;
    padding: 12px !important; box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .dshMobZoomMask[data-open="true"] { display: flex !important; }
  html.${HTML_CLASS} .dshMobZoomSheet {
    width: 100% !important; max-width: 400px !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 18px !important;
    padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px)) !important;
    box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.2)) !important;
  }
  html.${HTML_CLASS} .dshMobZoomSheet h4 { margin: 0 0 4px !important; font-size: 15px !important; color: var(--dsw-alias-label-primary, #0f1115) !important; }
  html.${HTML_CLASS} .dshMobZoomCur { font-size: 26px !important; font-weight: 700 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; text-align: center !important; margin: 6px 0 !important; }
  html.${HTML_CLASS} .dshMobZoomRow { display: flex !important; align-items: center !important; gap: 10px !important; }
  html.${HTML_CLASS} .dshMobZoomBtn {
    appearance: none !important; border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12)) !important;
    background: var(--dsw-alias-bg-layer-1, #fff) !important; color: var(--dsw-alias-label-primary, #0f1115) !important;
    width: 44px !important; height: 44px !important; border-radius: 12px !important; font-size: 20px !important; font-weight: 700 !important;
    cursor: pointer !important; -webkit-tap-highlight-color: transparent !important; touch-action: manipulation !important; flex: none !important;
  }
  html.${HTML_CLASS} .dshMobZoomRange { flex: 1 1 auto !important; min-width: 0 !important; accent-color: var(--dsw-alias-state-business-primary, #4176e6) !important; }
  html.${HTML_CLASS} .dshMobZoomReset {
    width: 100% !important; margin-top: 12px !important; padding: 10px !important; border-radius: 12px !important;
    border: none !important; background: var(--dsw-alias-bg-module-platform, #f5f6f7) !important;
    color: var(--dsw-alias-label-primary, #0f1115) !important; font-size: 14px !important; font-weight: 600 !important;
    -webkit-tap-highlight-color: transparent !important; touch-action: manipulation !important;
  }

  /* Whale-FAB long-press → primary function MENU (array-driven, extensible).
     Centered popover card (not a bottom sheet) with a light pop-in animation. */
  html.${HTML_CLASS} .dshMobFuncMask {
    position: fixed !important; inset: 0 !important; z-index: 1350 !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
    display: none !important; align-items: center !important; justify-content: center !important;
    padding: 24px !important; box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .dshMobFuncMask[data-open="true"] { display: flex !important; }
  html.${HTML_CLASS} .dshMobFuncSheet {
    width: min(100%, 320px) !important;
    height: min(50vh, 420px) !important;
    display: flex !important; flex-direction: column !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 22px !important;
    padding: 16px !important;
    box-shadow: var(--dsw-shadow-lv3, 0 18px 56px rgba(0,0,0,.28)) !important;
    animation: dshMobPop .18s ease !important;
    user-select: none !important; -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobFuncList { overflow-y: auto !important; flex: 1 1 auto !important; min-height: 0 !important; }
  /* Composer bottom status bar: hide per-line (1 = 轮·步·LLM·工具调用·首token,
     2 = 缓存命中·输入输出). The spans are tagged with data-dsh-line by JS; hiding
     them frees the bottom space so the input area moves down (no blank bar). */
  html.${HTML_CLASS}[data-dsh-stats1="0"] [data-dsh-line="1"] { display: none !important; }
  html.${HTML_CLASS}[data-dsh-stats2="0"] [data-dsh-line="2"] { display: none !important; }
  /* 首 token = own line (3): same hide/reveal mechanism as line1/line2. The reveal rule
     carries the [data-dsh-stats3="1"] prefix the same way the initial working version
     did (DSH ships this span display:none — data is available via its API). */
  html.${HTML_CLASS}[data-dsh-stats3="0"] [data-dsh-line="3"] { display: none !important; }
  html.${HTML_CLASS}[data-dsh-stats3="1"] [data-dsh-line="3"] { display: inline-block !important; }
  /* Upload-image button (composer, top-right) toggle. */
  html.${HTML_CLASS}[data-dsh-upload="0"] .dshMobImg_btn { display: none !important; }
  /* WebUI tools app tiles: dimmed when their feature is switched off. */
  html.${HTML_CLASS} .dshMobFuncApp.off .dshMobFuncAppIcon { opacity: .4 !important; }
  html.${HTML_CLASS} .dshMobFuncApp.off .dshMobFuncAppName { opacity: .5 !important; }
  @keyframes dshMobPop {
    from { opacity: 0; transform: scale(.94) translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  html.${HTML_CLASS} .dshMobFuncTitle { margin: 2px 6px 12px !important; font-size: 14px !important; font-weight: 700 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; letter-spacing: .02em !important; }
  /* App grid: each tool is an app tile (icon + name), like a phone drawer. */
  html.${HTML_CLASS} .dshMobFuncGrid {
    display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 10px !important; overflow-y: auto !important; flex: 1 1 auto !important; min-height: 0 !important;
    align-content: start !important;
  }
  html.${HTML_CLASS} .dshMobFuncApp {
    display: flex !important; flex-direction: column !important; align-items: center !important; gap: 7px !important;
    padding: 14px 6px !important; border: none !important; border-radius: 18px !important;
    background: transparent !important; color: var(--dsw-alias-label-primary, #0f1115) !important;
    cursor: pointer !important; -webkit-tap-highlight-color: transparent !important; touch-action: manipulation !important;
    user-select: none !important; -webkit-user-select: none !important;
    transition: background .15s ease, transform .1s ease !important;
  }
  html.${HTML_CLASS} .dshMobFuncApp:active { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)) !important; transform: scale(.96) !important; }
  html.${HTML_CLASS} .dshMobFuncAppIcon {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    width: 52px !important; height: 52px !important; border-radius: 16px !important;
    background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4176e6) 12%, var(--dsw-alias-bg-base, #fff)) !important;
    color: var(--dsw-alias-state-business-primary, #4176e6) !important; flex: none !important;
  }
  html.${HTML_CLASS} .dshMobFuncAppName { font-size: 12px !important; font-weight: 500 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; text-align: center !important; }
  /* 底栏信息 detail panel — DSH-native settings-card look (not cartoonish). */
  html.${HTML_CLASS} .dshMobStatsMask {
    position: fixed !important; inset: 0 !important; z-index: 1360 !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
    display: none !important; align-items: center !important; justify-content: center !important;
    padding: 24px !important; box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .dshMobStatsMask[data-open="true"] { display: flex !important; }
  html.${HTML_CLASS} .dshMobStatsSheet {
    width: min(100%, 320px) !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 20px !important;
    padding: 10px !important;
    box-shadow: var(--dsw-shadow-lv2, 0 10px 36px rgba(0,0,0,.22)) !important;
    animation: dshMobPop .18s ease !important;
    user-select: none !important; -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobStatsSheet .dshMobFuncTitle { margin: 6px 10px 4px !important; }
  html.${HTML_CLASS} .dshMobStatsRow {
    display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important;
    padding: 12px 10px !important; border-radius: 12px !important;
  }
  html.${HTML_CLASS} .dshMobStatsRow:active { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.04)) !important; }
  html.${HTML_CLASS} .dshMobStatsLabel { font-size: 13.5px !important; font-weight: 500 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; }
  html.${HTML_CLASS} .dshMobStatsSwitch {
    position: relative !important; flex: none !important; width: 44px !important; height: 26px !important;
    border-radius: 999px !important; border: none !important; padding: 0 !important;
    background: var(--dsw-alias-bg-overlay, #e2e6ec) !important;
    cursor: pointer !important; -webkit-tap-highlight-color: transparent !important; touch-action: manipulation !important;
    transition: background .18s ease !important;
  }
  html.${HTML_CLASS} .dshMobStatsSwitch::after {
    content: '' !important; position: absolute !important; top: 2px !important; left: 2px !important;
    width: 22px !important; height: 22px !important; border-radius: 50% !important;
    background: var(--dsw-alias-bg-base, #fff) !important;
    box-shadow: 0 1px 3px rgba(0,0,0,.25) !important;
    transition: left .18s ease !important;
  }
  html.${HTML_CLASS} .dshMobStatsSwitch.on { background: var(--dsw-alias-state-success-primary, #07c160) !important; }
  html.${HTML_CLASS} .dshMobStatsSwitch.on::after { left: 20px !important; }
  html.${HTML_CLASS} .dshMobStatsSwitch[aria-checked="true"] { background: var(--dsw-alias-state-business-primary, #4176e6) !important; }
  /* 关于 panel — DSH-native settings card with an intro + app explanations. */
  html.${HTML_CLASS} .dshMobAboutMask {
    position: fixed !important; inset: 0 !important; z-index: 1360 !important;
    background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
    display: none !important; align-items: center !important; justify-content: center !important;
    padding: 24px !important; box-sizing: border-box !important;
  }
  html.${HTML_CLASS} .dshMobAboutMask[data-open="true"] { display: flex !important; }
  html.${HTML_CLASS} .dshMobAboutSheet {
    width: min(100%, 340px) !important; max-height: 70vh !important; overflow-y: auto !important;
    background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
    border-radius: 20px !important; padding: 14px !important;
    box-shadow: var(--dsw-shadow-lv2, 0 10px 36px rgba(0,0,0,.22)) !important;
    animation: dshMobPop .18s ease !important;
    user-select: none !important; -webkit-user-select: none !important;
  }
  html.${HTML_CLASS} .dshMobAboutSheet .dshMobFuncTitle { margin: 6px 10px 4px !important; }
  html.${HTML_CLASS} .dshMobAboutIntro { font-size: 12.5px !important; line-height: 1.6 !important; color: var(--dsw-alias-label-secondary, #5c6068) !important; padding: 8px 10px 10px !important; }
  html.${HTML_CLASS} .dshMobAboutItem { padding: 10px 10px !important; border-top: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.06)) !important; }
  html.${HTML_CLASS} .dshMobAboutName { font-size: 13.5px !important; font-weight: 600 !important; color: var(--dsw-alias-label-primary, #0f1115) !important; margin-bottom: 3px !important; }
  html.${HTML_CLASS} .dshMobAboutDesc { font-size: 12.5px !important; line-height: 1.6 !important; color: var(--dsw-alias-label-secondary, #5c6068) !important; }
  html.${HTML_CLASS} .dshMobThemeClose { margin-top: 10px !important; }
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
  -webkit-touch-callout: none;
  user-select: none;
}
.dshMobMenu:active {
  background: var(--dsw-alias-button-floating-hover, #f3f4f6);
}
.dshMobMenu svg {
  width: 22px;
  height: auto;
  display: block;
  pointer-events: none; /* long-press lands on the button, not the icon (no image-save menu) */
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

    function installWebuiToolsEntry() {
      if (typeof document === 'undefined' || !window.MutationObserver) return
      let row = null
      const disposeRow = () => { if (row && row.isConnected) row.remove(); row = null }
      const ensure = () => {
        if (!mobileDomAllowed()) { disposeRow(); return }
        const dialog = document.querySelector('[aria-modal="true"]')
        if (!dialog) { disposeRow(); return }
        const options = dialog.querySelector('[class*="_options"]')
        // General settings tab (checked by 外观 text) — the home of this entry
        if (!options || !/外观/.test(options.textContent || '')) { disposeRow(); return }
        if (row && row.parentElement === options) return
        disposeRow()
        row = document.createElement('div')
        row.className = 'dshMobCfgRow'
        row.setAttribute('role', 'button')
        const label = document.createElement('span'); label.textContent = 'WebUI 工具'
        const chev = document.createElement('span'); chev.className = 'dshMobCfgRowChev'; chev.textContent = '›'
        row.appendChild(label); row.appendChild(chev)
        row.addEventListener('click', () => {
          try { document.dispatchEvent(new CustomEvent('dsh-webui-tools-open')) } catch (_) {}
        })
        options.appendChild(row)
      }
      const observer = new MutationObserver(ensure)
      observer.observe(document.body, { childList: true, subtree: true })
      let mql = null
      const onMq = () => ensure()
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

    // R1 — subagent breadcrumb: single-letter naming per level (display-only, MOBILE ONLY).
    // The breadcrumb nav is [class$="_crumbs"], its children [class$="_crumbSeg"]
    // in root→leaf order. The LEFTMOST crumb is the main agent: default label
    // 主代理, tap → expand to the session's real name, tap again / blur elsewhere → restore.
    // Every deeper crumb is a subagent and gets its sibling-order letter (A, B, C…)
    // computed from the session store's per-parent child catalog (creation order).
    // The "N 个子代理" count becomes "N 子代".
    //
    // STRICT mobile gate: all DOM mutation, event listeners, observers and the session
    // subscription are installed ONLY while mobileDomAllowed() is true (viewport ≤1023px).
    // When the viewport leaves mobile (or on teardown) everything is unregistered and the
    // crumb DOM is restored to its native state, so the desktop breadcrumb stays native and
    // the crumb keeps its native click-to-navigate behavior.
    function installSubagentCrumbRename(getSessions) {
      if (typeof document === 'undefined' || !window.MutationObserver) return undefined
      const MAIN_LABEL = '主代理'
      const CRUMB_FULL = 'data-dsh-crumb-full'
      const ORIG = 'data-dsh-crumb-orig'
      let raf = 0
      let storeUnsub = null
      let mainCrumbEl = null
      // Two-step reveal per crumb level: 1st tap shows that crumb's real name;
      // 2nd tap runs the native click (jump to that level, or expand its children).
      // revealedIndex = which crumbSeg is revealed (-1 = none).
      let revealedIndex = -1
      let alive = true
      // Only true while mobile is active; drives setup/teardown of everything below.
      let mobile = false
      let navObs = null
      let navObsTarget = null
      let bodyObs = null
      let mql = null

      const indexToLetter = (n) => (Number.isInteger(n) && n >= 0 ? String.fromCharCode(65 + (n % 26)) : '')

      // Restore every mobile mutation back to the native crumb DOM. Idempotent and safe to
      // call for a nav that is absent (no-op) or already native. Runs when leaving mobile.
      const restoreNative = () => {
        const nav = document.querySelector('[class$="_crumbs"]')
        if (!nav) return
        for (const btn of nav.querySelectorAll('button[class*="_crumb"]')) {
          const full = btn.getAttribute(CRUMB_FULL)
          if (full) btn.textContent = full
          btn.removeAttribute(CRUMB_FULL)
          btn.removeAttribute(ORIG)
        }
        for (const el of nav.querySelectorAll('[class$="_switcherTitle"]')) {
          const orig = el.getAttribute(ORIG)
          if (orig) el.textContent = orig
          el.removeAttribute(ORIG)
        }
        for (const el of nav.querySelectorAll('span')) {
          if (el.childElementCount) continue
          const orig = el.getAttribute(ORIG)
          if (orig) {
            el.textContent = orig
            el.removeAttribute(ORIG)
          }
        }
      }

      const crumbOff = () => { try { const s = JSON.parse(localStorage.getItem('dsh-webui-tools-v1') || 'null'); return !!(s && s.breadcrumb === false) } catch (_) { return false } }
      const applyRename = () => {
        raf = 0
        if (!alive) return
        if (!mobileDomAllowed() || crumbOff()) {
          restoreNative()
          return
        }
        const nav = document.querySelector('[class$="_crumbs"]')
        if (!nav) return
        const sessions = getSessions && getSessions()
        const snap = sessions && sessions.list && sessions.list.getSnapshot
          ? sessions.list.getSnapshot()
          : null
        const byId = snap && snap.byId
        const subByParent = snap && snap.subagentsByParent
        // Rebuild the ancestry path the same way the crumb nav does: walk upward
        // from the current session to the first non-subagent (the main agent), then
        // unshift so the result is root→leaf, matching the crumbSeg DOM order.
        const chain = []
        if (byId && snap.current !== void 0) {
          let cur = snap.current
          const seen = new Set()
          while (cur !== void 0 && !seen.has(cur) && byId[cur]) {
            seen.add(cur)
            const s = byId[cur]
            chain.unshift({ id: s.id, displayTitle: s.displayTitle, parentId: s.parentId, subagent: s.origin === 'subagent' })
            if (s.origin !== 'subagent') break
            cur = s.parentId
          }
        }
        const segs = Array.from(nav.querySelectorAll(':scope > [class$="_crumbSeg"]'))
        if (segs.length === 0) return
        // Only apply the single-letter scheme to a real subagent lineage; a plain
        // session's breadcrumb (no count/switcher, single crumb) stays native.
        const hasSubagent = segs.length > 1 || !!nav.querySelector('[class$="_trigger"], [class$="_switcherTrigger"]')
        if (!hasSubagent) return

        const letterOf = (childId, parentId) => {
          if (!subByParent || parentId === void 0 || !childId) return ''
          const cat = subByParent[parentId]
          let children = cat && Array.isArray(cat.entries) ? cat.entries.filter((e) => e.kind === 'child') : []
          if (children.length === 0 && byId) children = Object.values(byId).filter((s) => s.parentId === parentId && s.origin === 'subagent')
          return indexToLetter(children.findIndex((e) => e.id === childId))
        }
        // The element to rename/reveal on each crumb level (crumbElOf is defined
        // at effect scope so the click handler and applyRename agree): main agent is
        // a crumb button; deeper levels are switcher-title triggers ("expand own
        // children"), which are what carry the letters.

        // Label every crumb level: main = 「主代理」, deeper = sibling-order letter.
        // A revealed level shows its real name; a non-revealed one shows the label.
        segs.forEach((seg, index) => {
          const el = crumbElOf(seg)
          if (!el) return
          if (!el.hasAttribute(CRUMB_FULL)) el.setAttribute(CRUMB_FULL, (el.textContent || '').trim())
          const full = el.getAttribute(CRUMB_FULL) || ''
          let label
          if (index === 0) {
            mainCrumbEl = el
            label = revealedIndex === 0 ? full : MAIN_LABEL
          } else {
            const node = chain[index]
            if (!node || node.subagent === false) return
            const letter = letterOf(node.id, node.parentId)
            if (!letter) return
            label = revealedIndex === index ? full : letter
          }
          if (el.textContent !== label) el.textContent = label
        })

        // Count text: "N 个子代理" → "N 子代".
        for (const el of nav.querySelectorAll('span')) {
          if (el.childElementCount) continue
          const m = /^(\d+)\s*个子代理$/.exec((el.textContent || '').trim())
          if (m) {
            const want = `${m[1]} 子代`
            if (!el.hasAttribute(ORIG)) el.setAttribute(ORIG, el.textContent)
            if (el.textContent.trim() !== want) el.textContent = want
          }
        }
      }

      const schedule = () => {
        if (!alive || !mobile) return
        if (raf) return
        raf = requestAnimationFrame(() => {
          try {
            ensureNavObserver()
            applyRename()
          } catch (_) {
            raf = 0
          }
        })
      }

      const ensureNavObserver = () => {
        const nav = document.querySelector('[class$="_crumbs"]')
        if (nav && nav !== navObsTarget) {
          navObs?.disconnect()
          navObs = new MutationObserver(schedule)
          navObs.observe(nav, { childList: true, subtree: true, characterData: true })
          navObsTarget = nav
        } else if (!nav && navObs) {
          navObs.disconnect()
          navObs = null
          navObsTarget = null
        }
      }

      // Two-step crumb interaction that also works on the MAIN-AGENT page where the
      // leftmost crumb is the current session and is disabled (a disabled button
      // never fires click, so the reveal is driven by pointerdown instead): 1st tap
      // reveals the crumb's real name (and suppresses the following click so it does
      // Two-step per crumb level (works per crumb, incl. the disabled main crumb whose
      // button never fires click): 1st tap reveals that crumb's real name and swallows
      // the click that follows (so no jump / no children-expand yet); 2nd tap lets the
      // native click run — jump to that level if it is an ancestor, or expand its own
      // children if it is the current level. Tapping elsewhere reverts to the label.
      // The renameable/revealable element on a crumb level: main agent is a crumb
      // button; deeper levels are switcher-title triggers. The "N 子代" count text is
      // NOT part of this, so tapping it keeps its native "expand the subagent list".
      const crumbElOf = (seg) => seg.querySelector('button[class*="_crumb"]') || seg.querySelector('[class$="_switcherTitle"]')
      const crumbIndex = (target) => {
        if (!(target instanceof Element)) return -1
        const nav = document.querySelector('[class$="_crumbs"]')
        if (!nav) return -1
        const segs = Array.from(nav.querySelectorAll(':scope > [class$="_crumbSeg"]'))
        const seg = target.closest('[class$="_crumbSeg"]')
        if (!seg) return -1
        const idx = segs.indexOf(seg)
        if (idx < 0) return -1
        const el = crumbElOf(seg)
        if (!el) return -1
        // only reveal when the tap is on the crumb label itself, not the count/others
        if (!(target === el || el.contains(target))) return -1
        return idx
      }
      let suppressClick = false
      const onCrumbPointerDown = (e) => {
        if (!mobileDomAllowed()) return
        const idx = crumbIndex(e.target)
        if (idx < 0) return
        if (idx !== revealedIndex) {
          revealedIndex = idx
          suppressClick = true // swallow the click that follows this tap → no jump/expand
          schedule()
        }
      }
      const onCrumbClick = (e) => {
        if (!mobileDomAllowed()) return
        if (suppressClick) {
          suppressClick = false
          e.preventDefault()
          e.stopPropagation()
        }
        // Otherwise let the native click run (2nd tap: jump / expand children).
      }
      const onDocPointerDown = (e) => {
        if (!mobileDomAllowed()) return
        if (revealedIndex < 0) return
        if (crumbIndex(e.target) >= 0) return
        revealedIndex = -1
        suppressClick = false
        schedule()
      }

      // Install every mobile-only side effect. Called only when the viewport is mobile.
      const setupMobile = () => {
        const sessions = getSessions && getSessions()
        if (sessions && sessions.list && typeof sessions.list.subscribe === 'function' && !storeUnsub) {
          storeUnsub = sessions.list.subscribe(schedule)
        }
        if (!bodyObs) bodyObs = new MutationObserver(schedule)
        bodyObs.observe(document.body, { childList: true, subtree: true })
        ensureNavObserver()
        document.addEventListener('click', onCrumbClick, true)
        document.addEventListener('pointerdown', onCrumbPointerDown, true)
        document.addEventListener('pointerdown', onDocPointerDown, true)
        document.addEventListener('dsh-webui-tools-changed', onToolsChanged, true)
        schedule()
      }
      const onToolsChanged = () => schedule()

      // Uninstall every mobile-only side effect and restore the native crumb DOM. Called
      // when the viewport leaves mobile, and on teardown. Desktop never sees mobile code.
      const teardownMobile = () => {
        if (storeUnsub) {
          storeUnsub()
          storeUnsub = null
        }
        if (navObs) {
          navObs.disconnect()
          navObs = null
          navObsTarget = null
        }
        if (bodyObs) {
          bodyObs.disconnect()
          bodyObs = null
        }
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        document.removeEventListener('click', onCrumbClick, true)
        document.removeEventListener('pointerdown', onCrumbPointerDown, true)
        document.removeEventListener('pointerdown', onDocPointerDown, true)
        document.removeEventListener('dsh-webui-tools-changed', onToolsChanged, true)
        revealedIndex = -1
        suppressClick = false
        mainCrumbEl = null
        restoreNative()
      }

      // Toggle the whole effect on/off at the mobile breakpoint.
      const onMq = () => {
        const next = mobileDomAllowed()
        if (next === mobile) return
        mobile = next
        if (mobile) setupMobile()
        else teardownMobile()
      }

      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      onMq()

      return () => {
        alive = false
        teardownMobile()
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    // R3 — model editor value readability assist. Single-line <input> fields can't wrap
    // (text-overflow:ellipsis does not apply to inputs), so long api urls / api keys /
    // model names get clipped. This sets a title tooltip AND, for any input whose text
    // overflows its box, injects a read-only wrapping sidecar line that shows the full
    // value so it is readable within one cell without hover. Mobile only — gated by
    // mobileDomAllowed(); teardown removes sidecars and titles.
    function installModelEditorTooltip() {
      if (typeof document === 'undefined' || !window.MutationObserver) return undefined
      let raf = 0
      let alive = true
      let mobile = false
      let bodyObs = null
      let mql = null

      // Remove any previously injected sidecar lines (defensive clean).
      const clearSidecars = () => {
        for (const el of document.querySelectorAll('[data-dsh-sidecar]')) el.remove()
      }

      const applyTooltips = () => {
        raf = 0
        if (!alive || !mobileDomAllowed()) return
        const inputs = document.querySelectorAll('[aria-modal="true"] [class$="_editor"] input[class$="_input"], [aria-modal="true"] [class$="_editor"] textarea[class$="_input"]')
        for (const input of inputs) {
          // Never expose a secret in plain text: keep the password mask (dot), skip the
          // title tooltip and the inline sidecar for type=password inputs, and remove
          // any that may have been injected before this guard. Textareas/selects pass
          // through (they are not secrets).
          if (input instanceof HTMLInputElement && input.type === 'password') {
            if (input.getAttribute('title')) input.removeAttribute('title')
            const prev = input.nextElementSibling
            if (prev && prev.hasAttribute('data-dsh-sidecar')) prev.remove()
            continue
          }
          const value = input.value ?? ''
          // Remove any sidecar node injected by an earlier build. Injecting a node
          // after a React-managed input is REMOVED by React on the next render and
          // re-inserted by our observer — an infinite remove/insert loop that shows
          // as high-frequency flicker/ghosting (repro: 添加模型). So we only use the
          // title tooltip attribute, which React never reconciles away.
          const prev = input.nextElementSibling
          if (prev && prev.hasAttribute('data-dsh-sidecar')) prev.remove()
          // Tooltip: full value on hover / long-press.
          if (value && input.getAttribute('title') !== value) input.setAttribute('title', value)
          else if (!value && input.getAttribute('title')) input.removeAttribute('title')
        }
      }

      const schedule = () => {
        if (!alive || !mobile) return
        if (raf) return
        raf = requestAnimationFrame(applyTooltips)
      }

      const setupMobile = () => {
        if (!bodyObs) bodyObs = new MutationObserver(schedule)
        bodyObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] })
        schedule()
      }
      const teardownMobile = () => {
        if (bodyObs) { bodyObs.disconnect(); bodyObs = null }
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
        clearSidecars()
      }
      const onMq = () => {
        const next = mobileDomAllowed()
        if (next === mobile) return
        mobile = next
        if (mobile) setupMobile()
        else teardownMobile()
      }

      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      onMq()

      return () => {
        alive = false
        teardownMobile()
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    // R5 — appearance themes (mobile only). DSH flips light/dark with a
    // `data-ds-dark-theme` attribute on <body> (setting it → dark, tested it sticks),
    // and the semantic palette lives as --dsw-alias-*/--dsw-specific-* custom props on
    // <body>. We drive both: keep the dark flag on body and override the palette on
    // html.dsh-mobile-shell via a [data-dsh-theme] attribute (preset) or an inline
    // --dsh-theme-accent (custom accent). A 3-button toolbar + a bottom-sheet replace
    // the native 浅色/深色/跟随系统 cubes (hidden by CSS). Mobile-only.
    function installThemeCustom() {
      if (typeof document === 'undefined' || !window.MutationObserver) return undefined
      const KEY = 'dsh-mobile-theme-v1'
      const PRESETS = [
        { id: 'qq', name: '晴空蓝', desc: 'QQ 蓝白', light: '#F4F8FF', dark: '#10141D', accent: '#2E7CF6' },
        { id: 'wechat', name: '青草绿', desc: '古早微信绿灰', light: '#EFF3EF', dark: '#131815', accent: '#07C160' },
        { id: 'bilibili', name: '樱粉白', desc: '老B站粉白', light: '#FFF5F7', dark: '#181318', accent: '#FB7299' },
      ]
      const DOTS = ['#2E7CF6', '#12B7F5', '#07C160', '#FB7299', '#FF7A45', '#8A6FFF', '#F5576C', '#F5A623']
      let alive = true, mobile = false
      let bodyObs = null, mql = null, sysMql = null
      let bar = null, mask = null

      const readState = () => {
        try {
          const s = JSON.parse(localStorage.getItem(KEY) || 'null')
          if (s && (s.mode === 'light' || s.mode === 'dark' || s.mode === 'system')) return s
        } catch (_) {}
        return { mode: 'system', theme: '', accent: '' }
      }
      const writeState = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch (_) {} }
      const isDark = (s) => s.mode === 'dark' ? true : s.mode === 'light' ? false : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)

      const apply = (s) => {
        const html = document.documentElement
        const dark = isDark(s)
        if (dark) document.body.setAttribute('data-ds-dark-theme', '')
        else document.body.removeAttribute('data-ds-dark-theme')
        html.classList.toggle('dsh-dark', dark)
        if (s.theme) { html.setAttribute('data-dsh-theme', s.theme); html.style.removeProperty('--dsh-theme-accent') }
        else if (s.accent) { html.setAttribute('data-dsh-theme', 'accent'); html.style.setProperty('--dsh-theme-accent', s.accent) }
        else { html.removeAttribute('data-dsh-theme'); html.style.removeProperty('--dsh-theme-accent') }
        syncBar(s)
      }

      const syncBar = (s) => {
        if (bar) {
          const dark = isDark(s)
          const tg = bar.querySelector('[data-mode="lightdark"]')
          if (tg) { tg.textContent = dark ? '深色' : '浅色'; tg.setAttribute('data-active', s.mode !== 'system' ? 'true' : 'false') }
          const sy = bar.querySelector('[data-mode="system"]')
          if (sy) sy.setAttribute('data-active', s.mode === 'system' ? 'true' : 'false')
          const cu = bar.querySelector('[data-mode="custom"]')
          if (cu) cu.setAttribute('data-active', (s.theme || s.accent) ? 'true' : 'false')
        }
        if (mask) {
          const act = s.theme || s.accent
          for (const p of mask.querySelectorAll('[data-preset]')) p.setAttribute('data-active', p.getAttribute('data-preset') === s.theme ? 'true' : 'false')
          for (const d of mask.querySelectorAll('[data-dot]')) d.setAttribute('data-active', d.getAttribute('data-dot') === s.accent ? 'true' : 'false')
        }
      }

      const onBar = (e) => {
        const b = e.target.closest('[data-mode]')
        if (!b) return
        const m = b.getAttribute('data-mode')
        const s = readState()
        if (m === 'lightdark') { s.mode = isDark(s) ? 'light' : 'dark'; writeState(s); apply(s) }
        else if (m === 'system') { s.mode = 'system'; writeState(s); apply(s) }
        else if (m === 'custom') { openSheet(s) }
      }

      const openSheet = (s) => {
        if (!mask) {
          mask = document.createElement('div')
          mask.className = 'dshMobThemeMask'
          const sheet = document.createElement('div')
          sheet.className = 'dshMobThemeSheet'
          const h = document.createElement('h4'); h.textContent = '自定义主题'
          const sub = document.createElement('div'); sub.className = 'dshMobThemeSub'; sub.textContent = '选一套预设，或挑一个主题色'
          sheet.appendChild(h); sheet.appendChild(sub)
          const grid = document.createElement('div'); grid.className = 'dshMobThemePresets'
          for (const p of PRESETS) {
            const cell = document.createElement('button')
            cell.type = 'button'; cell.className = 'dshMobThemePreset'; cell.setAttribute('data-preset', p.id)
            const sw = document.createElement('div'); sw.className = 'dshMobThemePresetSwatch'
            sw.style.background = 'linear-gradient(135deg, ' + p.light + ' 0 55%, color-mix(in srgb, ' + p.accent + ' 32%, ' + p.dark + ') 55% 100%)'
            sw.style.borderLeft = '3px solid ' + p.accent
            const nm = document.createElement('div'); nm.className = 'dshMobThemePresetName'; nm.textContent = p.name
            cell.appendChild(sw); cell.appendChild(nm)
            cell.addEventListener('click', () => { const st = readState(); st.theme = p.id; st.accent = ''; writeState(st); apply(st) })
            grid.appendChild(cell)
          }
          // "原生主题": clear the custom theme (and accent) back to DSH's native look.
          const native = document.createElement('button')
          native.type = 'button'; native.className = 'dshMobThemePreset'; native.setAttribute('data-preset', 'native')
          const nsw = document.createElement('div'); nsw.className = 'dshMobThemePresetSwatch'
          nsw.style.background = 'linear-gradient(135deg, #ffffff 0 55%, #1b1d21 55% 100%)'
          const nnm = document.createElement('div'); nnm.className = 'dshMobThemePresetName'; nnm.textContent = '原生主题'
          native.appendChild(nsw); native.appendChild(nnm)
          native.addEventListener('click', () => {
            const st = readState(); st.theme = ''; st.accent = ''; writeState(st); apply(st)
            closeSheet()
          })
          grid.appendChild(native)
          sheet.appendChild(grid)
          const pl = document.createElement('div'); pl.className = 'dshMobThemePalLabel'; pl.textContent = '主题色'
          sheet.appendChild(pl)
          const pal = document.createElement('div'); pal.className = 'dshMobThemePalette'
          for (const c of DOTS) {
            const d = document.createElement('button')
            d.type = 'button'; d.className = 'dshMobThemeDot'; d.setAttribute('data-dot', c)
            d.style.background = c
            d.addEventListener('click', () => { const st = readState(); st.accent = c; st.theme = ''; writeState(st); apply(st) })
            pal.appendChild(d)
          }
          sheet.appendChild(pal)
          const close = document.createElement('button'); close.type = 'button'; close.className = 'dshMobThemeClose'; close.textContent = '完成'
          close.addEventListener('click', closeSheet)
          sheet.appendChild(close)
          mask.appendChild(sheet)
          mask.addEventListener('click', (e) => { if (e.target === mask) closeSheet() })
          document.body.appendChild(mask)
        }
        mask.setAttribute('data-open', 'true')
        syncBar(readState())
      }
      const closeSheet = () => { if (mask) mask.setAttribute('data-open', 'false') }

      const ensureBar = () => {
        if (!mobileDomAllowed()) { if (bar && bar.isConnected) bar.remove(); bar = null; return }
        const cubeRow = document.querySelector('[aria-modal="true"] [class*="_cubeRow"]')
        if (!cubeRow) { if (bar && bar.isConnected) bar.remove(); bar = null; return }
        if (bar && bar.isConnected && bar.parentElement === cubeRow.parentElement) return
        if (bar) bar.remove()
        bar = document.createElement('div')
        bar.className = 'dshMobThemeBar'
        const mk = (mode, label) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'dshMobThemeBtn'
          b.setAttribute('data-mode', mode); b.textContent = label
          b.addEventListener('click', onBar)
          return b
        }
        bar.appendChild(mk('lightdark', '浅色'))
        bar.appendChild(mk('system', '跟随系统'))
        bar.appendChild(mk('custom', '自定义'))
        cubeRow.after(bar)
        apply(readState())
      }

      const ensureTheme = () => {
        // idempotent re-apply: if React removed our dark flag / theme attr, put it back.
        if (!mobileDomAllowed()) return
        const s = readState()
        const dark = isDark(s)
        const hasDark = document.body.hasAttribute('data-ds-dark-theme')
        if (dark && !hasDark) document.body.setAttribute('data-ds-dark-theme', '')
        else if (!dark && hasDark) document.body.removeAttribute('data-ds-dark-theme')
        if (s.theme) { if (document.documentElement.getAttribute('data-dsh-theme') !== s.theme) document.documentElement.setAttribute('data-dsh-theme', s.theme) }
        else if (s.accent) { if (document.documentElement.getAttribute('data-dsh-theme') !== 'accent') document.documentElement.setAttribute('data-dsh-theme', 'accent') }
        else if (document.documentElement.hasAttribute('data-dsh-theme')) document.documentElement.removeAttribute('data-dsh-theme')
      }

      const setupMobile = () => {
        if (!bodyObs) bodyObs = new MutationObserver(() => { ensureBar(); ensureTheme() })
        bodyObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ds-dark-theme'] })
        if (window.matchMedia && !sysMql) {
          sysMql = window.matchMedia('(prefers-color-scheme: dark)')
          const onSys = () => { const s = readState(); if (s.mode === 'system') apply(s) }
          sysMql.addEventListener('change', onSys)
          sysMql._dshOn = onSys
        }
        apply(readState())
        ensureBar()
      }
      const teardownMobile = () => {
        if (bodyObs) { bodyObs.disconnect(); bodyObs = null }
        if (sysMql && sysMql._dshOn) { sysMql.removeEventListener('change', sysMql._dshOn); sysMql._dshOn = null; sysMql = null }
        if (bar && bar.isConnected) bar.remove()
        bar = null
        if (mask && mask.isConnected) mask.remove()
        mask = null
        // Restore the app to DSH's native look when leaving mobile (desktop untouched).
        // The palette vars / dark flag are mobile-only; the chosen theme persists in
        // localStorage for the next mobile visit.
        document.body.removeAttribute('data-ds-dark-theme')
        const html = document.documentElement
        html.removeAttribute('data-dsh-theme')
        html.style.removeProperty('--dsh-theme-accent')
        html.classList.remove('dsh-dark')
      }
      const onMq = () => {
        const next = mobileDomAllowed()
        if (next === mobile) return
        mobile = next
        if (mobile) setupMobile()
        else teardownMobile()
      }
      try {
        if (window.matchMedia) {
          mql = window.matchMedia(MOBILE_MQ)
          if (mql.addEventListener) mql.addEventListener('change', onMq)
          else if (mql.addListener) mql.addListener(onMq)
        }
      } catch (_) {}
      mobile = mobileDomAllowed()
      if (mobile) setupMobile()

      return () => {
        alive = false
        teardownMobile()
        try {
          if (mql) {
            if (mql.removeEventListener) mql.removeEventListener('change', onMq)
            else if (mql.removeListener) mql.removeListener(onMq)
          }
        } catch (_) {}
      }
    }

    // R6 — whale-FAB long-press -> multi-level function card menu. The PRIMARY menu is
    // an array-driven, extensible card list; zoom is a SECONDARY item (tap it opens the
    // zoom submenu, which sets --dsw-chat-font-scale so the chat content REFLOWS).
    // Follows docs/ref/floating-longpress.html (touch-action:none + icon pointer-events:none
    // + contextmenu/dragstart preventDefault → no system menu on long-press). We keep the
    // tap→sidebar click intact, so we do NOT preventDefault touchstart. Mobile only.
    function installZoom() {
      if (typeof document === 'undefined') return undefined
      const STORE = 'dsh-mobile-zoom-v1'
      const EXPIRE = 3 * 24 * 3600 * 1000
      const MIN = 0.7, MAX = 1.5, STEP = 0.05
      const MENU = [
        { id: 'zoom', label: '字号缩放', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M12 4v16"/></svg>' },
        { id: 'stats', label: '底栏信息', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M6 12h12M9 17h6"/></svg>' },
        { id: 'crumb', label: '面包屑优化', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h7M4 12h10M4 18h7M14 6h6M9 12h4M14 18h6"/></svg>' },
        { id: 'uploadimg', label: '上传图片', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h4l2-2h4l2 2h4v11H4z"/><circle cx="12" cy="13" r="3"/></svg>' },
        // future apps go here (array-driven, extensible) — 关于 is pinned last in buildMenu
      ]
      const ABOUT = [
        { name: '字号缩放', desc: '长按悬浮球或从通用设置打开 WebUI 工具，可放大/缩小聊天文字并自动重排（不模糊），设置会持久保存。' },
        { name: '底栏信息', desc: '控制输入框下方底栏三行信息的显示：缓存命中·输入输出、轮·步·LLM·工具调用、首 token 平均·tok/s，每行独立开关。' },
        { name: '面包屑优化', desc: '优化多级子代理的面包屑显示。使用 agentTeams 等插件时层级过多会显示拥挤：统一用单个大写字母代号，每个 A/B 代表上级代理的第 1/2 个子代理；点击代号会显示该层代理的真实名称，再点击则跳转/展开下级，点别处还原。' },
        { name: '上传图片', desc: '显示/隐藏输入栏右上角的上传图片按钮。' },
      ]
      const TOOLS_STORE = 'dsh-webui-tools-v1'
      const readTools = () => { try { const s = JSON.parse(localStorage.getItem(TOOLS_STORE) || 'null'); return (s && typeof s === 'object') ? s : {} } catch (_) { return {} } }
      const writeTools = (o) => { try { localStorage.setItem(TOOLS_STORE, JSON.stringify(Object.assign({ ts: Date.now() }, o))) } catch (_) {} }
      const applyToolsState = () => {
        const t = readTools()
        document.documentElement.setAttribute('data-dsh-crumb', t.breadcrumb === false ? '0' : '1')
        document.documentElement.setAttribute('data-dsh-upload', t.uploadimg === false ? '0' : '1')
        try { document.dispatchEvent(new CustomEvent('dsh-webui-tools-changed')) } catch (_) {}
      }
      const STATS_STORE = 'dsh-mobile-stats-v1'
      const readStats = () => { try { const s = JSON.parse(localStorage.getItem(STATS_STORE) || 'null'); return (s && typeof s === 'object') ? s : {} } catch (_) { return {} } }
      const writeStats = (o) => { try { localStorage.setItem(STATS_STORE, JSON.stringify(Object.assign({ ts: Date.now() }, o))) } catch (_) {} }
      // Tag the composer's bottom status spans (FJxK0a_root) with the line they belong
      // to (1 = 轮·步·LLM·工具调用·首token, 2 = 缓存命中·输入输出) so the toggles can
      // hide just that line; hiding frees the bottom space (input moves down, no blank).
      const applyStats = () => {
        if (!mobileDomAllowed()) return
        const root = document.querySelector('[class*="FJxK0a_root"]')
        if (root) {
          const re1 = /轮|步|LLM|工具调用|首\s*token|tok\/s/i
          const re2 = /缓存命中|输入|输出/i
          const ftokenMatch = (t) => (t.indexOf('首') !== -1 && t.toLowerCase().indexOf('token') !== -1) || (t.indexOf('tok/s') !== -1 && t.indexOf('平均') !== -1)
          for (const el of root.children) {
            if (!(el instanceof HTMLElement)) continue
            const t = (el.textContent || '').trim()
            // 首 token = its OWN line (3) — exactly like the line1/line2 mechanism:
            // tagged data-dsh-line="3" + revealed by the [data-dsh-stats3="1"] rule
            // (which is the same approach as the other two working toggles).
            if (ftokenMatch(t)) {
              el.setAttribute('data-dsh-ftoken', '1')
              el.setAttribute('data-dsh-line', '3')
              el.style.removeProperty('display')
              continue
            }
            if (el.hasAttribute('data-dsh-ftoken')) {
              el.removeAttribute('data-dsh-ftoken')
            }
            let line = 0
            if (re2.test(t)) line = 2
            else if (re1.test(t)) line = 1
            if ((el.className || '').toString().includes('sep')) {
              const pv = el.previousElementSibling
              if (pv && pv.hasAttribute('data-dsh-ftoken')) { el.setAttribute('data-dsh-ftoken', '1'); el.removeAttribute('data-dsh-line'); continue }
              line = line || (pv ? (pv.getAttribute('data-dsh-line') || 0) : 0)
            }
            if (line) el.setAttribute('data-dsh-line', String(line))
            else el.removeAttribute('data-dsh-line')
          }
        }
      }
      const applyStatsState = (o) => {
        const r = o || readStats()
        // default: both lines SHOWN (line1/line2 undefined → shown; only false hides)
        document.documentElement.setAttribute('data-dsh-stats1', r.line1 === false ? '0' : '1')
        document.documentElement.setAttribute('data-dsh-stats2', r.line2 === false ? '0' : '1')
        // 首 token row is its OWN toggle (line3, default shown)
        document.documentElement.setAttribute('data-dsh-stats3', r.ftoken === false ? '0' : '1')
      }
      const refreshMenuItems = () => {
        const t = readTools()
        for (const el of document.querySelectorAll('.dshMobFuncApp[data-act]')) {
          const id = el.getAttribute('data-act')
          if (id === 'crumb') el.classList.toggle('off', t.breadcrumb === false)
          if (id === 'uploadimg') el.classList.toggle('off', t.uploadimg === false)
        }
      }
      const buildStats = () => {
        statsMask = document.createElement('div'); statsMask.className = 'dshMobStatsMask'
        const sheet = document.createElement('div'); sheet.className = 'dshMobStatsSheet'
        const title = document.createElement('div'); title.className = 'dshMobFuncTitle'; title.textContent = '底栏信息'
        sheet.appendChild(title)
        const mk = (label, key) => {
          const row = document.createElement('div'); row.className = 'dshMobStatsRow'
          const l = document.createElement('span'); l.className = 'dshMobStatsLabel'; l.textContent = label
          const sw = document.createElement('button'); sw.type = 'button'; sw.className = 'dshMobStatsSwitch'
          sw.setAttribute('role', 'switch'); sw.setAttribute('data-line', key)
          sw.addEventListener('click', (e) => {
            e.stopPropagation()
            const r = readStats()
            // undefined (=shown default) → OFF; false → ON; true → OFF
            r[key] = !(r[key] !== false)
            writeStats(r)
            applyStatsState(r)
            applyStats()
            syncStatsToggles()
          })
          row.appendChild(l); row.appendChild(sw)
          sheet.appendChild(row)
        }
        mk('缓存命中 · 输入输出', 'line2')
        mk('轮 · 步 · LLM · 工具调用', 'line1')
        mk('首 token 平均 · tok/s', 'ftoken')
        statsMask.appendChild(sheet)
        statsMask.addEventListener('click', (e) => { if (e.target === statsMask) closeStats() })
        document.body.appendChild(statsMask)
      }
      const syncStatsToggles = () => {
        const r = readStats()
        for (const sw of document.querySelectorAll('.dshMobStatsSwitch[data-line]')) {
          const key = sw.getAttribute('data-line')
          sw.setAttribute('aria-checked', r[key] === false ? 'false' : 'true')
          sw.classList.toggle('on', r[key] !== false)
        }
      }
      const openStats = () => { if (!statsMask) buildStats(); syncStatsToggles(); statsMask.setAttribute('data-open', 'true') }
      const closeStats = () => { if (statsMask) statsMask.setAttribute('data-open', 'false') }
      const openAbout = () => {
        if (!aboutMask) {
          aboutMask = document.createElement('div'); aboutMask.className = 'dshMobAboutMask'
          const sheet = document.createElement('div'); sheet.className = 'dshMobAboutSheet'
          const title = document.createElement('div'); title.className = 'dshMobFuncTitle'; title.textContent = '关于'
          sheet.appendChild(title)
          const intro = document.createElement('div'); intro.className = 'dshMobAboutIntro'
          intro.textContent = 'dsh-webui-mobile · 移动端适配插件：为 DeepSeek Harness Web 界面提供手机端布局、主题、缩放等增强，桌面端不受影响。'
          sheet.appendChild(intro)
          for (const it of ABOUT) {
            const row = document.createElement('div'); row.className = 'dshMobAboutItem'
            const n = document.createElement('div'); n.className = 'dshMobAboutName'; n.textContent = it.name
            const d = document.createElement('div'); d.className = 'dshMobAboutDesc'; d.textContent = it.desc
            row.appendChild(n); row.appendChild(d)
            sheet.appendChild(row)
          }
          const close = document.createElement('button'); close.type = 'button'; close.className = 'dshMobThemeClose'; close.textContent = '完成'
          close.addEventListener('click', closeAbout)
          sheet.appendChild(close)
          aboutMask.appendChild(sheet)
          aboutMask.addEventListener('click', (e) => { if (e.target === aboutMask) closeAbout() })
          document.body.appendChild(aboutMask)
        }
        aboutMask.setAttribute('data-open', 'true')
      }
      const closeAbout = () => { if (aboutMask) aboutMask.setAttribute('data-open', 'false') }
      let alive = true, mobile = false, mql = null
      let menuMask = null, zoomMask = null, statsMask = null, aboutMask = null
      let longTimer = 0, suppressClick = false, downX = 0, downY = 0

      const readScale = () => {
        try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && s.scale > 0 && Date.now() - s.ts < EXPIRE) return s.scale } catch (_) {}
        return 1
      }
      const writeScale = (v) => { try { localStorage.setItem(STORE, JSON.stringify({ scale: v, ts: Date.now() })) } catch (_) {} }
      const clamp = (v) => Math.max(MIN, Math.min(MAX, v))
      const applyScale = (v) => {
        const c = clamp(v)
        document.documentElement.style.setProperty('--dsw-chat-font-scale', String(c))
        writeScale(c)
        if (zoomMask) {
          const cur = zoomMask.querySelector('.dshMobZoomCur'); if (cur) cur.textContent = Math.round(c * 100) + '%'
          const r = zoomMask.querySelector('.dshMobZoomRange'); if (r) r.value = String(c)
        }
      }
      const closeMenu = () => { if (menuMask) menuMask.setAttribute('data-open', 'false') }
      const closeZoom = () => { if (zoomMask) zoomMask.setAttribute('data-open', 'false') }

      const buildMenu = () => {
        menuMask = document.createElement('div'); menuMask.className = 'dshMobFuncMask'
        const sheet = document.createElement('div'); sheet.className = 'dshMobFuncSheet'
        const title = document.createElement('div'); title.className = 'dshMobFuncTitle'; title.textContent = 'WebUI 工具'
        sheet.appendChild(title)
        // App grid (each tool = an app tile, like a phone drawer — easy to extend).
        const grid = document.createElement('div'); grid.className = 'dshMobFuncGrid'
        for (const it of MENU) {
          const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'dshMobFuncApp'; tile.setAttribute('data-act', it.id)
          tile.innerHTML = '<span class="dshMobFuncAppIcon">' + it.icon + '</span><span class="dshMobFuncAppName">' + it.label + '</span>'
          tile.addEventListener('click', (e) => { e.stopPropagation(); onMenuAct(it.id) })
          grid.appendChild(tile)
        }
        // 关于 is pinned LAST, regardless of future apps added to MENU
        const about = document.createElement('button'); about.type = 'button'; about.className = 'dshMobFuncApp'; about.setAttribute('data-act', 'about')
        about.innerHTML = '<span class="dshMobFuncAppIcon">' + '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.5v.01"/></svg>' + '</span><span class="dshMobFuncAppName">关于</span>'
        about.addEventListener('click', (e) => { e.stopPropagation(); onMenuAct('about') })
        grid.appendChild(about)
        sheet.appendChild(grid)
        menuMask.appendChild(sheet)
        menuMask.addEventListener('click', (e) => { if (e.target === menuMask) closeMenu() })
        document.body.appendChild(menuMask)
      }
      const openMenu = () => { if (!menuMask) buildMenu(); refreshMenuItems(); applyStats(); applyStatsState(); applyToolsState(); menuMask.setAttribute('data-open', 'true') }
      const onMenuAct = (id) => {
        if (id === 'zoom') { closeMenu(); openZoom(); return }
        if (id === 'stats') { closeMenu(); openStats(); return }
        if (id === 'crumb' || id === 'uploadimg') {
          const t = readTools()
          const key = id === 'crumb' ? 'breadcrumb' : 'uploadimg'
          // undefined (=on default) → OFF; false → ON; true → OFF
          t[key] = !(t[key] !== false)
          writeTools(t)
          applyToolsState()
          refreshMenuItems()
          return
        }
        if (id === 'about') { closeMenu(); openAbout() }
      }

      const buildZoom = () => {
        zoomMask = document.createElement('div'); zoomMask.className = 'dshMobZoomMask'
        const sheet = document.createElement('div'); sheet.className = 'dshMobZoomSheet'
        const h = document.createElement('h4'); h.textContent = '字号缩放'
        const cur = document.createElement('div'); cur.className = 'dshMobZoomCur'; cur.textContent = '100%'
        const row = document.createElement('div'); row.className = 'dshMobZoomRow'
        const minus = document.createElement('button'); minus.className = 'dshMobZoomBtn'; minus.type = 'button'; minus.textContent = '−'
        const range = document.createElement('input'); range.type = 'range'; range.className = 'dshMobZoomRange'; range.min = String(MIN); range.max = String(MAX); range.step = String(STEP); range.value = '1'
        const plus = document.createElement('button'); plus.className = 'dshMobZoomBtn'; plus.type = 'button'; plus.textContent = '+'
        const set = (v) => applyScale(parseFloat(v))
        minus.addEventListener('click', () => set((parseFloat(range.value) - STEP).toFixed(2)))
        plus.addEventListener('click', () => set((parseFloat(range.value) + STEP).toFixed(2)))
        range.addEventListener('input', () => set(range.value))
        row.appendChild(minus); row.appendChild(range); row.appendChild(plus)
        const reset = document.createElement('button'); reset.className = 'dshMobZoomReset'; reset.type = 'button'; reset.textContent = '复位'
        reset.addEventListener('click', () => set(1))
        sheet.appendChild(h); sheet.appendChild(cur); sheet.appendChild(row); sheet.appendChild(reset)
        zoomMask.appendChild(sheet)
        zoomMask.addEventListener('click', (e) => { if (e.target === zoomMask) closeZoom() })
        document.body.appendChild(zoomMask)
      }
      const openZoom = () => { if (!zoomMask) buildZoom(); zoomMask.setAttribute('data-open', 'true'); applyScale(readScale()) }

      const onDown = (e) => {
        if (!e.target || !e.target.closest || !e.target.closest('.dshMobMenu')) return
        suppressClick = false
        downX = e.clientX; downY = e.clientY
        if (longTimer) clearTimeout(longTimer)
        longTimer = setTimeout(() => { longTimer = 0; suppressClick = true; openMenu() }, 500)
      }
      const onMove = (e) => {
        if (longTimer && e.target && e.target.closest && e.target.closest('.dshMobMenu') && Math.hypot(e.clientX - downX, e.clientY - downY) > 10) { clearTimeout(longTimer); longTimer = 0 }
      }
      const onUp = () => { if (longTimer) { clearTimeout(longTimer); longTimer = 0 } }
      const onClick = (e) => {
        if (suppressClick) {
          if (e.target && e.target.closest && e.target.closest('.dshMobMenu')) { e.preventDefault(); e.stopPropagation() }
          suppressClick = false
        }
      }
      const onCancel = () => { if (longTimer) { clearTimeout(longTimer); longTimer = 0 } }
      const onCtx = (e) => { if (e.target && e.target.closest && e.target.closest('.dshMobMenu')) e.preventDefault() }
      const onDrag = (e) => { if (e.target && e.target.closest && e.target.closest('.dshMobMenu')) e.preventDefault() }

      let statsObs = null
      const onToolsOpen = () => openMenu()
      const setup = () => {
        applyScale(readScale())
        applyStatsState()
        applyStats()
        if (!statsObs && typeof MutationObserver !== 'undefined') {
          statsObs = new MutationObserver(() => { requestAnimationFrame(() => { applyStatsState(); applyStats() }) })
          statsObs.observe(document.body, { childList: true, subtree: true })
        }
        document.addEventListener('dsh-webui-tools-open', onToolsOpen, true)
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('pointermove', onMove, true)
        document.addEventListener('pointerup', onUp, true)
        document.addEventListener('pointercancel', onCancel, true)
        document.addEventListener('click', onClick, true)
        document.addEventListener('contextmenu', onCtx, true)
        document.addEventListener('dragstart', onDrag, true)
      }
      const teardown = () => {
        if (longTimer) clearTimeout(longTimer); longTimer = 0
        if (statsObs) { statsObs.disconnect(); statsObs = null }
        document.removeEventListener('dsh-webui-tools-open', onToolsOpen, true)
        document.removeEventListener('pointerdown', onDown, true)
        document.removeEventListener('pointermove', onMove, true)
        document.removeEventListener('pointerup', onUp, true)
        document.removeEventListener('pointercancel', onCancel, true)
        document.removeEventListener('click', onClick, true)
        document.removeEventListener('contextmenu', onCtx, true)
        document.removeEventListener('dragstart', onDrag, true)
        if (menuMask && menuMask.isConnected) menuMask.remove(); menuMask = null
        if (zoomMask && zoomMask.isConnected) zoomMask.remove(); zoomMask = null
        if (statsMask && statsMask.isConnected) statsMask.remove(); statsMask = null
        if (aboutMask && aboutMask.isConnected) aboutMask.remove(); aboutMask = null
        document.documentElement.style.removeProperty('--dsw-chat-font-scale')
        document.documentElement.removeAttribute('data-dsh-stats1')
        document.documentElement.removeAttribute('data-dsh-stats2')
      }
      const onMq = () => { const n = mobileDomAllowed(); if (n === mobile) return; mobile = n; if (mobile) setup(); else teardown() }
      try { if (window.matchMedia) { mql = window.matchMedia(MOBILE_MQ); if (mql.addEventListener) mql.addEventListener('change', onMq); else if (mql.addListener) mql.addListener(onMq) } } catch (_) {}
      mobile = mobileDomAllowed(); if (mobile) setup()
      return () => { alive = false; teardown(); try { if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onMq); else if (mql.removeListener) mql.removeListener(onMq) } } catch (_) {} }
    }

    // R6 — long-message fold. Appends a 【折叠】 button to each chat message action
    // row; clicking collapses a >40-char message to "first20 + bar + last20", clicking
    // the bar expands. Fold state persisted (localStorage, 3-day expiry). Mobile only;
    // display-only; class-agnostic; idempotent observer (never self-triggers).
    function installMessageFold() {
      if (typeof document === 'undefined' || !window.MutationObserver) return undefined
      const STORE = 'dsh-mobile-fold-v1'
      const EXPIRE = 3 * 24 * 3600 * 1000
      const MIN_LEN = 40, HEAD = 20, TAIL = 20
      let alive = true, mobile = false, mql = null, raf = 0
      const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0 } return (h >>> 0).toString(36) }
      const readAll = () => { try { const r = JSON.parse(localStorage.getItem(STORE) || '{}'); return (r && typeof r === 'object') ? r : {} } catch (_) { return {} } }
      const writeAll = (o) => { try { localStorage.setItem(STORE, JSON.stringify(o)) } catch (_) {} }
      const prune = () => { const o = readAll(); const now = Date.now(); let c = false; for (const k in o) if (now - (o[k].ts || 0) > EXPIRE) { delete o[k]; c = true } if (c) writeAll(o); return o }
      const keyFor = (flow) => { const t = (flow.textContent || ''); return String(t.length) + '-' + hash(t.slice(0, 40)) }
      // Pair each chat action row with its message BODY. In DSH the long message
      // text and its actions/meta live in two SIBLING flowItems: the actions row's
      // flowItem carries the short meta, and its PREVIOUS SIBLING flowItem is the
      // body. (For user messages, fall back to the largest leaf text in the same
      // container.) The body must have >MIN_LEN text and no nested actions row.
      // Skip a body that still carries a think/reasoning block or an already-collapsed
      // node — those are already folded by DSH and must NOT be re-folded / touched.
      // Skip a body that already carries a self-collapsing / foldable block — Think /
      // reasoning, tool-call (Tool call …), or any block with its own collapse. Those are
      // foldable by DSH already; the plugin must NOT re-fold them with "first20+bar+last20".
      const hasSelfFold = (el) => {
        if (!el) return false
        return !!el.querySelector(
          '[class*="_think"], summary, details, ' +
          '[class*="_toolCall"], [class*="_tool"], [class*="_toolRow"], [class*="_toolTitle"], ' +
          '[class*="collapse"], [class*="Collapse"], [class*="_fold"], [class*="_collapsible"]',
        )
      }
      const pairFor = (actionsRow) => {
        let item = actionsRow
        for (let n = actionsRow; n && n !== document.body; n = n.parentElement) {
          if ((n.className || '').toString().indexOf('_flowItem') !== -1) { item = n; break }
        }
        // USER messages: the actions + message text live in the SAME flowItem → the
        // flowItem itself is the body (fold only its text leaves, never the actions).
        // (Note: an AI meta/actions flowItem can ALSO hold a ≥MIN_LEN leaf, e.g. the
        // "Tool call …" meta label — so self-body pairing must be restricted to user
        // messages, otherwise AI messages pair with their own meta row and never fold.)
        const isUserItem = !!item.querySelector('[class*="_userRow"], [class*="userStack"], [class*="UserMessage"]')
        if (isUserItem) {
          const selfHasLongLeaf = Array.from(item.querySelectorAll('*')).some(el =>
            el.children.length === 0 &&
            (el.textContent || '').trim().length >= MIN_LEN &&
            !el.closest('[class*="_actions"]') &&
            !el.closest('[data-variant="think"], [data-variant="tool"], [data-variant="toolCall"]'),
          )
          if (selfHasLongLeaf) return { item, body: item }
        }
        const prev = item.previousElementSibling
        const prevText = prev ? (prev.textContent || '').trim() : ''
        if (prev && (prev.className || '').toString().indexOf('_flowItem') !== -1) {
          // AI messages: body is the previous sibling flowItem. Pair it even when short,
          // so the message stays part of its same-role GROUP (a short tool/meta line must
          // NOT break the run — the fold button covers every unit up to the previous
          // button); foldBody simply finds no segment for a short body.
          return { item, body: prev }
        }
        // user message: walk up to the message row that holds a long leaf text (not the
        // actions container), and use that whole container as the body so EVERY text block
        // inside it (≥MIN_LEN) can be folded independently.
        let anode = actionsRow.parentElement
        for (let k = 0; k < 4 && anode; k++) {
          const hasBlock = Array.from(anode.querySelectorAll('*')).some(el =>
            el.children.length === 0 && (el.textContent || '').trim().length >= MIN_LEN && !el.closest('[class*="_actions"]'),
          )
          if (hasBlock) return { item, body: anode }
          anode = anode.parentElement
        }
        return null
      }
      // Find the pure-text blocks in a message body: leaf text segments (p/li/pre/code +
      // fallback leaf span/div) that are >=MIN_LEN chars and NOT inside a self-foldable
      // block (think / toolcall / collapse). Each such block folds independently.
      const EXCL = '[class*="_think"], [data-variant="think"], [data-variant="reasoning"], [class*="_toolCall"], [class*="_tool"], [class*="_toolRow"], [class*="_toolTitle"], [data-variant="tool"], [data-variant="toolCall"], [class*="collapse"], [class*="_fold"], summary, details'
      // A leaf that belongs to a Think / reasoning / tool-call summary (already
      // folded by DSH) must never be re-folded. Detect by class OR by leading text.
      const isLeafSelfFold = (el) => {
        if (el.closest(EXCL)) return true
        const t = (el.textContent || '').trim()
        return /^(think\b|tool\b|tool\s*call\b|reasoning\b|thought\b)/i.test(t)
      }
      const findTextBlocks = (body) => {
        const cands = []
        for (const el of body.querySelectorAll('*')) {
          if (el.closest('[class*="_actions"]')) continue
          if (isLeafSelfFold(el)) continue
          if (el.children.length) continue
          if ((el.textContent || '').trim().length >= MIN_LEN) cands.push(el)
        }
        // keep only the OUTERMOST leaf text blocks (a leaf inside another candidate is the
        // same segment), so a message body with several paragraphs yields one block each.
        return cands.filter(el => !cands.some(a => a !== el && a.contains(el)))
      }
      // Fold the message's TEXT LEAVES only — think / tool / context blocks and the
      // actions row stay untouched, so collapsing hides the text but never the think.
      // Minimal fold units: consecutive text nodes in tree order, broken by
      // think / tool / context / actions blocks AND by block-level boundaries
      // (each <p>/<div>/<li>/… is its own unit), so a long rich-text message
      // yields several foldable units instead of one merged segment.
      const OUT_SEG = '[data-variant="think"], [data-variant="tool"], [data-variant="toolCall"], [data-variant="reasoning"], summary, details, [class*="_actions"]'
      const BLOCK_SEG = 'p, div, li, pre, blockquote, h1, h2, h3, h4, h5, h6, td'
      const textSegments = (body) => {
        const segs = []
        let cur = []
        let lastBlock = null
        const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
        let n
        while ((n = w.nextNode())) {
          const p = n.parentElement
          if (!p || p.closest(OUT_SEG)) { if (cur.length) { segs.push(cur); cur = [] }; lastBlock = null; continue }
          if (!(n.textContent || '').trim()) continue
          const block = p.closest(BLOCK_SEG) || p
          if (lastBlock && block !== lastBlock) { if (cur.length) { segs.push(cur); cur = [] } }
          lastBlock = block
          cur.push(n)
        }
        if (cur.length) segs.push(cur)
        return segs
      }
      const foldSeg = (nodes, key) => {
        const text = nodes.map(x => x.textContent).join(' ').replace(/\s+/g, ' ').trim()
        if (text.length <= MIN_LEN) return false
        const o = prune(); o[key] = { fold: true, ts: Date.now() }; writeAll(o)
        const host = nodes[0].parentElement
        const tcs = getComputedStyle(host); const fs = tcs.fontSize, lh = tcs.lineHeight
        const mk = (txt) => { const s = document.createElement('span'); s.className = 'dshMobFoldText'; s.textContent = txt; s.style.fontSize = fs; s.style.lineHeight = lh; return s }
        const bar = document.createElement('button'); bar.className = 'dshMobFoldBar'; bar.type = 'button'; bar.textContent = '⋯'; bar.setAttribute('aria-label', '展开'); bar.style.fontSize = fs; bar.style.lineHeight = lh
        const line = document.createElement('span'); line.className = 'dshMobFoldSeg'; line.setAttribute('data-dsh-folded', 'true'); line.style.display = 'block'; line.style.overflowWrap = 'anywhere'
        line.appendChild(mk(text.slice(0, HEAD))); line.appendChild(bar); line.appendChild(mk(text.slice(-TAIL)))
        for (const nd of nodes) { if (nd.__dshFoldOrig == null) nd.__dshFoldOrig = nd.nodeValue; nd.nodeValue = '' }
        host.insertBefore(line, nodes[0])
        bar.addEventListener('click', (e) => { e.stopPropagation(); const o2 = prune(); delete o2[key]; writeAll(o2); expandSeg(nodes) })
        return true
      }
      const expandSeg = (nodes) => {
        for (const nd of nodes) if (nd.__dshFoldOrig != null) nd.nodeValue = nd.__dshFoldOrig
        const host = nodes[0] && nodes[0].parentElement
        if (host) for (const l of host.querySelectorAll('.dshMobFoldSeg')) l.remove()
      }
      const foldBody = (body) => {
        // Skip messages that are still streaming — React rewrites their text nodes as
        // tokens append, which would instantly overwrite the folded state (looks like
        // "no reaction"). Streamed/loading messages are settled implicitly once the
        // streaming indicator is gone, and the restore path re-applies then.
        if (body.closest('[class*="stream"], [class*="streaming"], [class*="_pending"], [class*="loading"], [class*="generating"]')) return false
        let any = false
        for (const seg of textSegments(body)) if (foldSeg(seg, blockKey(seg[0]))) any = true
        return any
      }
      const expandBody = (body) => {
        const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
        const nodes = []; let n
        while ((n = w.nextNode())) if (n.__dshFoldOrig != null) nodes.push(n)
        for (const nd of nodes) expandSeg([nd])
      }
      const roleOf = (actionsRow) => (actionsRow.closest('[class*="_userRow"]') ? 'user' : 'ai')
      const blockKey = (b) => keyFor(b)
      const groupKey = (msgs) => { let s = ''; for (const m of msgs) s += (m.body ? m.body.textContent : '').slice(0, 30); return 'g' + String(s.length) + '-' + hash(s) }
      const isGroupFolded = (g) => g.msgs.some((m) => m.body && !!m.body.querySelector('[data-dsh-folded="true"]'))
      const foldGroup = (g, gk) => {
        // FIX C: compute the persist key BEFORE folding (on unfolded text) so it
        // matches what processMessage/restore computes at load time.
        const key = gk || groupKey(g.msgs)
        const o = prune()
        let foldedAny = false
        for (const m of g.msgs) { if (!m.body) continue; if (foldBody(m.body)) foldedAny = true }
        if (foldedAny) { o[key] = { fold: true, ts: Date.now() }; writeAll(o) }
      }
      const expandGroup = (g, gk) => {
        const key = gk || groupKey(g.msgs)
        const o = prune()
        for (const m of g.msgs) { if (m.body && m.body.querySelector('[data-dsh-folded="true"]')) expandBody(m.body) }
        delete o[key]; writeAll(o)
      }
      const toggleGroup = (g, gk) => { if (isGroupFolded(g)) expandGroup(g, gk); else foldGroup(g, gk) }
      // Rebuild the group FRESH at click time (React re-renders; anchors captured at
      // load can be stale). FIX B: the button carries __dshRow (its action row) and
      // __dshGk (its group's persist key, computed on UNFOLDED text). Recover the row,
      // expand it to the contiguous same-role run, and toggle that whole group — never
      // depending on the button still being attached to the DOM.
      const toggleFromBtn = (btn) => {
        try {
          const row = (btn.__dshRow && document.contains(btn.__dshRow)) ? btn.__dshRow : btn.closest('[class*="_actions"]')
          if (!row) return
          const role = roleOf(row)
          const all = [...document.querySelectorAll('[class*="_actions"]')].filter(ar => !ar.closest('[aria-modal="true"]'))
          const msgs = all.map(ar => { const p = pairFor(ar); return { actionsRow: ar, body: p ? p.body : null, role: roleOf(ar) } })
          let idx = all.indexOf(row)
          if (idx < 0) { idx = msgs.findIndex(m => m.actionsRow === row) }
          let start = idx, end = idx
          while (start > 0 && msgs[start - 1].role === role) start--
          while (end < msgs.length - 1 && msgs[end + 1].role === role) end++
          const g = { role, msgs: msgs.slice(start, end + 1) }
          toggleGroup(g, btn.__dshGk)
        } catch (_) { /* never leave a dead click */ }
      }
      const processMessage = () => {
        const msgs = []
        for (const actionsRow of document.querySelectorAll('[class*="_actions"]')) {
          if (actionsRow.closest('[aria-modal="true"]')) continue
          const p = pairFor(actionsRow)
          // keep the message in the list even when it has no body, so the
          // same-role run (and its fold button coverage) stays continuous
          msgs.push({ actionsRow, body: p ? p.body : null, role: roleOf(actionsRow) })
        }
        // group consecutive same-role messages; one fold button per group
        const groups = []
        for (const m of msgs) {
          const last = groups[groups.length - 1]
          if (last && last.role === m.role) last.msgs.push(m)
          else groups.push({ role: m.role, msgs: [m] })
        }
        const o = prune()
        for (const g of groups) {
          const last = g.msgs[g.msgs.length - 1]
          const row = last.actionsRow
          const gk = groupKey(g.msgs) // computed on UNFOLDED text (FIX C)
          if (!row.querySelector('.dshMobGroupFold')) {
            const b = document.createElement('button'); b.className = 'dshMobFoldBtn dshMobGroupFold'; b.type = 'button'
            b.setAttribute('aria-label', '折叠')
            // nicer two-line "collapse" icon, same linear style/size as the four buttons
            b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h14M5 15h14"/></svg>'
            // FIX B: keep anchors on the button so a click still works after React
            // re-renders / virtual-list churn (the DOM node may be detached).
            b.__dshRow = row
            b.__dshGk = gk
            b.addEventListener('click', (e) => { e.stopPropagation(); toggleFromBtn(b) })
            const actBtns = row.querySelectorAll('[class*="_action"]')
            const lastB = actBtns[actBtns.length - 1]
            if (lastB) lastB.after(b); else row.appendChild(b)
          }
          if (o[gk] && o[gk].fold && !isGroupFolded(g)) foldGroup(g, gk)
        }
      }
      const applyFold = () => {
        raf = 0
        if (!alive || !mobileDomAllowed()) return
        processMessage()
      }
      const schedule = () => { if (!alive || !mobile) return; if (raf) return; raf = requestAnimationFrame(applyFold) }
      let bodyObs = null
      const setup = () => { applyFold(); if (!bodyObs) { bodyObs = new MutationObserver(schedule); bodyObs.observe(document.body, { childList: true, subtree: true }) } }
      const teardown = () => {
        if (raf) cancelAnimationFrame(raf); raf = 0
        if (bodyObs) { bodyObs.disconnect(); bodyObs = null }
        // Remove the injected fold UI so a mobile→desktop resize leaves no residue
        // (a fresh desktop load already has 0 = native).
        for (const btn of document.querySelectorAll('.dshMobFoldBtn')) btn.remove()
        for (const el of document.querySelectorAll('[data-dsh-folded]')) {
          if (el._dshOrig != null) el.innerHTML = el._dshOrig
          el.removeAttribute('data-dsh-folded')
        }
        for (const stale of document.querySelectorAll('.dshMobFoldBar, .dshMobFoldText')) stale.remove()
      }
      const onMq = () => { const n = mobileDomAllowed(); if (n === mobile) return; mobile = n; if (mobile) setup(); else teardown() }
      try { if (window.matchMedia) { mql = window.matchMedia(MOBILE_MQ); if (mql.addEventListener) mql.addEventListener('change', onMq); else if (mql.addListener) mql.addListener(onMq) } } catch (_) {}
      mobile = mobileDomAllowed(); if (mobile) setup()
      return () => { alive = false; teardown(); try { if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onMq); else if (mql.removeListener) mql.removeListener(onMq) } } catch (_) {} }
    }

    function apply(ctx) {
      ensureStyle()
      ctx.effect(
        () => installSubagentCrumbRename(() => {
          try {
            return ctx.get?.('sessions') ?? null
          } catch (_) {
            return null
          }
        }),
        'dsh-webui-mobile: subagent-crumb-rename',
      )
      ctx.effect(installModelEditorTooltip, 'dsh-webui-mobile: model-editor-tooltip')
      ctx.effect(installThemeCustom, 'dsh-webui-mobile: theme-custom')
      ctx.effect(installZoom, 'dsh-webui-mobile: zoom')
      ctx.effect(installSettingsHeaderReparent, 'dsh-webui-mobile: settings-header-reparent')
      ctx.effect(installSettingsConfigRow, 'dsh-webui-mobile: settings-config-row')
      ctx.effect(installWebuiToolsEntry, 'dsh-webui-mobile: webui-tools-entry')
      ctx.effect(installPopupZGuard, 'dsh-webui-mobile: popup-z-guard')
      ctx.effect(installContentFit, 'dsh-webui-mobile: content-fit')
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
