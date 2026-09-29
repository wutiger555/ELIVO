/* @ds-bundle: {"format":4,"namespace":"ELIVODesignSystem_a6632d","components":[{"name":"AmbientItem","sourcePath":"components/conversation/AmbientItem.jsx"},{"name":"CARD_TYPES","sourcePath":"components/conversation/ContextCard.jsx"},{"name":"ContextCard","sourcePath":"components/conversation/ContextCard.jsx"},{"name":"RecIndicator","sourcePath":"components/conversation/RecIndicator.jsx"},{"name":"SourceChip","sourcePath":"components/conversation/SourceChip.jsx"},{"name":"TranscriptLine","sourcePath":"components/conversation/TranscriptLine.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Tooltip","sourcePath":"components/core/Tooltip.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/conversation/AmbientItem.jsx":"2647b47364a7","components/conversation/ContextCard.jsx":"d8019de6d0c9","components/conversation/RecIndicator.jsx":"b3b6f73d76e1","components/conversation/SourceChip.jsx":"2f1ee5295ba7","components/conversation/TranscriptLine.jsx":"a137ce010f54","components/core/Badge.jsx":"69863720925f","components/core/Button.jsx":"28d3e66ccb66","components/core/Card.jsx":"73b64dccfb38","components/core/Icon.jsx":"8d7a0832699c","components/core/IconButton.jsx":"cf1866141dd0","components/core/Tag.jsx":"be2584480d43","components/core/Tooltip.jsx":"56cc1b487c94","components/feedback/Dialog.jsx":"6339a1192b30","components/feedback/Toast.jsx":"6b1a49210553","components/forms/Checkbox.jsx":"6642ad856b2e","components/forms/Input.jsx":"d7c5ce89e1aa","components/forms/SegmentedControl.jsx":"f0c612e73791","components/forms/Select.jsx":"daa9daa8ca95","components/forms/Switch.jsx":"dabb19668c97","components/navigation/Tabs.jsx":"84f55e3034bd","ui_kits/mac-app/BriefScreen.jsx":"d435061c7b39","ui_kits/mac-app/LiveScreen.jsx":"b27d40999863","ui_kits/mac-app/Shell.jsx":"901630ce2251","ui_kits/mac-app/SummaryScreen.jsx":"b8c6462524b8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ELIVODesignSystem_a6632d = window.ELIVODesignSystem_a6632d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/conversation/RecIndicator.jsx
try { (() => {
function RecIndicator({
  state = 'rec',
  time,
  style
}) {
  const S = {
    rec: ['REC', 'var(--rec)', true],
    paused: ['PAUSED', 'var(--text-3)', false],
    ephemeral: ['EPHEMERAL', 'var(--accent-text)', true]
  }[state] || [];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 28,
      padding: '0 12px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-edge)',
      font: '500 11px/1 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--text-1)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: S[1],
      boxShadow: S[2] ? '0 0 10px ' + S[1] : 'none',
      animation: S[2] ? 'elivo-pulse 1.6s var(--ease-in-out) infinite' : undefined
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: S[1]
    }
  }, S[0]), time && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-2)',
      letterSpacing: 0
    }
  }, time));
}
Object.assign(__ds_scope, { RecIndicator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/RecIndicator.jsx", error: String((e && e.message) || e) }); }

// components/conversation/TranscriptLine.jsx
try { (() => {
function TranscriptLine({
  speaker,
  self,
  time,
  text,
  partial,
  highlight,
  linked,
  style
}) {
  let content = text;
  if (highlight && typeof text === 'string' && text.includes(highlight)) {
    const [a, ...b] = text.split(highlight);
    content = /*#__PURE__*/React.createElement(React.Fragment, null, a, /*#__PURE__*/React.createElement("mark", {
      style: {
        background: 'var(--accent-soft)',
        color: 'var(--text-1)',
        borderRadius: 3,
        padding: '0 2px',
        boxShadow: 'inset 0 -1px 0 var(--accent)'
      }
    }, highlight), b.join(highlight));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '56px 1fr',
      gap: 14,
      padding: '10px 0',
      opacity: partial ? .6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      paddingTop: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-sans)',
      color: self ? 'var(--accent-text)' : 'var(--text-2)'
    }
  }, speaker), time && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 10.5px/1 var(--font-mono)',
      color: 'var(--text-4)'
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 16px/1.7 var(--font-sans)',
      color: 'var(--text-1)',
      textWrap: 'pretty',
      position: 'relative'
    }
  }, content, partial && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 2,
      height: '1em',
      marginLeft: 2,
      verticalAlign: '-2px',
      background: 'var(--accent)',
      animation: 'elivo-caret 1s steps(1) infinite'
    }
  }), linked && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      font: '500 10.5px/1 var(--font-mono)',
      color: 'var(--accent-text)',
      letterSpacing: '.06em'
    }
  }, "\u2197 LINKED")));
}
Object.assign(__ds_scope, { TranscriptLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/TranscriptLine.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const T = {
  neutral: ['var(--glass-fill)', 'var(--text-2)', 'var(--border-strong)'],
  accent: ['var(--accent-soft)', 'var(--accent-text)', 'var(--accent-ring)'],
  warn: ['var(--warn-soft)', 'var(--warn)', 'var(--warn-soft)'],
  danger: ['var(--danger-soft)', 'var(--danger)', 'var(--danger-soft)'],
  info: ['var(--info-soft)', 'var(--info)', 'var(--info-soft)']
};
function Badge({
  tone = 'neutral',
  variant = 'soft',
  dot,
  pulse,
  children,
  style
}) {
  const [bg, fg, bd] = T[tone] || T.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 22,
      padding: '0 9px',
      borderRadius: 'var(--radius-pill)',
      font: '500 10.5px/1 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      background: variant === 'outline' ? 'transparent' : variant === 'solid' ? fg : bg,
      color: variant === 'solid' ? 'var(--bg)' : fg,
      boxShadow: variant === 'outline' ? 'inset 0 0 0 1px ' + bd : 'inset 0 1px 0 rgba(255,255,255,.08)',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: variant === 'solid' ? 'var(--bg)' : fg,
      boxShadow: variant === 'solid' ? 'none' : '0 0 8px ' + fg,
      animation: pulse ? 'elivo-pulse 1.6s var(--ease-in-out) infinite' : undefined
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  variant = 'default',
  padding = 20,
  children,
  style,
  onClick
}) {
  const glass = {
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)'
  };
  const V = {
    default: {
      ...glass,
      background: 'var(--glass-fill)',
      boxShadow: 'var(--glass-edge)'
    },
    raised: {
      ...glass,
      background: 'var(--glass-fill-strong)',
      boxShadow: 'var(--glass-shadow)'
    },
    outline: {
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1px var(--border-strong)'
    },
    promoted: {
      ...glass,
      background: 'var(--glass-fill-strong)',
      boxShadow: 'var(--glow-signal)'
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      borderRadius: 'var(--radius-lg)',
      padding,
      color: 'var(--text-1)',
      ...V,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
const CDN = 'https://unpkg.com/lucide-static@0.460.0/icons/';
function Icon({
  name,
  size = 16,
  color = 'currentColor',
  style,
  title
}) {
  const url = 'url(' + CDN + name + '.svg)';
  return /*#__PURE__*/React.createElement("span", {
    role: title ? 'img' : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
    style: {
      display: 'inline-block',
      flex: 'none',
      width: size,
      height: size,
      background: color,
      WebkitMask: url + ' center/contain no-repeat',
      mask: url + ' center/contain no-repeat',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/conversation/AmbientItem.jsx
try { (() => {
const K = {
  doc: 'file-text',
  number: 'hash',
  question: 'circle-help',
  decision: 'milestone',
  action: 'square-check',
  person: 'user-round'
};
function AmbientItem({
  kind = 'doc',
  label,
  meta,
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 38,
      padding: '7px 12px',
      margin: '0 -12px',
      borderRadius: 'var(--radius-sm)',
      background: h && onClick ? 'var(--surface-hover)' : 'transparent',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: K[kind] || kind,
    size: 14,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: '400 13px/1.4 var(--font-sans)',
      color: h ? 'var(--text-1)' : 'var(--text-2)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-4)'
    }
  }, meta));
}
Object.assign(__ds_scope, { AmbientItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/AmbientItem.jsx", error: String((e && e.message) || e) }); }

// components/conversation/SourceChip.jsx
try { (() => {
function SourceChip({
  label,
  time,
  icon = 'corner-down-right',
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
      font: '400 12px/1.3 var(--font-sans)',
      color: h ? 'var(--text-1)' : 'var(--text-3)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'color var(--dur-fast)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label), time && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: h ? 'var(--accent-text)' : 'var(--text-4)'
    }
  }, time), onClick && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-right",
    size: 12,
    style: {
      opacity: h ? 1 : .5
    }
  }));
}
Object.assign(__ds_scope, { SourceChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/SourceChip.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const SIZES = {
  sm: {
    h: 'var(--control-h-sm)',
    px: 14,
    fs: 13,
    ic: 14,
    gap: 6
  },
  md: {
    h: 'var(--control-h-md)',
    px: 18,
    fs: 14,
    ic: 16,
    gap: 8
  },
  lg: {
    h: 'var(--control-h-lg)',
    px: 24,
    fs: 16,
    ic: 18,
    gap: 8
  }
};
function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  fullWidth,
  onClick,
  children,
  type = 'button',
  style
}) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const glass = {
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)'
  };
  const V = {
    primary: {
      background: h ? 'var(--accent-hover)' : 'var(--accent)',
      color: 'var(--accent-fg)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45),0 6px 20px -6px var(--accent-ring)'
    },
    secondary: {
      ...glass,
      background: h ? 'var(--surface-hover)' : 'var(--glass-fill)',
      color: 'var(--text-1)',
      boxShadow: 'var(--glass-edge)'
    },
    ghost: {
      background: h ? 'var(--surface-hover)' : 'transparent',
      color: h ? 'var(--text-1)' : 'var(--text-2)'
    },
    danger: {
      ...glass,
      background: h ? 'var(--danger-soft)' : 'var(--glass-fill-thin)',
      color: 'var(--danger)',
      boxShadow: 'inset 0 0 0 1px var(--danger-soft)'
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setP(false);
    },
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      padding: '0 ' + s.px + 'px',
      width: fullWidth ? '100%' : undefined,
      font: '500 ' + s.fs + 'px/1 var(--font-sans)',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      borderRadius: 'var(--radius-pill)',
      border: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .4 : 1,
      transform: p && !disabled ? 'scale(.96)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-out),color var(--dur-fast),transform var(--dur-base) var(--ease-spring)',
      outline: 'none',
      ...V,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.ic
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.ic
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/conversation/ContextCard.jsx
try { (() => {
const CARD_TYPES = {
  decision_conflict: {
    label: 'Decision conflict',
    icon: 'git-compare',
    tone: 'warn'
  },
  number_drift: {
    label: 'Number drift',
    icon: 'trending-up',
    tone: 'warn'
  },
  previous_decision: {
    label: 'Previous decision',
    icon: 'milestone',
    tone: 'neutral'
  },
  related_document: {
    label: 'Related document',
    icon: 'file-text',
    tone: 'info'
  },
  open_question: {
    label: 'Open question',
    icon: 'circle-help',
    tone: 'neutral'
  },
  unowned_action: {
    label: 'Unowned action',
    icon: 'user-x',
    tone: 'neutral'
  },
  anaphora: {
    label: 'Reference',
    icon: 'link-2',
    tone: 'neutral'
  }
};
function ContextCard({
  type = 'previous_decision',
  level = 'ambient',
  title,
  body,
  source,
  time,
  pinned,
  onOpenSource,
  onPin,
  onDismiss,
  onWhy,
  style
}) {
  const t = CARD_TYPES[type] || CARD_TYPES.previous_decision;
  const promoted = level === 'promoted';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: 18,
      borderRadius: 'var(--radius-lg)',
      background: promoted ? 'var(--glass-fill-strong)' : 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: promoted ? 'var(--glow-signal)' : 'var(--glass-edge)',
      animation: 'elivo-surface var(--dur-surface) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: t.tone
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 11
  }), t.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), pinned && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "pin",
    size: 12,
    color: "var(--accent-text)"
  }), time && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-4)'
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 15px/1.45 var(--font-sans)',
      color: 'var(--text-1)',
      letterSpacing: '-0.005em',
      textWrap: 'pretty'
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: '400 13.5px/1.65 var(--font-sans)',
      color: 'var(--text-2)',
      textWrap: 'pretty'
    }
  }, body), source && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SourceChip, {
    label: source.label,
    time: source.time,
    onClick: onOpenSource
  })), promoted && (onOpenSource || onPin || onDismiss) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid var(--border)'
    }
  }, onOpenSource && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    icon: "scan-search",
    onClick: onOpenSource
  }, "\u770B\u4F9D\u64DA"), onPin && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "ghost",
    icon: "pin",
    onClick: onPin
  }, pinned ? '已 Pin' : 'Pin'), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), onWhy && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "ghost",
    onClick: onWhy
  }, "\u70BA\u4EC0\u9EBC\uFF1F"), onDismiss && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "ghost",
    onClick: onDismiss
  }, "\u7565\u904E")));
}
Object.assign(__ds_scope, { CARD_TYPES, ContextCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/ContextCard.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  active,
  disabled,
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const d = {
    sm: 30,
    md: 38,
    lg: 50
  }[size] || 38;
  const ic = {
    sm: 14,
    md: 17,
    lg: 20
  }[size] || 17;
  const on = active || variant === 'active';
  const glass = variant === 'secondary' || on;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setP(false);
    },
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: d,
      height: d,
      padding: 0,
      border: 0,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .4 : 1,
      backdropFilter: glass ? 'var(--glass-blur)' : undefined,
      WebkitBackdropFilter: glass ? 'var(--glass-blur)' : undefined,
      boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.2),0 0 0 1px var(--accent-ring)' : glass ? 'var(--glass-edge)' : 'none',
      background: on ? 'var(--accent-soft)' : h ? 'var(--surface-hover)' : glass ? 'var(--glass-fill)' : 'transparent',
      color: on ? 'var(--accent-text)' : h ? 'var(--text-1)' : 'var(--text-2)',
      transform: p ? 'scale(.92)' : 'none',
      transition: 'background var(--dur-fast),color var(--dur-fast),transform var(--dur-base) var(--ease-spring)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: ic
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  icon,
  selected,
  onClick,
  onRemove,
  children,
  style
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 30,
      padding: onRemove ? '0 5px 0 12px' : '0 12px',
      borderRadius: 'var(--radius-pill)',
      font: '400 13px/1 var(--font-sans)',
      cursor: onClick ? 'pointer' : 'default',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: selected ? 'inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px var(--accent-ring)' : 'var(--glass-edge)',
      background: selected ? 'var(--accent-soft)' : h && onClick ? 'var(--surface-hover)' : 'var(--glass-fill)',
      color: selected ? 'var(--accent-text)' : 'var(--text-2)',
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), children, onRemove && /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "\u79FB\u9664",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: 'inline-flex',
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 99,
      cursor: 'pointer',
      color: 'var(--text-3)',
      background: 'var(--surface-hover)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 11
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/core/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  side = 'top',
  children
}) {
  const [o, setO] = React.useState(false);
  const pos = side === 'bottom' ? {
    top: 'calc(100% + 8px)'
  } : {
    bottom: 'calc(100% + 8px)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setO(true),
    onMouseLeave: () => setO(false)
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      left: '50%',
      ...pos,
      transform: 'translateX(-50%) scale(' + (o ? 1 : .94) + ')',
      opacity: o ? 1 : 0,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: '7px 11px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--glass-fill-strong)',
      backdropFilter: 'var(--glass-blur-heavy)',
      WebkitBackdropFilter: 'var(--glass-blur-heavy)',
      boxShadow: 'var(--glass-shadow)',
      color: 'var(--text-1)',
      font: '500 12px/1.2 var(--font-sans)',
      transition: 'opacity var(--dur-fast),transform var(--dur-base) var(--ease-spring)',
      zIndex: 50
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  width = 480,
  inline,
  style
}) {
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width,
      maxWidth: '100%',
      background: 'var(--glass-fill-strong)',
      backdropFilter: 'var(--glass-blur-heavy)',
      WebkitBackdropFilter: 'var(--glass-blur-heavy)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-overlay)',
      overflow: 'hidden',
      animation: 'elivo-surface var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '22px 22px 0 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 17px/1.35 var(--font-sans)',
      letterSpacing: '-0.015em',
      color: 'var(--text-1)'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      font: '400 13.5px/1.6 var(--font-sans)',
      color: 'var(--text-3)'
    }
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "\u95DC\u9589",
    size: "sm",
    variant: "secondary",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      padding: '0 20px 20px'
    }
  }, footer));
  if (inline) return panel;
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--overlay)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }
  }, panel);
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const T = {
  neutral: ['info', 'var(--text-2)'],
  success: ['circle-check', 'var(--accent-text)'],
  warn: ['triangle-alert', 'var(--warn)'],
  danger: ['circle-x', 'var(--danger)']
};
function Toast({
  tone = 'neutral',
  title,
  body,
  action,
  onClose,
  style
}) {
  const [ic, c] = T[tone] || T.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      width: 360,
      maxWidth: '100%',
      padding: '12px 16px 12px 14px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-fill-strong)',
      backdropFilter: 'var(--glass-blur-heavy)',
      WebkitBackdropFilter: 'var(--glass-blur-heavy)',
      boxShadow: 'var(--shadow-overlay)',
      animation: 'elivo-surface var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 30,
      height: 30,
      borderRadius: 99,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-hover)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ic,
    size: 16,
    color: c
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13.5px/1.4 var(--font-sans)',
      color: 'var(--text-1)'
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 1,
      font: '400 12.5px/1.5 var(--font-sans)',
      color: 'var(--text-3)'
    }
  }, body)), action, onClose && /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "\u95DC\u9589",
    onClick: onClose,
    style: {
      cursor: 'pointer',
      color: 'var(--text-3)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  description,
  disabled,
  style
}) {
  const [c, setC] = React.useState(defaultChecked || false);
  const on = checked ?? c;
  const t = () => {
    if (disabled) return;
    setC(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: t,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 22,
      height: 22,
      borderRadius: 99,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.45),0 4px 12px -4px var(--accent-ring)' : 'inset 0 0 0 1.5px var(--border-strong)',
      background: on ? 'var(--accent)' : 'var(--glass-fill-thin)',
      color: 'var(--accent-fg)',
      transform: on ? 'scale(1)' : 'scale(.94)',
      transition: 'background var(--dur-fast),transform var(--dur-base) var(--ease-spring)'
    }
  }, on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      paddingTop: 1
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 14.5px/1.4 var(--font-sans)',
      color: 'var(--text-1)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12.5px/1.5 var(--font-sans)',
      color: 'var(--text-3)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  icon,
  hint,
  error,
  size = 'md',
  mono,
  type = 'text',
  disabled,
  style
}) {
  const [f, setF] = React.useState(false);
  const h = {
    sm: 'var(--control-h-sm)',
    md: 'var(--control-h-md)',
    lg: 'var(--control-h-lg)'
  }[size];
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12.5px/1 var(--font-sans)',
      color: 'var(--text-2)',
      paddingLeft: 4
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: h,
      padding: '0 14px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      opacity: disabled ? .5 : 1,
      boxShadow: error ? 'inset 0 0 0 1px var(--danger)' : f ? 'inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px var(--accent-ring),0 0 0 4px var(--accent-soft)' : 'var(--glass-edge)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("input", {
    type: type,
    disabled: disabled,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      color: 'var(--text-1)',
      font: mono ? '400 13px/1 var(--font-mono)' : '400 14px/1 var(--font-sans)'
    }
  })), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1.4 var(--font-sans)',
      color: error ? 'var(--danger)' : 'var(--text-3)',
      paddingLeft: 4
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function SegmentedControl({
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  style
}) {
  const norm = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const [v, setV] = React.useState(defaultValue ?? norm[0]?.value);
  const cur = value ?? v;
  const idx = Math.max(0, norm.findIndex(o => o.value === cur));
  const h = size === 'sm' ? 30 : 36;
  const n = norm.length || 1;
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      position: 'relative',
      display: 'inline-grid',
      gridTemplateColumns: 'repeat(' + n + ',1fr)',
      padding: 3,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--glass-fill-thin)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-edge)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      bottom: 3,
      left: 'calc(3px + (100% - 6px) / ' + n + ' * ' + idx + ')',
      width: 'calc((100% - 6px) / ' + n + ')',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--glass-fill)',
      boxShadow: 'var(--glass-thumb)',
      transition: 'left var(--dur-slow) var(--ease-spring)'
    }
  }), norm.map(o => {
    const on = o.value === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      role: "radio",
      "aria-checked": on,
      onClick: () => {
        setV(o.value);
        onChange && onChange(o.value);
      },
      style: {
        position: 'relative',
        height: h - 6,
        padding: '0 14px',
        border: 0,
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        font: '500 ' + (size === 'sm' ? 12 : 13) + 'px/1 var(--font-sans)',
        background: 'transparent',
        color: on ? 'var(--text-1)' : 'var(--text-3)',
        transition: 'color var(--dur-fast)'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  disabled,
  style
}) {
  const h = {
    sm: 'var(--control-h-sm)',
    md: 'var(--control-h-md)',
    lg: 'var(--control-h-lg)'
  }[size];
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12.5px/1 var(--font-sans)',
      color: 'var(--text-2)',
      paddingLeft: 4
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", {
    disabled: disabled,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: h,
      padding: '0 36px 0 14px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-edge)',
      color: 'var(--text-1)',
      border: 0,
      font: '400 14px/1 var(--font-sans)',
      outline: 'none',
      cursor: 'pointer',
      opacity: disabled ? .5 : 1
    }
  }, options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevrons-up-down",
    size: 14,
    color: "var(--text-3)",
    style: {
      position: 'absolute',
      right: 13,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  style
}) {
  const [c, setC] = React.useState(defaultChecked || false);
  const on = checked ?? c;
  const [p, setP] = React.useState(false);
  const t = () => {
    if (disabled) return;
    setC(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: t,
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    onMouseLeave: () => setP(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 46,
      height: 28,
      borderRadius: 99,
      background: on ? 'var(--accent)' : 'var(--surface-3)',
      boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.35)' : 'inset 0 0 0 1px var(--border-strong)',
      transition: 'background var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? p ? 14 : 20 : 2,
      width: p ? 30 : 24,
      height: 24,
      borderRadius: 99,
      background: '#FFFFFF',
      boxShadow: '0 2px 6px rgba(0,0,0,.3),inset 0 -1px 0 rgba(0,0,0,.06)',
      transition: 'left var(--dur-slow) var(--ease-spring),width var(--dur-base) var(--ease-spring)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 14px/1.3 var(--font-sans)',
      color: 'var(--text-1)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style
}) {
  const [v, setV] = React.useState(defaultValue ?? items[0]?.id);
  const cur = value ?? v;
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--glass-fill)',
      backdropFilter: 'var(--glass-blur-heavy)',
      WebkitBackdropFilter: 'var(--glass-blur-heavy)',
      boxShadow: 'var(--glass-shadow)',
      ...style
    }
  }, items.map(it => {
    const on = it.id === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => {
        setV(it.id);
        onChange && onChange(it.id);
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 34,
        padding: '0 16px',
        border: 0,
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        background: on ? 'var(--surface-press)' : 'transparent',
        boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.16)' : 'none',
        font: '500 13.5px/1 var(--font-sans)',
        color: on ? 'var(--accent-text)' : 'var(--text-2)',
        transition: 'background var(--dur-base) var(--ease-out),color var(--dur-fast)'
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 11px/1 var(--font-mono)',
        color: on ? 'var(--accent-text)' : 'var(--text-4)',
        opacity: .85
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mac-app/BriefScreen.jsx
try { (() => {
const {
  Button: BButton,
  Tag: BTag,
  AmbientItem: BAmb,
  Card: BCard,
  SourceChip: BSrc,
  Badge: BBadge,
  Icon: BIcon
} = window.ELIVODesignSystem_a6632d;
function BriefScreen({
  onStart
}) {
  return /*#__PURE__*/React.createElement(MacShell, {
    title: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 13px/1 var(--font-sans)',
        color: 'var(--text-2)'
      }
    }, "\u6703\u524D\u7C21\u5831"),
    right: /*#__PURE__*/React.createElement(BButton, {
      size: "sm",
      variant: "ghost",
      icon: "settings-2"
    }, "\u8A2D\u5B9A")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      backgroundImage: 'var(--grid-dot)',
      backgroundSize: 'var(--grid-dot-size)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 880,
      margin: '0 auto',
      padding: '48px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(BBadge, {
    tone: "accent",
    dot: true,
    pulse: true
  }, "10 \u5206\u9418\u5F8C\u958B\u59CB"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: 'var(--text-3)'
    }
  }, "14:00 \u2013 15:00 \xB7 Google Meet")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 36px/1.2 var(--font-sans)',
      letterSpacing: '-0.025em'
    }
  }, "Acme\uFF5CAPI Migration Weekly"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(BTag, {
    icon: "building-2",
    selected: true
  }, "Acme"), /*#__PURE__*/React.createElement(BTag, {
    icon: "folder"
  }, "API Migration"), /*#__PURE__*/React.createElement(BTag, {
    icon: "users"
  }, "4 \u4F4D\u8207\u6703\u8005")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 20,
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 11px/1 var(--font-mono)',
        color: 'var(--text-4)'
      }
    }, "8/12 \u9031\u6703")
  }, "\u4E0A\u6B21\u6C7A\u7B56"), /*#__PURE__*/React.createElement(BCard, {
    padding: 18
  }, [['採用方案 B，Gateway 分階段切換', '00:31:05'], ['第一階段先切 20% 流量', '00:34:40'], ['p95 目標壓到 500ms 以下', '00:41:12']].map(([t, c], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      padding: '10px 0',
      borderTop: i ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(BIcon, {
    name: "milestone",
    size: 15,
    color: "var(--accent-text)",
    style: {
      marginTop: 3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14.5px/1.5 var(--font-sans)'
    }
  }, t), /*#__PURE__*/React.createElement(BSrc, {
    label: "8/12 \u9031\u6703",
    time: c,
    onClick: () => {},
    style: {
      marginTop: 4
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "\u672A\u5B8C\u6210\u5F85\u8FA6"), /*#__PURE__*/React.createElement(BAmb, {
    kind: "action",
    label: "Rollback \u6D41\u7A0B\u6587\u4EF6",
    meta: "Kevin \xB7 8/19"
  }), /*#__PURE__*/React.createElement(BAmb, {
    kind: "action",
    label: "\u58D3\u6E2C\u5831\u544A\u66F4\u65B0",
    meta: "\u672A\u6307\u5B9A"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "\u4E0A\u6B21\u63D0\u5230\u7684\u6578\u5B57"), /*#__PURE__*/React.createElement(BAmb, {
    kind: "number",
    label: "Benchmark p95",
    meta: "820ms"
  }), /*#__PURE__*/React.createElement(BAmb, {
    kind: "number",
    label: "\u9810\u7B97\u4E0A\u9650",
    meta: "NT$1.2M"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "\u672A\u6C7A\u554F\u984C"), /*#__PURE__*/React.createElement(BAmb, {
    kind: "question",
    label: "Rollback \u8AB0\u8CA0\u8CAC\uFF1F",
    meta: "8/12"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 40,
      paddingTop: 24,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(BButton, {
    variant: "primary",
    size: "lg",
    icon: "play",
    onClick: onStart
  }, "\u958B\u59CB\u6703\u8B70"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px/1.5 var(--font-sans)',
      color: 'var(--text-3)'
    }
  }, "\u958B\u59CB\u6642\u6703\u81EA\u52D5\u628A\u544A\u77E5\u6587\u5B57\u8CBC\u5230\u6703\u8B70\u804A\u5929\u5BA4\u3002")))));
}
window.BriefScreen = BriefScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mac-app/BriefScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mac-app/LiveScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button: LButton,
  IconButton: LIB,
  RecIndicator: LRec,
  TranscriptLine: LLine,
  ContextCard: LCard,
  AmbientItem: LAmb,
  SegmentedControl: LSeg,
  Switch: LSwitch,
  Tooltip: LTip,
  Dialog: LDialog,
  Checkbox: LCheck
} = window.ELIVODesignSystem_a6632d;
const SCRIPT = [{
  s: '我',
  self: 1,
  t: '00:22:58',
  x: '我們上次討論的 API migration，今天想確認一下進度。'
}, {
  s: '對方',
  t: '00:23:05',
  x: '對，當時最大的問題其實是 latency，p95 大概八百多。',
  amb: {
    kind: 'number',
    label: 'Benchmark p95 820ms',
    meta: '7/30'
  }
}, {
  s: '對方',
  t: '00:23:12',
  x: '所以這次我們想直接全部切過去，比較省事。',
  hl: '全部切過去',
  card: 1
}, {
  s: '我',
  self: 1,
  t: '00:23:20',
  x: '那 rollback 的部分，現在是誰在負責？',
  amb: {
    kind: 'question',
    label: '未回答：rollback 誰負責？',
    meta: '00:23'
  }
}, {
  s: '說話者 C',
  t: '00:23:31',
  x: '文件我們上週有更新，proposal 應該是 v2 了。',
  amb: {
    kind: 'doc',
    label: 'API Migration Proposal v2',
    meta: '7/28'
  }
}];
function LiveScreen({
  onEnd
}) {
  const [n, setN] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [eph, setEph] = React.useState(false);
  const [card, setCard] = React.useState('none');
  const [pinned, setPinned] = React.useState(false);
  const [why, setWhy] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  React.useEffect(() => {
    if (paused || n >= SCRIPT.length) return;
    const id = setTimeout(() => {
      setN(n + 1);
      if (SCRIPT[n].card) setCard('shown');
    }, 2200);
    return () => clearTimeout(id);
  }, [n, paused]);
  const lines = SCRIPT.slice(0, n);
  const amb = [{
    kind: 'doc',
    label: '8/12 週會紀錄',
    meta: '8/12'
  }, ...lines.filter(l => l.amb).map(l => l.amb)];
  return /*#__PURE__*/React.createElement(MacShell, {
    title: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 13px/1 var(--font-sans)',
        color: 'var(--text-2)'
      }
    }, "Acme\uFF5CAPI Migration Weekly"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(LRec, {
      state: paused ? 'paused' : eph ? 'ephemeral' : 'rec',
      time: "00:23:41"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8
      }
    }), /*#__PURE__*/React.createElement(LTip, {
      content: "\u53EA\u4FDD\u7559\u9010\u5B57\u7A3F",
      side: "bottom"
    }, /*#__PURE__*/React.createElement(LButton, {
      size: "sm",
      variant: focus ? 'secondary' : 'ghost',
      icon: "focus",
      onClick: () => setFocus(!focus)
    }, "Focus")), /*#__PURE__*/React.createElement(LSwitch, {
      checked: eph,
      onChange: setEph,
      label: /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-2)'
        }
      }, "Ephemeral")
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6
      }
    }), /*#__PURE__*/React.createElement(LIB, {
      icon: paused ? 'play' : 'pause',
      label: paused ? '繼續' : '暫停',
      onClick: () => setPaused(!paused)
    }), /*#__PURE__*/React.createElement(LIB, {
      icon: "monitor-smartphone",
      label: "\u7B2C\u4E8C\u87A2\u5E55"
    }), /*#__PURE__*/React.createElement(LButton, {
      size: "sm",
      variant: "secondary",
      icon: "square",
      onClick: () => setConfirm(true)
    }, "\u7D50\u675F"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.35,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 32px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 11px/1 var(--font-mono)',
        color: 'var(--text-4)'
      }
    }, "\u7E41\u4E2D \xB7 \u4E2D\u82F1\u6DF7\u8AAA")
  }, "Live conversation"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement(LLine, {
    key: i,
    speaker: l.s,
    self: !!l.self,
    time: l.t,
    text: l.x,
    highlight: card !== 'none' && !focus ? l.hl : undefined,
    linked: card !== 'none' && !focus && !!l.hl
  })), !paused && n < SCRIPT.length && /*#__PURE__*/React.createElement(LLine, {
    speaker: "\u2026",
    partial: true,
    text: ""
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 24px',
      margin: '12px 12px 12px 0',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--glass-fill-thin)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-edge)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement(LSeg, {
      size: "sm",
      options: ['安靜', '標準', '積極'],
      defaultValue: "\u6A19\u6E96"
    })
  }, "Context"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(LCard, {
    type: "previous_decision",
    title: "8/12 \u6C7A\u5B9A\u63A1\u7528\u65B9\u6848 B",
    body: "Gateway \u5206\u968E\u6BB5\u5207\u63DB\u3002",
    source: {
      label: '8/12 週會',
      time: '00:31:05'
    },
    onOpenSource: () => {}
  }), card === 'shown' && !focus && /*#__PURE__*/React.createElement(LCard, {
    type: "decision_conflict",
    level: "promoted",
    time: "00:23:14",
    pinned: pinned,
    title: "\u8207 8/12 \u6C7A\u7B56\u4E0D\u540C",
    body: "\u300C\u5168\u90E8\u5207\u904E\u53BB\u300D\u8207 8/12 \u6C7A\u5B9A\u7684\u5206\u968E\u6BB5\u65B9\u6848 B \u4E0D\u540C\u3002",
    source: {
      label: '8/12 週會',
      time: '00:31:05'
    },
    onOpenSource: () => setWhy(true),
    onPin: () => setPinned(!pinned),
    onDismiss: () => setCard('dismissed'),
    onWhy: () => setWhy(true)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 11px/1 var(--font-mono)',
        color: 'var(--text-4)'
      }
    }, amb.length)
  }, "Ambient"), amb.map((a, i) => /*#__PURE__*/React.createElement(LAmb, _extends({
    key: i
  }, a, {
    onClick: () => {}
  }))))), why && /*#__PURE__*/React.createElement(LDialog, {
    title: "\u70BA\u4EC0\u9EBC\u73FE\u5728\u51FA\u73FE\uFF1F",
    description: "\u8AAA\u8A71\u544A\u4E00\u6BB5\u843D\u6642\uFF0C\u7576\u4E0B\u8AAA\u6CD5\u8207 ledger \u4E2D\u7684\u6C7A\u7B56\u76F8\u4F3C\u5EA6\u8D85\u904E\u9580\u6ABB\u3002",
    onClose: () => setWhy(false),
    footer: /*#__PURE__*/React.createElement(LButton, {
      size: "sm",
      onClick: () => setWhy(false)
    }, "\u95DC\u9589")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '90px 1fr',
      gap: '12px 14px',
      font: '400 13.5px/1.55 var(--font-sans)'
    }
  }, [['觸發語句', '「所以這次我們想直接全部切過去」 · 00:23:12'], ['比對決策', '「先用方案 B 分階段切」 · 8/12 週會 00:31:05'], ['分數', /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "0.82 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-4)'
    }
  }, "/ \u9580\u6ABB 0.70"))]].map(([k, v]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)',
      fontSize: 12.5
    }
  }, k), /*#__PURE__*/React.createElement("span", null, v))))), confirm && /*#__PURE__*/React.createElement(LDialog, {
    title: "\u9019 3 \u500B\u6C7A\u7B56\u30012 \u500B\u5F85\u8FA6\u5C0D\u55CE\uFF1F",
    description: "30 \u79D2\u78BA\u8A8D\u5F8C\u5BEB\u5165 Decision Ledger\u3002",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LButton, {
      size: "sm",
      variant: "ghost",
      onClick: () => setConfirm(false)
    }, "\u8FD4\u56DE\u6703\u8B70"), /*#__PURE__*/React.createElement(LButton, {
      size: "sm",
      variant: "primary",
      icon: "check",
      onClick: onEnd
    }, "\u5BEB\u5165 Ledger"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(LCheck, {
    defaultChecked: true,
    label: "\u7DAD\u6301\u65B9\u6848 B\uFF0C\u5206\u968E\u6BB5\u5207\u63DB",
    description: "00:25:40"
  }), /*#__PURE__*/React.createElement(LCheck, {
    defaultChecked: true,
    label: "\u4E0B\u9031\u4E09\u524D\u5B8C\u6210 rollback \u6587\u4EF6",
    description: "Owner\uFF1A\u6211 \xB7 9/30"
  }), /*#__PURE__*/React.createElement(LCheck, {
    label: "Proposal v2 \u70BA\u672C\u6B21\u57FA\u6E96",
    description: "00:23:31"
  }))));
}
window.LiveScreen = LiveScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mac-app/LiveScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mac-app/Shell.jsx
try { (() => {
const {
  Icon: ShIcon
} = window.ELIVODesignSystem_a6632d;
function MacShell({
  title,
  right,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-ambient),var(--bg)',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px var(--border-strong),0 40px 100px -20px rgba(0,0,0,.7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 12px 0 18px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--glass-fill-thin)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['#FF5F57', '#FEBC2E', '#28C840'].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      width: 12,
      height: 12,
      borderRadius: 99,
      background: c,
      opacity: .9
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginLeft: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 13px/1 var(--font-sans)',
      letterSpacing: '.04em'
    }
  }, "ELIVO"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 14,
      background: 'var(--border-strong)'
    }
  }), title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), right), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex'
    }
  }, children));
}
function SectionLabel({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 20,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-label)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-3)'
    }
  }, children), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border)'
    }
  }), right);
}
Object.assign(window, {
  MacShell,
  SectionLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mac-app/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mac-app/SummaryScreen.jsx
try { (() => {
const {
  Tabs: STabs,
  Button: SButton,
  Toast: SToast,
  SourceChip: SSrc,
  Badge: SBadge,
  Input: SInput,
  Icon: SIcon
} = window.ELIVODesignSystem_a6632d;
function SummaryScreen({
  onBack
}) {
  const [tab, setTab] = React.useState('dec');
  const [toast, setToast] = React.useState(true);
  React.useEffect(() => {
    const id = setTimeout(() => setToast(false), 3200);
    return () => clearTimeout(id);
  }, []);
  const rows = {
    dec: [['維持方案 B，分階段切換', '00:25:40', '取代 8/12 決策 · 未變更'], ['下週三前完成 rollback 文件', '00:28:02', 'Owner：我 · 9/30']],
    act: [['Rollback 流程文件', '00:28:02', '我 · 9/30'], ['更新壓測報告', '00:33:10', '未指定']],
    q: [['全部切換的時程是否需要客戶簽核？', '00:36:44', '未回答']]
  };
  return /*#__PURE__*/React.createElement(MacShell, {
    title: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 13px/1 var(--font-sans)',
        color: 'var(--text-2)'
      }
    }, "\u6703\u5F8C\u6458\u8981"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(SButton, {
      size: "sm",
      variant: "ghost",
      icon: "arrow-left",
      onClick: onBack
    }, "\u6703\u524D\u7C21\u5831"), /*#__PURE__*/React.createElement(SButton, {
      size: "sm",
      variant: "primary",
      icon: "mail"
    }, "\u8D77\u8349\u8FFD\u8E64\u4FE1"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240,
      flex: 'none',
      margin: 12,
      marginRight: 0,
      borderRadius: 'var(--radius-xl)',
      padding: '18px 12px',
      background: 'var(--glass-fill-thin)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-edge)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SInput, {
    icon: "search",
    size: "sm",
    placeholder: "\u641C\u5C0B Ledger"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, [['Acme｜API Migration', '今天', 1], ['Acme｜API Migration', '8/12'], ['Acme｜Kickoff', '7/30'], ['Beta Corp｜Steering', '7/28']].map(([t, d, on], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '9px 12px',
      borderRadius: 12,
      background: on ? 'var(--surface-press)' : 'transparent',
      boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.1)' : 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.35 var(--font-sans)',
      color: on ? 'var(--text-1)' : 'var(--text-2)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.4 var(--font-mono)',
      color: 'var(--text-4)'
    }
  }, d))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '32px 40px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(SBadge, {
    tone: "accent"
  }, "\u5DF2\u5BEB\u5165 Ledger"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: 'var(--text-3)'
    }
  }, "9/29 \xB7 00:41:18")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 28px/1.25 var(--font-sans)',
      letterSpacing: '-0.02em',
      marginTop: 12
    }
  }, "Acme\uFF5CAPI Migration Weekly"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 15px/1.7 var(--font-sans)',
      color: 'var(--text-2)',
      maxWidth: 640,
      marginTop: 10
    }
  }, "\u5718\u968A\u63D0\u51FA\u4E00\u6B21\u5168\u90E8\u5207\u63DB\uFF0C\u8207 8/12 \u5206\u968E\u6BB5\u65B9\u6848 B \u4E0D\u540C\uFF1B\u8A0E\u8AD6\u5F8C\u7DAD\u6301\u65B9\u6848 B\uFF0C\u4E26\u88DC\u4E0A rollback \u8CA0\u8CAC\u4EBA\u3002"), /*#__PURE__*/React.createElement(STabs, {
    style: {
      marginTop: 28,
      marginBottom: 6
    },
    value: tab,
    onChange: setTab,
    items: [{
      id: 'dec',
      label: '決策',
      count: 2
    }, {
      id: 'act',
      label: '待辦',
      count: 2
    }, {
      id: 'q',
      label: '未決問題',
      count: 1
    }]
  }), /*#__PURE__*/React.createElement("div", null, rows[tab].map(([t, c, m], i) => /*#__PURE__*/React.createElement("div", {
    key: tab + i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 200px',
      gap: 16,
      padding: '16px 20px',
      marginTop: 10,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-fill)',
      boxShadow: 'var(--glass-edge)',
      animation: 'elivo-surface var(--dur-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 15px/1.5 var(--font-sans)'
    }
  }, t), /*#__PURE__*/React.createElement(SSrc, {
    label: "\u672C\u5834",
    time: c,
    onClick: () => {},
    style: {
      marginTop: 6
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12.5px/1.5 var(--font-sans)',
      color: 'var(--text-3)',
      textAlign: 'right'
    }
  }, m)))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 24,
      bottom: 24
    }
  }, /*#__PURE__*/React.createElement(SToast, {
    tone: "success",
    title: "\u5DF2\u5BEB\u5165 Decision Ledger",
    body: "2 \u500B\u6C7A\u7B56 \xB7 2 \u500B\u5F85\u8FA6",
    onClose: () => setToast(false)
  }))));
}
window.SummaryScreen = SummaryScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mac-app/SummaryScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AmbientItem = __ds_scope.AmbientItem;

__ds_ns.CARD_TYPES = __ds_scope.CARD_TYPES;

__ds_ns.ContextCard = __ds_scope.ContextCard;

__ds_ns.RecIndicator = __ds_scope.RecIndicator;

__ds_ns.SourceChip = __ds_scope.SourceChip;

__ds_ns.TranscriptLine = __ds_scope.TranscriptLine;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
