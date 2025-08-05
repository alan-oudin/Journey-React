// Utilitaire pour gérer les icônes avec fallback
// Améliore la compatibilité avec Safari et Opera

// Mapping des emojis vers des alternatives textuelles
const ICON_FALLBACKS = {
  // Icônes communes
  '🗑️': '🗑', // Fallback pour poubelle
  '✏️': '✏', // Fallback pour crayon
  '📋': '📋', // Fallback pour presse-papier
  '📅': '📅', // Fallback pour calendrier
  '📊': '📊', // Fallback pour graphique
  '📝': '📝', // Fallback pour note
  '👁️': '👁', // Fallback pour œil
  '⭐': '★', // Fallback pour étoile
  '✅': '✓', // Fallback pour coche verte
  '❌': '✗', // Fallback pour croix rouge
  '🌅': '🌅', // Fallback pour lever de soleil
  '🌆': '🌆', // Fallback pour coucher de soleil
  '👥': '👥', // Fallback pour groupe
  '🔍': '🔍', // Fallback pour loupe
  '⚡': '!', // Fallback pour éclair
  '🔒': '🔒', // Fallback pour cadenas fermé
  '🔓': '🔓', // Fallback pour cadenas ouvert
  '🍽️': '🍽', // Fallback pour restauration
  
  // Fallbacks textuels si les emojis ne fonctionnent pas
  'DELETE': '[Suppr]',
  'EDIT': '[Modif]',
  'VIEW': '[Voir]',
  'ADD': '[Ajout]',
  'CALENDAR': '[Cal]',
  'CHART': '[Graph]',
  'SEARCH': '[Rech]',
  'MORNING': '[Matin]',
  'EVENING': '[Soir]',
  'USERS': '[Users]',
  'WARNING': '[!]',
  'LOCK': '[🔒]',
  'UNLOCK': '[🔓]',
  'RESTAURANT': '[🍽]'
};

// Vérifier si les emojis sont supportés
export function supportsEmoji() {
  // Test simple pour voir si les emojis s'affichent correctement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  canvas.width = canvas.height = 1;
  ctx.textBaseline = 'top';
  ctx.font = '1px Arial';
  
  // Tester avec un emoji simple
  ctx.fillText('😀', 0, 0);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  
  // Si tous les pixels sont transparents, les emojis ne sont pas supportés
  return data[3] > 0;
}

// Détecter le navigateur
export function detectBrowser() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'opera';
  } else if (userAgent.includes('Firefox')) {
    return 'firefox';
  } else if (userAgent.includes('Chrome')) {
    return 'chrome';
  } else if (userAgent.includes('Edge')) {
    return 'edge';
  }
  
  return 'unknown';
}

// Obtenir l'icône appropriée selon le navigateur
export function getIcon(iconKey, fallbackText = '') {
  const browser = detectBrowser();
  const emojiSupported = supportsEmoji();
  
  // Si c'est Safari ancien ou Opera ancien, utiliser des alternatives
  if ((browser === 'safari' || browser === 'opera') && !emojiSupported) {
    return ICON_FALLBACKS[iconKey] || fallbackText || iconKey;
  }
  
  // Utiliser l'icône normale
  return iconKey;
}

// Composant React pour les icônes avec fallback
export function IconWithFallback({ icon, fallback, className = '', title = '' }) {
  const displayIcon = getIcon(icon, fallback);
  
  return (
    <span 
      className={`emoji icon ${className}`}
      title={title}
      role="img" 
      aria-label={title || fallback || icon}
    >
      {displayIcon}
    </span>
  );
}

// Mapping des icônes Material vers des équivalents
const MATERIAL_ICON_FALLBACKS = {
  'lock': '🔒',
  'lock_open': '🔓',
  'home': '🏠',
  'search': '🔍',
  'admin_panel_settings': '⚙️',
  'check_circle': '✅',
  'radio_button_unchecked': '⚪',
  'restaurant': '🍽️',
  'edit': '✏️',
  'delete': '🗑️',
  'visibility': '👁️',
  'person': '👤',
  'group': '👥',
  'calendar_today': '📅',
  'schedule': '⏰',
  'close': '❌',
  'add': '➕',
  'remove': '➖',
  'settings': '⚙️',
  'logout': '🚪',
  'login': '🔑'
};

// Composant pour remplacer wcs-mat-icon avec fallback Safari/Opera
export function MaterialIconWithFallback({ icon, className = '', style = {}, title = '', size = 'm', color = '' }) {
  const browser = detectBrowser();
  const emojiSupported = supportsEmoji();
  
  // Si c'est Safari/Opera et que les emojis ne sont pas bien supportés
  if ((browser === 'safari' || browser === 'opera') && !emojiSupported) {
    const fallbackIcon = MATERIAL_ICON_FALLBACKS[icon] || ICON_FALLBACKS[icon] || `[${icon}]`;
    
    return (
      <span 
        className={`material-icon-fallback ${className}`}
        style={{
          fontSize: size === 's' ? '0.8em' : size === 'l' ? '1.5em' : '1em',
          color: color || 'currentColor',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        title={title}
        role="img"
        aria-label={title || icon}
      >
        {fallbackIcon}
      </span>
    );
  }
  
  // Utiliser l'icône Material normale
  return (
    <wcs-mat-icon 
      icon={icon} 
      className={className} 
      style={style} 
      title={title}
      size={size}
      color={color}
    />
  );
}

// Fonction utilitaire pour ajouter des classes CSS aux icônes
export function addIconClass(element) {
  if (element && element.classList) {
    element.classList.add('emoji', 'icon');
  }
}

// Auto-application des classes aux emojis existants
export function enhanceExistingIcons() {
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceExistingIcons);
    return;
  }
  
  // Trouver tous les éléments contenant des emojis
  const textNodes = document.evaluate(
    '//text()[contains(., "🗑") or contains(., "✏") or contains(., "📋") or contains(., "📅") or contains(., "👥")]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  
  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const node = textNodes.snapshotItem(i);
    const parent = node.parentElement;
    
    if (parent && !parent.classList.contains('icon')) {
      addIconClass(parent);
    }
  }
}

// Initialiser l'amélioration des icônes
enhanceExistingIcons();

const iconUtils = {
  getIcon,
  IconWithFallback,
  MaterialIconWithFallback,
  addIconClass,
  enhanceExistingIcons,
  ICON_FALLBACKS,
  MATERIAL_ICON_FALLBACKS
};

export default iconUtils;