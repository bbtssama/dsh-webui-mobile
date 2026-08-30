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

  /* SIDEBAR — left drawer; closed parked off-screen to the LEFT (not on center) */
  html.${HTML_CLASS} .${CLS.sidebar} {
    position: fixed !important;
    z-index: 50 !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: 0 !important;
    width: min(100%, 360px) !important;
    max-width: 100% !important;
    height: 100% !important;
    height: 100dvh !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-base, #fff)) !important;
    border: none !important;
    border-right: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08)) !important;
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
    gap: 2px 0 !important;
    row-gap: 2px !important;
    max-width: 100% !important;
    font-size: 12px !important;
    line-height: 18px !important;
    text-align: center !important;
    opacity: 0.8;
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

  /* Settings panel: left entirely to the DSH native centered sheet on phones,
     exactly like dsh-mobile-nav (which has no settings override). This is the
     "centered card" look and is stable — it never gets drag-moved by us. */

  /* Keep iOS zoom guard */
  html.${HTML_CLASS} .${INPUT.input},
  html.${HTML_CLASS} textarea,
  html.${HTML_CLASS} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]) {
    font-size: 16px !important;
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

    function apply(ctx) {
      ensureStyle()
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
